from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.specification import Specification
from app.schemas.specification import SpecificationCreate, SpecificationUpdate

async def get_by_category(db: AsyncSession, category_id: str) -> List[Specification]:
    res = await db.execute(select(Specification).where(Specification.category_id == category_id))
    return list(res.scalars().all())

async def get_by_id(db: AsyncSession, spec_id: str) -> Optional[Specification]:
    res = await db.execute(select(Specification).where(Specification.id == spec_id))
    return res.scalar_one_or_none()

async def create_specification(db: AsyncSession, data: SpecificationCreate) -> Specification:
    spec = Specification(**data.model_dump())
    db.add(spec)
    await db.flush()
    return spec

async def update_specification(db: AsyncSession, spec: Specification, data: SpecificationUpdate) -> Specification:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(spec, k, v)
    await db.flush()
    return spec

async def delete_specification(db: AsyncSession, spec: Specification) -> None:
    await db.delete(spec)
    await db.flush()
