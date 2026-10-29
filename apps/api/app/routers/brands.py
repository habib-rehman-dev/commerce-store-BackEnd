from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_admin
from app.schemas.brand import BrandResponse, BrandCreate, BrandUpdate
import app.services.brand as brand_service

router = APIRouter()

@router.get("/", response_model=List[BrandResponse])
async def list_brands(db: AsyncSession = Depends(get_db)):
    return await brand_service.get_brands(db)

@router.get("/slug/{slug}", response_model=BrandResponse)
async def get_brand_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    brand = await brand_service.get_brand_by_slug(db, slug)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand

@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(brand_id: str, db: AsyncSession = Depends(get_db)):
    brand = await brand_service.get_brand_by_id(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand

@router.post("/", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    data: BrandCreate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    existing = await brand_service.get_brand_by_slug(db, data.slug)
    if existing:
        raise HTTPException(status_code=400, detail="Slug already in use")
    return await brand_service.create_brand(db, data)

@router.patch("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: str,
    data: BrandUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    brand = await brand_service.get_brand_by_id(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return await brand_service.update_brand(db, brand, data)

@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand(
    brand_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    brand = await brand_service.get_brand_by_id(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    await brand_service.delete_brand(db, brand)
