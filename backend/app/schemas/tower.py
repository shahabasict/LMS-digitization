from datetime import datetime
from typing import Optional

from pydantic import Field

from ..models.common import DBModel, BaseModel, PyObjectId


class TowerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = None


class TowerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = None


class TowerOut(DBModel):
    name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    tower_id: PyObjectId
    description: Optional[str] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = None


class TeamOut(DBModel):
    name: str
    tower_id: PyObjectId
    tower_name: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None