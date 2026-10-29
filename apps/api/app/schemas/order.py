from datetime import datetime
from typing import Optional, List, Dict, Literal
from pydantic import BaseModel, ConfigDict

class OrderShippingAddressSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str

class OrderItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    product_id: str
    variant_id: str
    product_name: str
    sku: str
    attributes: Dict[str, str] = {}
    unit_price: float
    quantity: int
    line_total: float

class OrderCreate(BaseModel):
    shipping_address: OrderShippingAddressSchema
    coupon_code: Optional[str] = None
    payment_method: Literal["stripe", "cod"] = "stripe"

class OrderStatusUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    cancellation_reason: Optional[str] = None

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    subtotal: float
    discount: float
    coupon_code: Optional[str] = None
    shipping_fee: float
    total: float
    currency: str
    payment_method: str
    status: str
    payment_status: str
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    items: List[OrderItemSchema] = []
    shipping_address: Optional[OrderShippingAddressSchema] = None
    created_at: datetime
    updated_at: datetime
