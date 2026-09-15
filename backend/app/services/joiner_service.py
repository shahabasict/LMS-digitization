import re
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database

from ..core.deps import is_joiner_in_manager_scope
from ..core.security import hash_password
from ..models.enums import AccountStatus, Role
from ..schemas.training_assignment import TrainingAssignmentOut
from ..schemas.user import NewJoinerOut, NewJoinerCreate, NewJoinerUpdate
from ..services import enrich
from .enrich import now_utc


def _joiner_query_for(manager: dict) -> dict:
    query: dict = {"role": Role.new_joiner.value, "tower_id": manager.get("tower_id")}
    allowed_teams = manager.get("team_ids") or []
    if allowed_teams:
        query["team_id"] = {"$in": list(allowed_teams)}
    return query


def _joiner_scope_query(manager: dict, behavior: str = "within") -> dict:
    """Returns a Mongoo query or document-ids filter expression for manager scope."""
    if behavior == "within":
        return _joiner_query_for(manager)
    raise ValueError("Unsupported behavior")


def _get_joiner_in_scope(db: Database, manager: dict, joiner_id: ObjectId) -> dict:
    doc = db.users.find_one({"_id": joiner_id, "role": Role.new_joiner.value})
    if not doc or not is_joiner_in_manager_scope(manager, doc):
        raise HTTPException(status_code=404, detail="New Joiner not found")
    return doc


def _assert_team_in_scope(db: Database, manager: dict, team_id: ObjectId, tower_id) -> None:
    if manager.get("tower_id") != tower_id:
        raise HTTPException(status_code=403, detail="Team/tower outside your permitted scope")
    team = db.teams.find_one({"_id": team_id, "tower_id": tower_id})
    if not team:
        raise HTTPException(status_code=422, detail="Team does not exist in the selected tower")
    allowed_teams = manager.get("team_ids") or []
    if allowed_teams and ObjectId(team_id) not in allowed_teams:
        raise HTTPException(status_code=403, detail="Team is outside your permitted scope")


def create_joiner(db: Database, manager: dict, payload: NewJoinerCreate) -> NewJoinerOut:
    _assert_team_in_scope(db, manager, payload.team_id, payload.tower_id)
    if db.users.find_one({"username": payload.username}):
        raise HTTPException(status_code=409, detail="Username already exists")
    now = now_utc()
    doc = {
        "role": Role.new_joiner.value,
        "name": payload.name,
        "username": payload.username,
        "email": payload.email,
        "employee_id": payload.employee_id,
        "tower_id": payload.tower_id,
        "team_id": payload.team_id,
        "manager_id": manager["_id"],
        "joining_date": payload.joining_date or now,
        "password_hash": hash_password(payload.password),
        "status": AccountStatus.active.value,
        "created_at": now,
        "updated_at": now,
    }
    result = db.users.insert_one(doc)
    created = db.users.find_one({"_id": result.inserted_id})
    return NewJoinerOut.from_doc(enrich.enrich_user(db, created))


def list_joiners(
    db: Database,
    manager: dict,
    search: Optional[str] = None,
    status: Optional[AccountStatus] = None,
    team_id: Optional[ObjectId] = None,
) -> list[NewJoinerOut]:
    query = _joiner_scope_query(manager)
    if status:
        query["status"] = status.value
    if team_id:
        allowed_teams = manager.get("team_ids") or []
        if allowed_teams and team_id not in allowed_teams:
            raise HTTPException(status_code=403, detail="Team outside your permitted scope")
        query["team_id"] = team_id
    if search:
        query["$or"] = [
            {"name": {"$regex": re.escape(search), "$options": "i"}},
            {"username": {"$regex": re.escape(search), "$options": "i"}},
            {"employee_id": {"$regex": re.escape(search), "$options": "i"}},
        ]
    docs = db.users.find(query).sort("created_at", -1)
    return [NewJoinerOut.from_doc(enrich.enrich_user(db, doc)) for doc in docs]


def get_joiner(db: Database, manager: dict, joiner_id: ObjectId) -> NewJoinerOut:
    doc = _get_joiner_in_scope(db, manager, joiner_id)
    return NewJoinerOut.from_doc(enrich.enrich_user(db, doc))


def update_joiner(db: Database, manager: dict, joiner_id: ObjectId, payload: NewJoinerUpdate) -> NewJoinerOut:
    doc = _get_joiner_in_scope(db, manager, joiner_id)
    data = payload.model_dump(exclude_unset=True)
    tower_id = data.get("tower_id", doc.get("tower_id"))
    if data.get("team_id"):
        _assert_team_in_scope(db, manager, data["team_id"], tower_id)
    if data.get("manager_id"):
        target = db.users.find_one({"_id": data["manager_id"], "role": Role.manager.value})
        if not target:
            raise HTTPException(status_code=422, detail="Assigned manager does not exist")
    if data.get("password"):
        data["password_hash"] = hash_password(data.pop("password"))
    data["updated_at"] = now_utc()
    db.users.update_one({"_id": joiner_id}, {"$set": data})
    return get_joiner(db, manager, joiner_id)


def set_joiner_status(db: Database, manager: dict, joiner_id: ObjectId, status: AccountStatus) -> NewJoinerOut:
    _get_joiner_in_scope(db, manager, joiner_id)
    db.users.update_one(
        {"_id": joiner_id},
        {"$set": {"status": status.value, "updated_at": now_utc()}},
    )
    return get_joiner(db, manager, joiner_id)


def get_joiner_progress(db: Database, manager: dict, joiner_id: ObjectId) -> dict:
    doc = _get_joiner_in_scope(db, manager, joiner_id)
    joiner_out = NewJoinerOut.from_doc(enrich.enrich_user(db, doc))
    assignments = list_assignments_for(db, joiner_id)
    summary = _assignment_summary(assignments)
    return {"joiner": joiner_out, "assignments": assignments, "summary": summary}


def list_assignments_for(db: Database, joiner_id: ObjectId) -> list[TrainingAssignmentOut]:
    docs = db.training_assignments.find({"new_joiner_id": joiner_id}).sort("assigned_date", -1)
    return [TrainingAssignmentOut.from_doc(enrich.enrich_assignment(db, doc)) for doc in docs]


def _assignment_summary(assignments: list[TrainingAssignmentOut]) -> dict:
    total = len(assignments)
    completed = sum(1 for a in assignments if a.status.value == "completed")
    in_progress = sum(1 for a in assignments if a.status.value == "in_progress")
    not_started = sum(1 for a in assignments if a.status.value == "not_started")
    overdue = sum(1 for a in assignments if a.overdue)
    return {
        "total_assignments": total,
        "completed": completed,
        "in_progress": in_progress,
        "not_started": not_started,
        "overdue": overdue,
        "completion_percentage": round(completed / total * 100, 1) if total else 0,
    }


def joining_month_threshold(day_offset: int = 0) -> datetime:
    """UTC datetime to compare 'joined within last N days'. Simple prototype helper."""
    return datetime.now(timezone.utc)