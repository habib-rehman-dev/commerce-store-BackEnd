from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_admin
from app.schemas.specification import SpecificationResponse, SpecificationCreate, SpecificationUpdate
import app.services.specification as spec_service

router = APIRouter()

@router.get("/category/{category_id}", response_model=List[SpecificationResponse])
async def get_by_category(category_id: str, db: AsyncSession = Depends(get_db)):
    return await spec_service.get_by_category(db, category_id)

@router.get("/{spec_id}", response_model=SpecificationResponse)
async def get_specification(spec_id: str, db: AsyncSession = Depends(get_db)):
    spec = await spec_service.get_by_id(db, spec_id)
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    return spec

@router.post("/", response_model=SpecificationResponse, status_code=status.HTTP_201_CREATED)
async def create_specification(
    data: SpecificationCreate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    return await spec_service.create_specification(db, data)

@router.patch("/{spec_id}", response_model=SpecificationResponse)
async def update_specification(
    spec_id: str,
    data: SpecificationUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    spec = await spec_service.get_by_id(db, spec_id)
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    return await spec_service.update_specification(db, spec, data)

@router.delete("/{spec_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_specification(
    spec_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    spec = await spec_service.get_by_id(db, spec_id)
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    await spec_service.delete_specification(db, spec)
