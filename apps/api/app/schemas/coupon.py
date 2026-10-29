from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class CouponBase(BaseModel):
    code: str
    discount_type: str  # percentage, fixed
    discount_value: float
    min_order_value: Optional[float] = None
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    status: str = "active"

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_order_value: Optional[float] = None
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    status: Optional[str] = None

class CouponResponse(CouponBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    used_count: int
    created_at: datetime
    updated_at: datetime
