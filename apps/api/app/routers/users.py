from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user_id, require_admin
from app.schemas.user import UserResponse, UserCreate, UserUpdate
import app.services.user as user_service

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/me", response_model=UserResponse)
async def update_current_profile(
    data: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await user_service.update_user(db, user, data)

@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 50,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    return await user_service.get_users(db, skip=skip, limit=limit)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    existing = await user_service.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await user_service.create_user(db, data)
