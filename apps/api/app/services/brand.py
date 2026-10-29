from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandUpdate

async def get_brands(db: AsyncSession) -> List[Brand]:
    res = await db.execute(select(Brand).order_by(Brand.name.asc()))
    return list(res.scalars().all())

async def get_brand_by_id(db: AsyncSession, brand_id: str) -> Optional[Brand]:
    res = await db.execute(select(Brand).where(Brand.id == brand_id))
    return res.scalar_one_or_none()

async def get_brand_by_slug(db: AsyncSession, slug: str) -> Optional[Brand]:
    res = await db.execute(select(Brand).where(Brand.slug == slug))
    return res.scalar_one_or_none()

async def create_brand(db: AsyncSession, data: BrandCreate) -> Brand:
    brand = Brand(**data.model_dump())
    db.add(brand)
    await db.flush()
    return brand

async def update_brand(db: AsyncSession, brand: Brand, data: BrandUpdate) -> Brand:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(brand, k, v)
    await db.flush()
    return brand

async def delete_brand(db: AsyncSession, brand: Brand) -> None:
    await db.delete(brand)
    await db.flush()
