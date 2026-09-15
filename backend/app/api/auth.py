from fastapi import APIRouter, Depends, HTTPException

from ..core.database import db
from ..core.deps import get_current_user
from ..core.security import create_access_token
from ..schemas.auth import LoginRequest, TokenResponse
from ..schemas.user import CurrentUserOut
from ..services import enrich
from ..services.auth_service import authenticate

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    user = authenticate(db, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(str(user["_id"]), user["role"], user["name"])
    current = CurrentUserOut.from_doc(enrich.enrich_user(db, user))
    return TokenResponse(access_token=token, user=current)


@router.get("/me", response_model=CurrentUserOut)
def me(current_user: dict = Depends(get_current_user)):
    return CurrentUserOut.from_doc(enrich.enrich_user(db, current_user))