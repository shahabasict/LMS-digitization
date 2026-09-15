from typing import Optional

from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database

from ..core.security import hash_password
from ..models.enums import AccountStatus, Role
from ..schemas.tower import TeamOut, TowerOut
from ..schemas.user import ManagerOut, ManagerCreate, ManagerUpdate, NewJoinerOut
from ..services import enrich
from .enrich import now_utc


def _get_manager_or_404(db: Database, manager_id: ObjectId) -> dict:
    doc = db.users.find_one({"_id": manager_id, "role": Role.manager.value})
    if not doc:
        raise HTTPException(status_code=404, detail="Manager not found")
    return doc


def _assert_teams_in_tower(db: Database, team_ids, tower_id) -> None:
    if not team_ids:
        return
    count = db.teams.count_documents(
        {"_id": {"$in": list(team_ids)}, "tower_id": tower_id}
    )
    if count != len(team_ids):
        raise HTTPException(
            status_code=422, detail="One or more teams do not belong to the selected tower"
        )


def create_manager(db: Database, payload: ManagerCreate) -> ManagerOut:
    if db.users.find_one({"username": payload.username}):
        raise HTTPException(status_code=409, detail="Username already exists")
    if not db.towers.find_one({"_id": payload.tower_id}):
        raise HTTPException(status_code=422, detail="Tower does not exist")
    _assert_teams_in_tower(db, payload.team_ids, payload.tower_id)
    now = now_utc()
    doc = {
        "role": Role.manager.value,
        "name": payload.name,
        "username": payload.username,
        "email": payload.email,
        "employee_id": payload.employee_id,
        "tower_id": payload.tower_id,
        "team_ids": list(payload.team_ids),
        "password_hash": hash_password(payload.password),
        "status": AccountStatus.active.value,
        "created_at": now,
        "updated_at": now,
    }
    result = db.users.insert_one(doc)
    created = db.users.find_one({"_id": result.inserted_id})
    return ManagerOut.from_doc(enrich.enrich_user(db, created))


def list_managers(
    db: Database,
    search: Optional[str] = None,
    status: Optional[AccountStatus] = None,
) -> list[ManagerOut]:
    query: dict = {"role": Role.manager.value}
    if status:
        query["status"] = status.value
    if search:
        import re

        query["$or"] = [
            {"name": {"$regex": re.escape(search), "$options": "i"}},
            {"username": {"$regex": re.escape(search), "$options": "i"}},
        ]
    docs = db.users.find(query).sort("name", 1)
    return [ManagerOut.from_doc(enrich.enrich_user(db, doc)) for doc in docs]


def get_manager(db: Database, manager_id: ObjectId) -> ManagerOut:
    doc = _get_manager_or_404(db, manager_id)
    return ManagerOut.from_doc(enrich.enrich_user(db, doc))


def update_manager(db: Database, manager_id: ObjectId, payload: ManagerUpdate) -> ManagerOut:
    doc = _get_manager_or_404(db, manager_id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("tower_id"):
        if not db.towers.find_one({"_id": data["tower_id"]}):
            raise HTTPException(status_code=422, detail="Tower does not exist")
    tower_id = data.get("tower_id", doc.get("tower_id"))
    if "team_ids" in data:
        _assert_teams_in_tower(db, data["team_ids"], tower_id)
        data["team_ids"] = list(data["team_ids"])
    if data.get("password"):
        data["password_hash"] = hash_password(data.pop("password"))
    data["updated_at"] = now_utc()
    db.users.update_one({"_id": manager_id}, {"$set": data})
    return get_manager(db, manager_id)


def set_manager_status(db: Database, manager_id: ObjectId, status: AccountStatus) -> ManagerOut:
    _get_manager_or_404(db, manager_id)
    db.users.update_one(
        {"_id": manager_id},
        {"$set": {"status": status.value, "updated_at": now_utc()}},
    )
    return get_manager(db, manager_id)


def create_tower(db: Database, name: str, description: Optional[str]) -> TowerOut:
    if db.towers.find_one({"name": name}):
        raise HTTPException(status_code=409, detail="Tower name already exists")
    now = now_utc()
    result = db.towers.insert_one(
        {"name": name, "description": description, "created_at": now, "updated_at": now}
    )
    doc = db.towers.find_one({"_id": result.inserted_id})
    return TowerOut.from_doc(doc)


def update_tower(db: Database, tower_id: ObjectId, name: Optional[str], description: Optional[str]) -> TowerOut:
    doc = db.towers.find_one({"_id": tower_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Tower not found")
    data: dict = {"updated_at": now_utc()}
    if name is not None:
        if db.towers.find_one({"name": name, "_id": {"$ne": tower_id}}):
            raise HTTPException(status_code=409, detail="Tower name already exists")
        data["name"] = name
    if description is not None:
        data["description"] = description
    db.towers.update_one({"_id": tower_id}, {"$set": data})
    return TowerOut.from_doc(db.towers.find_one({"_id": tower_id}))


def list_towers(db: Database) -> list[TowerOut]:
    return [TowerOut.from_doc(doc) for doc in db.towers.find().sort("name", 1)]


def create_team(db: Database, name: str, tower_id: ObjectId, description: Optional[str]) -> TeamOut:
    if not db.towers.find_one({"_id": tower_id}):
        raise HTTPException(status_code=422, detail="Tower does not exist")
    if db.teams.find_one({"name": name, "tower_id": tower_id}):
        raise HTTPException(status_code=409, detail="Team already exists in this tower")
    now = now_utc()
    result = db.teams.insert_one(
        {"name": name, "tower_id": tower_id, "description": description, "created_at": now, "updated_at": now}
    )
    doc = db.teams.find_one({"_id": result.inserted_id})
    return _team_out(db, doc)


def update_team(db: Database, team_id: ObjectId, name: Optional[str], description: Optional[str]) -> TeamOut:
    doc = db.teams.find_one({"_id": team_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Team not found")
    data: dict = {"updated_at": now_utc()}
    if name is not None:
        if db.teams.find_one({"name": name, "tower_id": doc["tower_id"], "_id": {"$ne": team_id}}):
            raise HTTPException(status_code=409, detail="Team already exists in this tower")
        data["name"] = name
    if description is not None:
        data["description"] = description
    db.teams.update_one({"_id": team_id}, {"$set": data})
    return _team_out(db, db.teams.find_one({"_id": team_id}))


def list_teams(db: Database, tower_id: Optional[ObjectId] = None) -> list[TeamOut]:
    query: dict = {}
    if tower_id:
        query["tower_id"] = tower_id
    return [_team_out(db, doc) for doc in db.teams.find(query).sort("name", 1)]


def _team_out(db: Database, doc: dict) -> TeamOut:
    out = dict(doc)
    tower = db.towers.find_one({"_id": out.get("tower_id")}) if out.get("tower_id") else None
    out["tower_name"] = tower.get("name") if tower else None
    return TeamOut.from_doc(out)