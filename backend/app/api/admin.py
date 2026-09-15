from typing import Optional

from ..models.common import PyObjectId
from fastapi import APIRouter, Depends, HTTPException

from ..core.database import db
from ..core.deps import get_current_user
from ..models.enums import AccountStatus, Role
from ..schemas.tower import TeamOut, TeamCreate, TeamUpdate, TowerCreate, TowerOut, TowerUpdate
from ..schemas.user import ManagerCreate, ManagerOut, ManagerUpdate, StatusUpdate
from ..services import admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])


def _admin_dep(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] != Role.admin.value:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user


@router.post("/managers", response_model=ManagerOut, status_code=201)
def create_manager(payload: ManagerCreate, _admin: dict = Depends(_admin_dep)):
    return admin_service.create_manager(db, payload)


@router.get("/managers", response_model=list[ManagerOut])
def list_managers(
    search: Optional[str] = None,
    status: Optional[AccountStatus] = None,
    _admin: dict = Depends(_admin_dep),
):
    return admin_service.list_managers(db, search=search, status=status)


@router.get("/managers/{manager_id}", response_model=ManagerOut)
def get_manager(manager_id: PyObjectId, _admin: dict = Depends(_admin_dep)):
    return admin_service.get_manager(db, manager_id)


@router.put("/managers/{manager_id}", response_model=ManagerOut)
def update_manager(manager_id: PyObjectId, payload: ManagerUpdate, _admin: dict = Depends(_admin_dep)):
    return admin_service.update_manager(db, manager_id, payload)


@router.patch("/managers/{manager_id}/status", response_model=ManagerOut)
def set_manager_status(manager_id: PyObjectId, payload: StatusUpdate, _admin: dict = Depends(_admin_dep)):
    return admin_service.set_manager_status(db, manager_id, payload.status)


# --- Towers ---

@router.post("/towers", response_model=TowerOut, status_code=201)
def create_tower(payload: TowerCreate, _admin: dict = Depends(_admin_dep)):
    return admin_service.create_tower(db, payload.name, payload.description)


@router.put("/towers/{tower_id}", response_model=TowerOut)
def update_tower(tower_id: PyObjectId, payload: TowerUpdate, _admin: dict = Depends(_admin_dep)):
    return admin_service.update_tower(db, tower_id, payload.name, payload.description)


# --- Teams ---

@router.post("/teams", response_model=TeamOut, status_code=201)
def create_team(payload: TeamCreate, _admin: dict = Depends(_admin_dep)):
    return admin_service.create_team(db, payload.name, payload.tower_id, payload.description)


@router.put("/teams/{team_id}", response_model=TeamOut)
def update_team(team_id: PyObjectId, payload: TeamUpdate, _admin: dict = Depends(_admin_dep)):
    return admin_service.update_team(db, team_id, payload.name, payload.description)