from pymongo import ASCENDING, MongoClient
from pymongo.database import Database

from ..core.config import settings

client: MongoClient = MongoClient(settings.mongo_uri)
db: Database = client[settings.mongo_db]


def ensure_indexes() -> None:
    db.users.create_index([("username", ASCENDING)], unique=True)
    db.users.create_index([("role", ASCENDING)])
    db.users.create_index([("tower_id", ASCENDING)])
    db.users.create_index([("team_id", ASCENDING)])
    db.users.create_index([("manager_id", ASCENDING)])

    db.towers.create_index([("name", ASCENDING)], unique=True)
    db.teams.create_index([("name", ASCENDING), ("tower_id", ASCENDING)], unique=True)

    db.training_modules.create_index([("name", ASCENDING)])
    db.training_modules.create_index([("status", ASCENDING)])

    db.training_assignments.create_index(
        [("new_joiner_id", ASCENDING), ("training_module_id", ASCENDING)], unique=True
    )
    db.training_assignments.create_index([("status", ASCENDING)])
    db.training_assignments.create_index([("due_date", ASCENDING)])

    db.feedback.create_index([("new_joiner_id", ASCENDING)])
    db.feedback.create_index([("training_module_id", ASCENDING)])