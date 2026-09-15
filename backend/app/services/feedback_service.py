from typing import Optional

from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database

from ..models.enums import Role
from ..schemas.feedback import FeedbackOut, FeedbackCreate
from ..services import enrich
from .enrich import now_utc


def create_feedback(db: Database, joiner: dict, payload: FeedbackCreate) -> FeedbackOut:
    has_assignment = db.training_assignments.find_one(
        {
            "new_joiner_id": joiner["_id"],
            "training_module_id": payload.training_module_id,
        }
    )
    if not has_assignment:
        raise HTTPException(
            status_code=422,
            detail="Feedback can only be provided for Training Modules assigned to you",
        )
    db.feedback.delete_many(
        {
            "new_joiner_id": joiner["_id"],
            "training_module_id": payload.training_module_id,
        }
    )
    result = db.feedback.insert_one(
        {
            "new_joiner_id": joiner["_id"],
            "training_module_id": payload.training_module_id,
            "rating": payload.rating,
            "comment": payload.comment,
            "created_at": now_utc(),
        }
    )
    doc = db.feedback.find_one({"_id": result.inserted_id})
    return FeedbackOut.from_doc(enrich.enrich_feedback(db, doc))


def list_feedback(
    db: Database,
    manager: dict,
    training_module_id: Optional[ObjectId] = None,
    new_joiner_id: Optional[ObjectId] = None,
) -> list[FeedbackOut]:
    query: dict = {"role": Role.new_joiner.value, "tower_id": manager.get("tower_id")}
    allowed_teams = manager.get("team_ids") or []
    if allowed_teams:
        query["team_id"] = {"$in": list(allowed_teams)}
    scope_ids = [doc["_id"] for doc in db.users.find(query, {"_id": 1})]

    fb_query: dict = {"new_joiner_id": {"$in": scope_ids}}
    if training_module_id:
        fb_query["training_module_id"] = training_module_id
    if new_joiner_id is not None:
        if new_joiner_id not in scope_ids:
            raise HTTPException(status_code=403, detail="New Joiner outside your permitted scope")
        fb_query["new_joiner_id"] = new_joiner_id

    docs = db.feedback.find(fb_query).sort("created_at", -1)
    return [FeedbackOut.from_doc(enrich.enrich_feedback(db, doc)) for doc in docs]


def list_my_feedback(db: Database, joiner: dict) -> list[FeedbackOut]:
    docs = db.feedback.find({"new_joiner_id": joiner["_id"]}).sort("created_at", -1)
    return [FeedbackOut.from_doc(enrich.enrich_feedback(db, doc)) for doc in docs]