from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.product import ProductResponse

class WishlistItemCreate(BaseModel):
    product_id: str

class WishlistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    wishlist_id: str
    product_id: str
    product: Optional[ProductResponse] = None

class WishlistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    items: List[WishlistItemResponse] = []
    created_at: datetime
    updated_at: datetime
