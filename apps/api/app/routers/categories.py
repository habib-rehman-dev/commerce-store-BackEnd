from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_admin
from app.schemas.category import CategoryResponse, CategoryCreate, CategoryUpdate
import app.services.category as category_service

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    return await category_service.get_categories(db)

@router.get("/slug/{slug}", response_model=CategoryResponse)
async def get_category_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    cat = await category_service.get_category_by_slug(db, slug)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat

@router.get("/{category_id}/children", response_model=List[CategoryResponse])
async def get_children(category_id: str, db: AsyncSession = Depends(get_db)):
    return await category_service.get_children(db, category_id)

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str, db: AsyncSession = Depends(get_db)):
    cat = await category_service.get_category_by_id(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    existing = await category_service.get_category_by_slug(db, data.slug)
    if existing:
        raise HTTPException(status_code=400, detail="Slug already in use")
    return await category_service.create_category(db, data)

@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    cat = await category_service.get_category_by_id(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return await category_service.update_category(db, cat, data)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    cat = await category_service.get_category_by_id(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await category_service.delete_category(db, cat)
