from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class SpecificationBase(BaseModel):
    name: str
    category_id: str
    values: List[str]
    status: str = "active"

class SpecificationCreate(SpecificationBase):
    pass

class SpecificationUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    values: Optional[List[str]] = None
    status: Optional[str] = None

class SpecificationResponse(SpecificationBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime
