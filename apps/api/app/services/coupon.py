from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.coupon import Coupon
from app.schemas.coupon import CouponCreate, CouponUpdate

async def get_coupons(db: AsyncSession) -> List[Coupon]:
    res = await db.execute(select(Coupon))
    return list(res.scalars().all())

async def get_coupon_by_code(db: AsyncSession, code: str) -> Optional[Coupon]:
    res = await db.execute(select(Coupon).where(Coupon.code == code.upper()))
    return res.scalar_one_or_none()

async def create_coupon(db: AsyncSession, data: CouponCreate) -> Coupon:
    coupon_data = data.model_dump()
    coupon_data["code"] = coupon_data["code"].upper()
    coupon = Coupon(**coupon_data)
    db.add(coupon)
    await db.flush()
    return coupon

async def update_coupon(db: AsyncSession, coupon: Coupon, data: CouponUpdate) -> Coupon:
    for k, v in data.model_dump(exclude_unset=True).items():
        if k == "code" and v:
            setattr(coupon, k, v.upper())
        else:
            setattr(coupon, k, v)
    await db.flush()
    return coupon

async def delete_coupon(db: AsyncSession, coupon: Coupon) -> None:
    await db.delete(coupon)
    await db.flush()
