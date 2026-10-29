from hmac import compare_digest

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.user import AuthResponse, GoogleLoginRequest, LoginRequest, UserCreate, UserResponse
import app.services.user as user_service

router = APIRouter()


@router.post("/google", response_model=AuthResponse)
async def google_login(
    data: GoogleLoginRequest,
    internal_secret: str | None = Header(None, alias="X-Internal-Auth-Secret"),
    db: AsyncSession = Depends(get_db),
):
    """Link a Google-authenticated profile to the local application user."""
    if not internal_secret or not compare_digest(internal_secret, settings.AUTH_SECRET):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid internal authentication")

    user = await user_service.get_user_by_email(db, data.email)
    is_admin = data.email == settings.ADMIN_EMAIL.lower()
    if not user:
        user = User(
            email=data.email,
            name=data.name,
            image=data.image,
            role="admin" if is_admin else "customer",
            status="active",
        )
        db.add(user)
        await db.flush()
    else:
        user.name = data.name or user.name
        user.image = data.image or user.image
        if is_admin:
            user.role = "admin"
        await db.flush()

    return AuthResponse(
        access_token=create_access_token(user.id, user.role, user.email),
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await user_service.get_user_by_email(db, data.email)
    if not user or not user.hashed_password or not verify_password(
        data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive",
        )

    return AuthResponse(
        access_token=create_access_token(user.id, user.role, user.email),
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    if not data.password:
        raise HTTPException(status_code=400, detail="Password is required")
    if await user_service.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = await user_service.create_user(
        db, data.model_copy(update={"role": "customer"})
    )
    return AuthResponse(
        access_token=create_access_token(user.id, user.role, user.email),
        user=UserResponse.model_validate(user),
    )
