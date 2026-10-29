from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    res = await db.execute(select(User).where(User.id == user_id))
    return res.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    res = await db.execute(select(User).where(User.email == email))
    return res.scalar_one_or_none()

async def get_users(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[User]:
    res = await db.execute(select(User).offset(skip).limit(limit))
    return list(res.scalars().all())

async def create_user(db: AsyncSession, data: UserCreate) -> User:
    hashed_pwd = get_password_hash(data.password) if data.password else None
    user = User(
        email=data.email,
        name=data.name,
        image=data.image,
        role="customer",
        hashed_password=hashed_pwd
    )
    db.add(user)
    await db.flush()
    return user

async def update_user(db: AsyncSession, user: User, data: UserUpdate) -> User:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    await db.flush()
    return user
