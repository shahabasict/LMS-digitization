from datetime import datetime, time, timezone
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database

from ..core.deps import is_joiner_in_manager_scope
from ..models.enums import AssignmentStatus, Role
from ..schemas.training_assignment import (
    TrainingAssignmentOut,
    TrainingAssignmentStatusUpdate,
    TrainingAssignmentCreate,
)
from ..services import enrich
from .enrich import now_utc


def _assignment_or_404(db: Database, assignment_id: ObjectId) -> dict:
    doc = db.training_assignments.find_one({"_id": assignment_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Training Assignment not found")
    return doc


def _assert_joiner(ctx_manager: Optional[dict], db: Database, joiner_id: ObjectId) -> dict:
    joiner = db.users.find_one({"_id": joiner_id, "role": Role.new_joiner.value})
    if not joiner:
        raise HTTPException(status_code=422, detail="New Joiner does not exist")
    if ctx_manager and not is_joiner_in_manager_scope(ctx_manager, joiner):
        raise HTTPException(status_code=403, detail="New Joiner is outside your permitted scope")
    return joiner


def create_assignments(db: Database, manager: dict, payload: TrainingAssignmentCreate) -> list[TrainingAssignmentOut]:
    joiners = {
        str(jid): _assert_joiner(manager, db, jid) for jid in payload.new_joiner_ids
    }
    modules: dict[str, dict] = {}
    for mid in payload.training_module_ids:
        mod = db.training_modules.find_one({"_id": mid})
        if not mod:
            raise HTTPException(status_code=422, detail="Training Module does not exist")
        if mod.get("status") != "active":
            raise HTTPException(status_code=422, detail=f"Training Module '{mod.get('name')}' is inactive")
        modules[str(mid)] = mod

    due_date = None
    if payload.due_date is not None:
        due_date = datetime.combine(payload.due_date, time.min, tzinfo=timezone.utc)

    now = now_utc()
    created: list[TrainingAssignmentOut] = []
    for joiner in joiners.values():
        for mod in modules.values():
            existing = db.training_assignments.find_one(
                {"new_joiner_id": joiner["_id"], "training_module_id": mod["_id"]}
            )
            if existing:
                if due_date and existing.get("due_date") is None:
                    db.training_assignments.update_one(
                        {"_id": existing["_id"]}, {"$set": {"due_date": due_date, "updated_at": now}}
                    )
                continue
            result = db.training_assignments.insert_one(
                {
                    "new_joiner_id": joiner["_id"],
                    "training_module_id": mod["_id"],
                    "assigned_by": manager["_id"],
                    "assigned_date": now,
                    "due_date": due_date,
                    "status": AssignmentStatus.not_started.value,
                    "progress": 0,
                    "created_at": now,
                    "updated_at": now,
                }
            )
            doc = db.training_assignments.find_one({"_id": result.inserted_id})
            created.append(TrainingAssignmentOut.from_doc(enrich.enrich_assignment(db, doc)))
    return created


def _scope_joiner_ids(db: Database, manager: dict) -> list[ObjectId]:
    query: dict = {"role": Role.new_joiner.value, "tower_id": manager.get("tower_id")}
    allowed_teams = manager.get("team_ids") or []
    if allowed_teams:
        query["team_id"] = {"$in": list(allowed_teams)}
    return [doc["_id"] for doc in db.users.find(query, {"_id": 1})]


def list_assignments(
    db: Database,
    manager: dict,
    status: Optional[AssignmentStatus] = None,
    new_joiner_id: Optional[ObjectId] = None,
    training_module_id: Optional[ObjectId] = None,
    overdue: Optional[bool] = None,
) -> list[TrainingAssignmentOut]:
    scope_ids = _scope_joiner_ids(db, manager)
    query: dict = {"new_joiner_id": {"$in": scope_ids}}
    if new_joiner_id is not None:
        if new_joiner_id not in scope_ids:
            raise HTTPException(status_code=403, detail="New Joiner outside your permitted scope")
        query["new_joiner_id"] = new_joiner_id
    if status:
        query["status"] = status.value
    if training_module_id:
        query["training_module_id"] = training_module_id
    if overdue is not None:
        today = now_utc().date()
        query["due_date"] = {"$lt": datetime.combine(today, time.min, tzinfo=timezone.utc)}
        query["status"] = status.value if status else {"$ne": AssignmentStatus.completed.value}

    docs = db.training_assignments.find(query).sort("assigned_date", -1)
    return [TrainingAssignmentOut.from_doc(enrich.enrich_assignment(db, doc)) for doc in docs]


def get_assignment(db: Database, manager: dict, assignment_id: ObjectId) -> TrainingAssignmentOut:
    doc = _assignment_or_404(db, assignment_id)
    joiner = db.users.find_one({"_id": doc.get("new_joiner_id")}) if doc.get("new_joiner_id") else None
    if not joiner or not is_joiner_in_manager_scope(manager, joiner):
        raise HTTPException(status_code=404, detail="Training Assignment not found")
    return TrainingAssignmentOut.from_doc(enrich.enrich_assignment(db, doc))


def delete_assignment(db: Database, manager: dict, assignment_id: ObjectId) -> None:
    doc = _assignment_or_404(db, assignment_id)
    joiner = db.users.find_one({"_id": doc.get("new_joiner_id")}) if doc.get("new_joiner_id") else None
    if not joiner or not is_joiner_in_manager_scope(manager, joiner):
        raise HTTPException(status_code=404, detail="Training Assignment not found")
    db.training_assignments.delete_one({"_id": assignment_id})


# --- New Joiner (self-service) operations ---

def list_my_assignments(db: Database, joiner: dict) -> list[TrainingAssignmentOut]:
    docs = db.training_assignments.find(
        {"new_joiner_id": joiner["_id"]}
    ).sort("assigned_date", -1)
    return [TrainingAssignmentOut.from_doc(enrich.enrich_assignment(db, doc)) for doc in docs]


def get_my_assignment(db: Database, joiner: dict, assignment_id: ObjectId) -> TrainingAssignmentOut:
    doc = db.training_assignments.find_one(
        {"_id": assignment_id, "new_joiner_id": joiner["_id"]}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Training Assignment not found")
    return TrainingAssignmentOut.from_doc(enrich.enrich_assignment(db, doc))


def _apply_status(db: Database, doc: dict, payload: TrainingAssignmentStatusUpdate, now: datetime) -> dict:
    set_data: dict = {"updated_at": now}
    status = payload.status.value

    if status == AssignmentStatus.not_started.value:
        set_data["status"] = status
        set_data["progress"] = 0
        set_data["started_date"] = None
        set_data["completed_date"] = None
    elif status == AssignmentStatus.in_progress.value:
        started = doc.get("started_date") or now
        if payload.progress is not None and payload.progress > 0:
            progress = min(payload.progress, 99)
        else:
            progress = max(doc.get("progress") or 0, 10)
            if progress >= 100:
                progress = 99
        set_data["status"] = status
        set_data["progress"] = progress
        set_data["started_date"] = started
        set_data["completed_date"] = None
    elif status == AssignmentStatus.completed.value:
        started = doc.get("started_date") or now
        set_data["status"] = status
        set_data["progress"] = 100
        set_data["started_date"] = started
        set_data["completed_date"] = now

    db.training_assignments.update_one({"_id": doc["_id"]}, {"$set": set_data})
    return db.training_assignments.find_one({"_id": doc["_id"]})


def update_my_status(db: Database, joiner: dict, assignment_id: ObjectId, payload: TrainingAssignmentStatusUpdate) -> TrainingAssignmentOut:
    doc = db.training_assignments.find_one(
        {"_id": assignment_id, "new_joiner_id": joiner["_id"]}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Training Assignment not found")
    updated = _apply_status(db, doc, payload, now_utc())
    return TrainingAssignmentOut.from_doc(enrich.enrich_assignment(db, updated))