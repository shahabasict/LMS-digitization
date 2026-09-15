from datetime import date, datetime
from typing import Optional

from pydantic import Field, field_validator

from ..models.common import DBModel, BaseModel, PyObjectId
from ..models.enums import AssignmentStatus


class TrainingAssignmentCreate(BaseModel):
    new_joiner_ids: list[PyObjectId] = Field(min_length=1)
    training_module_ids: list[PyObjectId] = Field(min_length=1)
    due_date: Optional[date] = None


class TrainingAssignmentStatusUpdate(BaseModel):
    status: AssignmentStatus
    progress: Optional[int] = Field(default=None, ge=0, le=100)


class TrainingAssignmentOut(DBModel):
    new_joiner_id: PyObjectId
    new_joiner_name: Optional[str] = None
    training_module_id: PyObjectId
    training_module_name: Optional[str] = None
    training_module_content_type: Optional[str] = None
    training_module_content_url: Optional[str] = None
    training_module_duration_minutes: Optional[int] = None
    assigned_by: Optional[PyObjectId] = None
    assigned_by_name: Optional[str] = None
    assigned_date: Optional[datetime] = None
    due_date: Optional[date] = None
    status: AssignmentStatus = AssignmentStatus.not_started
    progress: int = 0
    overdue: bool = False
    started_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("due_date", mode="before")
    @classmethod
    def coerce_datetime_to_date(cls, value):
        if isinstance(value, datetime):
            return value.date()
        return value