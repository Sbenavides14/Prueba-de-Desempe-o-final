"""Mi único endpoint sin login: aquí entrego el JWT si el usuario y clave son correctos."""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.auth import create_access_token, find_user_by_email, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    user = find_user_by_email(body.email)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña incorrectos.")

    token = create_access_token(email=user["email"], role=user["role"])
    return LoginResponse(access_token=token, role=user["role"])
