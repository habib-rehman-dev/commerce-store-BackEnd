from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image: Optional[str] = None
    image_public_id: Optional[str] = None
    parent_category_id: Optional[str] = None
    status: str = "active"
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    image_public_id: Optional[str] = None
    parent_category_id: Optional[str] = None
    status: Optional[str] = None
    sort_order: Optional[int] = None

class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime
    children: Optional[List["CategoryResponse"]] = None
