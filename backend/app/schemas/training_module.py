from datetime import datetime
from typing import Optional

from pydantic import Field

from ..models.common import DBModel, BaseModel, PyObjectId
from ..models.enums import AccountStatus, ContentType


class TrainingModuleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: Optional[str] = None
    content_type: ContentType
    content_url: str = Field(min_length=1)
    duration_minutes: int = Field(ge=0, le=100000)
    tower_ids: list[PyObjectId] = Field(default_factory=list)
    team_ids: list[PyObjectId] = Field(default_factory=list)


class TrainingModuleUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    description: Optional[str] = None
    content_type: Optional[ContentType] = None
    content_url: Optional[str] = Field(default=None, min_length=1)
    duration_minutes: Optional[int] = Field(default=None, ge=0, le=100000)
    tower_ids: Optional[list[PyObjectId]] = None
    team_ids: Optional[list[PyObjectId]] = None
    status: Optional[AccountStatus] = None


class TrainingModuleOut(DBModel):
    name: str
    description: Optional[str] = None
    content_type: ContentType
    content_url: str
    duration_minutes: int
    tower_ids: list[PyObjectId] = Field(default_factory=list)
    tower_names: list[str] = Field(default_factory=list)
    team_ids: list[PyObjectId] = Field(default_factory=list)
    team_names: list[str] = Field(default_factory=list)
    status: AccountStatus = AccountStatus.active
    created_by_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None