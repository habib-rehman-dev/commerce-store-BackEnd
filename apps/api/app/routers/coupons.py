from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_admin
from app.schemas.coupon import CouponResponse, CouponCreate, CouponUpdate
import app.services.coupon as coupon_service

router = APIRouter()

@router.get("/", response_model=List[CouponResponse])
async def list_coupons(
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    return await coupon_service.get_coupons(db)

@router.get("/code/{code}", response_model=CouponResponse)
async def get_coupon_by_code(code: str, db: AsyncSession = Depends(get_db)):
    coupon = await coupon_service.get_coupon_by_code(db, code)
    if not coupon or coupon.status != "active":
        raise HTTPException(status_code=404, detail="Invalid or expired coupon")
    return coupon

@router.post("/", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    data: CouponCreate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    existing = await coupon_service.get_coupon_by_code(db, data.code)
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    return await coupon_service.create_coupon(db, data)

@router.patch("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: str,
    data: CouponUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    from app.models.coupon import Coupon
    res = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = res.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return await coupon_service.update_coupon(db, coupon, data)

@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coupon(
    coupon_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    from app.models.coupon import Coupon
    res = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = res.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    await coupon_service.delete_coupon(db, coupon)
