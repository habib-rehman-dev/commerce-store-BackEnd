from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class PaymentCreateIntent(BaseModel):
    order_id: str

class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    order_id: str
    user_id: str
    provider: str
    amount: float
    currency: str
    status: str
    stripe_payment_intent_id: str
    client_secret: Optional[str] = None
    created_at: datetime
    updated_at: datetime
