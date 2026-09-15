from typing import Optional

from ..models.common import PyObjectId
from fastapi import APIRouter, Depends

from ..core.database import db
from ..core.deps import require_roles
from ..models.enums import AssignmentStatus, Role
from ..schemas.training_assignment import TrainingAssignmentCreate, TrainingAssignmentOut
from ..services import assignment_service

router = APIRouter(prefix="/assignments", tags=["Assignments"])



@router.post("", response_model=list[TrainingAssignmentOut], status_code=201)
def create_assignments(payload: TrainingAssignmentCreate, manager: dict = Depends(require_roles(Role.manager))):
    return assignment_service.create_assignments(db, manager, payload)


@router.get("", response_model=list[TrainingAssignmentOut])
def list_assignments(
    status: Optional[AssignmentStatus] = None,
    new_joiner_id: Optional[PyObjectId] = None,
    training_module_id: Optional[PyObjectId] = None,
    overdue: Optional[bool] = None,
    manager: dict = Depends(require_roles(Role.manager)),
):
    return assignment_service.list_assignments(
        db, manager, status=status, new_joiner_id=new_joiner_id,
        training_module_id=training_module_id, overdue=overdue,
    )


@router.get("/{assignment_id}", response_model=TrainingAssignmentOut)
def get_assignment(assignment_id: PyObjectId, manager: dict = Depends(require_roles(Role.manager))):
    return assignment_service.get_assignment(db, manager, assignment_id)


@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(assignment_id: PyObjectId, manager: dict = Depends(require_roles(Role.manager))):
    assignment_service.delete_assignment(db, manager, assignment_id)
    return None