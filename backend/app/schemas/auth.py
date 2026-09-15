from pydantic import Field

from ..models.common import BaseModel
from ..schemas.user import CurrentUserOut


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CurrentUserOut