from fastapi import APIRouter, Depends

from ..core.database import db
from ..core.deps import require_roles
from ..models.common import PyObjectId
from ..models.enums import Role
from ..schemas.feedback import FeedbackCreate, FeedbackOut
from ..schemas.training_assignment import TrainingAssignmentOut, TrainingAssignmentStatusUpdate
from ..schemas.user import CurrentUserOut
from ..services import assignment_service, feedback_service, enrich, joiner_service

router = APIRouter(prefix="/me", tags=["My Training (New Joiner)"])


def _joiner(current: dict = Depends(require_roles(Role.new_joiner))) -> dict:
    return current


@router.get("/profile", response_model=CurrentUserOut)
def my_profile(joiner: dict = Depends(_joiner)):
    return CurrentUserOut.from_doc(enrich.enrich_user(db, joiner))


@router.get("/dashboard")
def my_dashboard(joiner: dict = Depends(_joiner)):
    assignments = assignment_service.list_my_assignments(db, joiner)
    summary = joiner_service._assignment_summary(assignments)
    pending = [a for a in assignments if a.status.value != "completed"]
    next_due = None
    if pending:
        with_due = sorted(pending, key=lambda a: (a.due_date is not None, a.due_date or ""))
        next_due = with_due[0]
    profile = CurrentUserOut.from_doc(enrich.enrich_user(db, joiner))
    return {
        "profile": profile,
        "summary": summary,
        "next_due": next_due,
        "recent": assignments[:5],
    }


@router.get("/assignments", response_model=list[TrainingAssignmentOut])
def my_assignments(joiner: dict = Depends(_joiner)):
    return assignment_service.list_my_assignments(db, joiner)


@router.get("/assignments/{assignment_id}", response_model=TrainingAssignmentOut)
def my_assignment(assignment_id: PyObjectId, joiner: dict = Depends(_joiner)):
    return assignment_service.get_my_assignment(db, joiner, assignment_id)


@router.patch("/assignments/{assignment_id}/status", response_model=TrainingAssignmentOut)
def update_my_status(
    assignment_id: PyObjectId,
    payload: TrainingAssignmentStatusUpdate,
    joiner: dict = Depends(_joiner),
):
    return assignment_service.update_my_status(db, joiner, assignment_id, payload)


@router.get("/feedback", response_model=list[FeedbackOut])
def my_feedback(joiner: dict = Depends(_joiner)):
    return feedback_service.list_my_feedback(db, joiner)


@router.post("/feedback", response_model=FeedbackOut, status_code=201)
def submit_feedback(payload: FeedbackCreate, joiner: dict = Depends(_joiner)):
    return feedback_service.create_feedback(db, joiner, payload)