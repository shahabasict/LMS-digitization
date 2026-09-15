from datetime import datetime
from typing import Optional

from pydantic import Field

from ..models.common import DBModel, BaseModel, PyObjectId


class FeedbackCreate(BaseModel):
    training_module_id: PyObjectId
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)


class FeedbackOut(DBModel):
    new_joiner_id: Optional[PyObjectId] = None
    new_joiner_name: Optional[str] = None
    training_module_id: PyObjectId
    training_module_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None