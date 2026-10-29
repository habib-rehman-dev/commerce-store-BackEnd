from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.schemas.user import AuthResponse, LoginRequest, UserCreate, UserResponse
import app.services.user as user_service

router = APIRouter()


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
