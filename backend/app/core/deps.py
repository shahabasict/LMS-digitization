from typing import Callable, Optional

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.database import Database

from ..core.database import db as _db
from ..core.security import decode_token
from ..models.enums import Role

bearer_scheme = HTTPBearer(auto_error=False)


def get_db() -> Database:
    return _db


def get_current_user(
    db: Database = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    try:
        payload = decode_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user = db.users.find_one({"_id": ObjectId(payload["sub"]), "status": "active"})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is disabled or no longer exists",
        )
    return user


def require_roles(*roles: Role) -> Callable:
    allowed = {role.value for role in roles}

    def checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return checker


def is_joiner_in_manager_scope(manager: dict, joiner: dict) -> bool:
    """Returns True when the given new joiner belongs to the manager's tower/team scope."""
    if joiner.get("role") != Role.new_joiner.value:
        return False
    if joiner.get("tower_id") != manager.get("tower_id"):
        return False
    allowed_teams = manager.get("team_ids") or []
    team_id = joiner.get("team_id")
    if allowed_teams and team_id not in allowed_teams:
        return False
    return True


def objects_from_ids(document_ids: list[str], field: str) -> list[ObjectId]:
    try:
        return [ObjectId(value) for value in document_ids]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid {field} identifier provided",
        )