from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Product, ProductVariant
from app.schemas.product import ProductCreate, ProductUpdate, VariantCreate
from app.core.cloudinary import delete_images

async def get_products(
    db: AsyncSession,
    category_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> List[Product]:
    query = select(Product)
    if category_id:
        query = query.where(Product.category_id == category_id)
    if brand_id:
        query = query.where(Product.brand_id == brand_id)
    if status:
        query = query.where(Product.status == status)
    query = query.offset(skip).limit(limit)
    res = await db.execute(query)
    return list(res.scalars().all())

async def get_product_by_id(db: AsyncSession, product_id: str) -> Optional[Product]:
    res = await db.execute(select(Product).where(Product.id == product_id))
    return res.scalar_one_or_none()

async def get_product_by_slug(db: AsyncSession, slug: str) -> Optional[Product]:
    res = await db.execute(select(Product).where(Product.slug == slug))
    return res.scalar_one_or_none()

async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    prod_data = data.model_dump(exclude={"variants"})
    product = Product(**prod_data)
    db.add(product)
    await db.flush()

    for v in data.variants:
        variant = ProductVariant(
            product_id=product.id,
            **v.model_dump()
        )
        db.add(variant)
    
    await db.flush()
    await db.refresh(product)
    return product

async def update_product(db: AsyncSession, product: Product, data: ProductUpdate) -> Product:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(product, k, v)
    await db.flush()
    await db.refresh(product)
    return product

async def delete_product(db: AsyncSession, product: Product) -> None:
    await delete_images(product.image_public_ids)
    await db.delete(product)
    await db.flush()
