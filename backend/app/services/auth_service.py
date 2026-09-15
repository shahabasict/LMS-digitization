from ..core.security import verify_password


def authenticate(db, username: str, password: str):
    user = db.users.find_one({"username": username})
    if not user or user.get("status") != "active":
        return None
    if not verify_password(password, user.get("password_hash") or ""):
        return None
    return user