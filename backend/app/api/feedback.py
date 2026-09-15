from typing import Optional

from ..models.common import PyObjectId
from fastapi import APIRouter, Depends

from ..core.database import db
from ..core.deps import require_roles
from ..models.enums import Role
from ..services import feedback_service

router = APIRouter(prefix="/feedback", tags=["Feedback"])



@router.get("")
def list_feedback(
    training_module_id: Optional[PyObjectId] = None,
    new_joiner_id: Optional[PyObjectId] = None,
    manager: dict = Depends(require_roles(Role.manager)),
):
    return feedback_service.list_feedback(
        db, manager, training_module_id=training_module_id, new_joiner_id=new_joiner_id
    )