from datetime import datetime
from typing import Optional

from pydantic import Field

from ..models.common import DBModel, BaseModel, PyObjectId
from ..models.enums import AccountStatus, Role


class ManagerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    username: str = Field(min_length=3, max_length=60)
    email: Optional[str] = Field(default=None, max_length=120)
    employee_id: Optional[str] = Field(default=None, max_length=60)
    tower_id: PyObjectId
    team_ids: list[PyObjectId] = Field(default_factory=list)
    password: str = Field(min_length=8, max_length=128)


class ManagerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    email: Optional[str] = Field(default=None, max_length=120)
    employee_id: Optional[str] = Field(default=None, max_length=60)
    tower_id: Optional[PyObjectId] = None
    team_ids: Optional[list[PyObjectId]] = None
    status: Optional[AccountStatus] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)


class ManagerOut(DBModel):
    role: Role = Role.manager
    name: str
    username: str
    email: Optional[str] = None
    employee_id: Optional[str] = None
    tower_id: Optional[PyObjectId] = None
    tower_name: Optional[str] = None
    team_ids: list[PyObjectId] = Field(default_factory=list)
    team_names: list[str] = Field(default_factory=list)
    status: AccountStatus = AccountStatus.active
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class NewJoinerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    username: str = Field(min_length=3, max_length=60)
    employee_id: Optional[str] = Field(default=None, max_length=60)
    email: Optional[str] = Field(default=None, max_length=120)
    tower_id: PyObjectId
    team_id: PyObjectId
    joining_date: Optional[datetime] = None
    password: str = Field(min_length=8, max_length=128)


class NewJoinerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    email: Optional[str] = Field(default=None, max_length=120)
    employee_id: Optional[str] = Field(default=None, max_length=60)
    tower_id: Optional[PyObjectId] = None
    team_id: Optional[PyObjectId] = None
    joining_date: Optional[datetime] = None
    manager_id: Optional[PyObjectId] = None
    status: Optional[AccountStatus] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)


class NewJoinerOut(DBModel):
    role: Role = Role.new_joiner
    name: str
    username: str
    email: Optional[str] = None
    employee_id: Optional[str] = None
    tower_id: Optional[PyObjectId] = None
    tower_name: Optional[str] = None
    team_id: Optional[PyObjectId] = None
    team_name: Optional[str] = None
    manager_id: Optional[PyObjectId] = None
    manager_name: Optional[str] = None
    joining_date: Optional[datetime] = None
    status: AccountStatus = AccountStatus.active
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StatusUpdate(BaseModel):
    status: AccountStatus


class CurrentUserOut(DBModel):
    role: Role
    name: str
    username: str
    email: Optional[str] = None
    employee_id: Optional[str] = None
    tower_id: Optional[PyObjectId] = None
    tower_name: Optional[str] = None
    team_id: Optional[PyObjectId] = None
    team_name: Optional[str] = None
    team_ids: list[PyObjectId] = Field(default_factory=list)
    manager_id: Optional[PyObjectId] = None
    manager_name: Optional[str] = None
    joining_date: Optional[datetime] = None
    status: AccountStatus