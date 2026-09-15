"""Application-level joins/enrichment used when building API response objects."""
from datetime import datetime, timezone

from pymongo.database import Database


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _names_for(db: Database, ids) -> list[str]:
    if not ids:
        return []
    docs = db.teams.find({"_id": {"$in": list(ids)}})
    return [d.get("name") for d in docs if d.get("name")]


def enrich_user(db: Database, doc: dict) -> dict:
    out = dict(doc)
    if out.get("tower_id"):
        tower = db.towers.find_one({"_id": out["tower_id"]})
        out["tower_name"] = tower.get("name") if tower else None
    if out.get("team_id"):
        team = db.teams.find_one({"_id": out["team_id"]})
        out["team_name"] = team.get("name") if team else None
    out["team_names"] = _names_for(db, out.get("team_ids") or [])
    if out.get("manager_id"):
        manager = db.users.find_one({"_id": out["manager_id"]})
        out["manager_name"] = manager.get("name") if manager else None
    return out


def enrich_module(db: Database, doc: dict) -> dict:
    out = dict(doc)
    out["tower_names"] = []
    if out.get("tower_ids"):
        towers = db.towers.find({"_id": {"$in": out["tower_ids"]}})
        out["tower_names"] = [t.get("name") for t in towers if t.get("name")]
    out["team_names"] = _names_for(db, out.get("team_ids") or [])
    if out.get("created_by"):
        creator = db.users.find_one({"_id": out["created_by"]})
        out["created_by_name"] = creator.get("name") if creator else None
    return out


def enrich_assignment(db: Database, doc: dict) -> dict:
    out = dict(doc)
    joiner = db.users.find_one({"_id": out.get("new_joiner_id")}) if out.get("new_joiner_id") else None
    out["new_joiner_name"] = joiner.get("name") if joiner else None

    module = (
        db.training_modules.find_one({"_id": out.get("training_module_id")})
        if out.get("training_module_id")
        else None
    )
    if module:
        out["training_module_name"] = module.get("name")
        out["training_module_content_type"] = module.get("content_type")
        out["training_module_content_url"] = module.get("content_url")
        out["training_module_duration_minutes"] = module.get("duration_minutes")

    assignor = db.users.find_one({"_id": out.get("assigned_by")}) if out.get("assigned_by") else None
    out["assigned_by_name"] = assignor.get("name") if assignor else None

    due = out.get("due_date")
    today = now_utc().date()
    out["overdue"] = bool(
        due and due.date() < today and out.get("status") != "completed"
    )
    return out


def enrich_feedback(db: Database, doc: dict) -> dict:
    out = dict(doc)
    joiner = db.users.find_one({"_id": out.get("new_joiner_id")}) if out.get("new_joiner_id") else None
    out["new_joiner_name"] = joiner.get("name") if joiner else None
    module = (
        db.training_modules.find_one({"_id": out.get("training_module_id")})
        if out.get("training_module_id")
        else None
    )
    out["training_module_name"] = module.get("name") if module else None
    return out