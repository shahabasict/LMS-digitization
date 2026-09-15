from typing import Optional

from ..models.common import PyObjectId
from fastapi import APIRouter, Depends

from ..core.deps import get_db, require_roles
from ..models.enums import Role
from ..schemas.tower import TeamOut, TowerOut
from ..services import admin_service

router = APIRouter(tags=["Master Data"])

manager_or_admin = Depends(require_roles(Role.admin, Role.manager))


@router.get("/towers", response_model=list[TowerOut], dependencies=[manager_or_admin])
def list_towers(db=Depends(get_db)):
    return admin_service.list_towers(db)


@router.get("/teams", response_model=list[TeamOut], dependencies=[manager_or_admin])
def list_teams(tower_id: Optional[PyObjectId] = None, db=Depends(get_db)):
    return admin_service.list_teams(db, tower_id)