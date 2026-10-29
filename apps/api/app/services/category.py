from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate

async def get_categories(db: AsyncSession) -> List[Category]:
    res = await db.execute(
        select(Category)
        .options(
            selectinload(Category.children).selectinload(Category.children)
        )
        .order_by(Category.sort_order.asc())
    )
    return list(res.scalars().all())

async def get_category_by_id(db: AsyncSession, category_id: str) -> Optional[Category]:
    res = await db.execute(
        select(Category)
        .options(
            selectinload(Category.children).selectinload(Category.children)
        )
        .where(Category.id == category_id)
    )
    return res.scalar_one_or_none()

async def get_category_by_slug(db: AsyncSession, slug: str) -> Optional[Category]:
    res = await db.execute(select(Category).where(Category.slug == slug))
    return res.scalar_one_or_none()

async def get_children(db: AsyncSession, parent_id: str) -> List[Category]:
    res = await db.execute(
        select(Category)
        .options(selectinload(Category.children))
        .where(Category.parent_category_id == parent_id)
    )
    return list(res.scalars().all())

async def create_category(db: AsyncSession, data: CategoryCreate) -> Category:
    cat = Category(**data.model_dump())
    db.add(cat)
    await db.flush()
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.children))
        .where(Category.id == cat.id)
    )
    return result.scalar_one()

async def update_category(db: AsyncSession, category: Category, data: CategoryUpdate) -> Category:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(category, k, v)
    await db.flush()
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.children))
        .where(Category.id == category.id)
    )
    return result.scalar_one()

async def delete_category(db: AsyncSession, category: Category) -> None:
    await db.delete(category)
    await db.flush()
