from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class BrandBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    logo: Optional[str] = None
    logo_public_id: Optional[str] = None
    status: str = "active"

class BrandCreate(BrandBase):
    pass

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    logo_public_id: Optional[str] = None
    status: Optional[str] = None

class BrandResponse(BrandBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime
