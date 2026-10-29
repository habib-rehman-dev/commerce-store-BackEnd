from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict

class VariantBase(BaseModel):
    sku: str
    attributes: Dict[str, str] = {}
    price: float
    discount_price: Optional[float] = None
    stock: int = 0
    images: List[str] = []

class VariantCreate(VariantBase):
    pass

class VariantUpdate(BaseModel):
    sku: Optional[str] = None
    attributes: Optional[Dict[str, str]] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    stock: Optional[int] = None
    images: Optional[List[str]] = None

class VariantResponse(VariantBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_id: str

class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    category_id: str
    brand_id: str
    images: List[str] = []
    image_public_ids: List[str] = []
    status: str = "active"

class ProductCreate(ProductBase):
    variants: List[VariantCreate]

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    images: Optional[List[str]] = None
    image_public_ids: Optional[List[str]] = None
    status: Optional[str] = None

class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime
    variants: List[VariantResponse] = []
