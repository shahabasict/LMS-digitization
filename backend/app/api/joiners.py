from typing import Optional

from ..models.common import PyObjectId
from fastapi import APIRouter, Depends

from ..core.database import db
from ..core.deps import require_roles
from ..models.enums import AccountStatus, Role
from ..schemas.user import NewJoinerCreate, NewJoinerOut, NewJoinerUpdate, StatusUpdate
from ..services import joiner_service

router = APIRouter(prefix="/joiners", tags=["New Joiners"])


@router.post("", response_model=NewJoinerOut, status_code=201)
def create_joiner(payload: NewJoinerCreate, manager: dict = Depends(require_roles(Role.manager))):
    return joiner_service.create_joiner(db, manager, payload)


@router.get("", response_model=list[NewJoinerOut])
def list_joiners(
    search: Optional[str] = None,
    status: Optional[AccountStatus] = None,
    team_id: Optional[PyObjectId] = None,
    manager: dict = Depends(require_roles(Role.manager)),
):
    return joiner_service.list_joiners(db, manager, search=search, status=status, team_id=team_id)


@router.get("/{joiner_id}/progress")
def get_joiner_progress(joiner_id: PyObjectId, manager: dict = Depends(require_roles(Role.manager))):
    return joiner_service.get_joiner_progress(db, manager, joiner_id)


@router.get("/{joiner_id}", response_model=NewJoinerOut)
def get_joiner(joiner_id: PyObjectId, manager: dict = Depends(require_roles(Role.manager))):
    return joiner_service.get_joiner(db, manager, joiner_id)


@router.put("/{joiner_id}", response_model=NewJoinerOut)
def update_joiner(joiner_id: PyObjectId, payload: NewJoinerUpdate, manager: dict = Depends(require_roles(Role.manager))):
    return joiner_service.update_joiner(db, manager, joiner_id, payload)


@router.patch("/{joiner_id}/status", response_model=NewJoinerOut)
def set_joiner_status(joiner_id: PyObjectId, payload: StatusUpdate, manager: dict = Depends(require_roles(Role.manager))):
    return joiner_service.set_joiner_status(db, manager, joiner_id, payload.status)