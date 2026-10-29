from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = None
    comment: str

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    product_id: str
    rating: int
    title: Optional[str] = None
    comment: str
    is_verified_purchase: bool
    created_at: datetime
    updated_at: datetime
