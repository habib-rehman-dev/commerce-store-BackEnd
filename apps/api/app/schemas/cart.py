from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.product import ProductResponse, VariantResponse

class CartItemCreate(BaseModel):
    product_id: str
    variant_id: str
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    cart_id: str
    product_id: str
    variant_id: str
    quantity: int
    product: Optional[ProductResponse] = None
    variant: Optional[VariantResponse] = None

class CartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    items: List[CartItemResponse] = []
    created_at: datetime
    updated_at: datetime
