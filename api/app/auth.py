"""Manejo aquí todo lo de login: verificar contraseñas, firmar y validar mis JWT, y exigir roles."""
import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.db import query

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": email, "role": role, "exp": expire}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No pude validar tu sesión. Inicia sesión de nuevo.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if email is None or role is None:
            raise credentials_error
        return {"email": email, "role": role}
    except JWTError:
        raise credentials_error


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Decodifico el token de cada request. Sin token válido, nadie pasa de aquí."""
    return decode_token(token)


def require_role(*allowed_roles: str):
    """Uso esto en cada endpoint que necesite restringir por rol, viewer o admin."""
    def dependency(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tu rol no tiene permiso para esta acción.",
            )
        return user
    return dependency


def find_user_by_email(email: str) -> dict | None:
    rows = query("SELECT email, password_hash, role FROM app.users WHERE email = %s", (email,))
    return rows[0] if rows else None
