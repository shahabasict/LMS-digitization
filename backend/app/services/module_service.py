import re
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database

from ..models.enums import AccountStatus, ContentType
from ..schemas.training_module import TrainingModuleOut, TrainingModuleCreate, TrainingModuleUpdate
from ..services import enrich
from .enrich import now_utc


def _get_module_or_404(db: Database, module_id: ObjectId) -> dict:
    doc = db.training_modules.find_one({"_id": module_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Training Module not found")
    return doc


def _validate_towers_teams(db: Database, tower_ids, team_ids) -> None:
    if tower_ids:
        count = db.towers.count_documents({"_id": {"$in": list(tower_ids)}})
        if count != len(tower_ids):
            raise HTTPException(status_code=422, detail="One or more towers do not exist")
        if team_ids:
            count = db.teams.count_documents(
                {"_id": {"$in": list(team_ids)}, "tower_id": {"$in": list(tower_ids)}}
            )
            if count != len(team_ids):
                raise HTTPException(status_code=422, detail="One or more teams do not match the selected towers")
    elif team_ids:
        raise HTTPException(status_code=422, detail="Teams require an applicable tower to be selected")


def create_module(db: Database, manager: dict, payload: TrainingModuleCreate) -> TrainingModuleOut:
    _validate_towers_teams(db, payload.tower_ids, payload.team_ids)
    now = now_utc()
    doc = {
        "name": payload.name,
        "description": payload.description,
        "content_type": payload.content_type.value,
        "content_url": payload.content_url,
        "duration_minutes": payload.duration_minutes,
        "tower_ids": list(payload.tower_ids),
        "team_ids": list(payload.team_ids),
        "status": AccountStatus.active.value,
        "created_by": manager["_id"],
        "created_at": now,
        "updated_at": now,
    }
    result = db.training_modules.insert_one(doc)
    created = db.training_modules.find_one({"_id": result.inserted_id})
    return TrainingModuleOut.from_doc(enrich.enrich_module(db, created))


def list_modules(
    db: Database,
    search: Optional[str] = None,
    status: Optional[AccountStatus] = None,
    content_type: Optional[ContentType] = None,
) -> list[TrainingModuleOut]:
    query: dict = {}
    if status:
        query["status"] = status.value
    if content_type:
        query["content_type"] = content_type.value
    if search:
        query["$or"] = [
            {"name": {"$regex": re.escape(search), "$options": "i"}},
            {"description": {"$regex": re.escape(search), "$options": "i"}},
        ]
    docs = db.training_modules.find(query).sort("name", 1)
    return [TrainingModuleOut.from_doc(enrich.enrich_module(db, doc)) for doc in docs]


def get_module(db: Database, module_id: ObjectId) -> TrainingModuleOut:
    doc = _get_module_or_404(db, module_id)
    return TrainingModuleOut.from_doc(enrich.enrich_module(db, doc))


def update_module(db: Database, module_id: ObjectId, payload: TrainingModuleUpdate) -> TrainingModuleOut:
    _get_module_or_404(db, module_id)
    data = payload.model_dump(exclude_unset=True)
    if "tower_ids" in data or "team_ids" in data:
        _validate_towers_teams(
            db, data.get("tower_ids") or [], data.get("team_ids") or []
        )
        data["tower_ids"] = list(data.get("tower_ids") or [])
        data["team_ids"] = list(data.get("team_ids") or [])
    if data.get("content_type"):
        data["content_type"] = data["content_type"].value
    if data.get("status"):
        data["status"] = data["status"].value
    data["updated_at"] = now_utc()
    db.training_modules.update_one({"_id": module_id}, {"$set": data})
    return get_module(db, module_id)


def set_module_status(db: Database, module_id: ObjectId, status: AccountStatus) -> TrainingModuleOut:
    _get_module_or_404(db, module_id)
    db.training_modules.update_one(
        {"_id": module_id}, {"$set": {"status": status.value, "updated_at": now_utc()}}
    )
    return get_module(db, module_id)