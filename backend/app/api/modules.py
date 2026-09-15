from typing import Optional

from ..models.common import PyObjectId
from fastapi import APIRouter, Depends

from ..core.database import db
from ..core.deps import require_roles
from ..models.enums import AccountStatus, ContentType, Role
from ..schemas.training_module import TrainingModuleCreate, TrainingModuleOut, TrainingModuleUpdate
from ..schemas.user import StatusUpdate
from ..services import module_service

router = APIRouter(prefix="/training-modules", tags=["Training Modules"])



@router.post("", response_model=TrainingModuleOut, status_code=201)
def create_module(payload: TrainingModuleCreate, manager: dict = Depends(require_roles(Role.manager))):
    return module_service.create_module(db, manager, payload)


@router.get("", response_model=list[TrainingModuleOut])
def list_modules(
    search: Optional[str] = None,
    status: Optional[AccountStatus] = None,
    content_type: Optional[ContentType] = None,
    _manager: dict = Depends(require_roles(Role.manager)),
):
    return module_service.list_modules(db, search=search, status=status, content_type=content_type)


@router.get("/{module_id}", response_model=TrainingModuleOut)
def get_module(module_id: PyObjectId, _manager: dict = Depends(require_roles(Role.manager))):
    return module_service.get_module(db, module_id)


@router.put("/{module_id}", response_model=TrainingModuleOut)
def update_module(module_id: PyObjectId, payload: TrainingModuleUpdate, _manager: dict = Depends(require_roles(Role.manager))):
    return module_service.update_module(db, module_id, payload)


@router.patch("/{module_id}/status", response_model=TrainingModuleOut)
def set_module_status(module_id: PyObjectId, payload: StatusUpdate, _manager: dict = Depends(require_roles(Role.manager))):
    return module_service.set_module_status(db, module_id, payload.status)