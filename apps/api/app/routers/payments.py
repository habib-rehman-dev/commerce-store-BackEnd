from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user_id
from app.schemas.payment import (
    PaymentResponse,
    PaymentCreateIntent,
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    PaymentVerifyRequest,
    PaymentConfirmRequest
)
from app.schemas.order import OrderResponse
import app.services.payment as payment_service

router = APIRouter()

@router.post("/create-intent", response_model=PaymentResponse)
async def create_intent(
    data: PaymentCreateIntent,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    try:
        res = await payment_service.create_payment_intent(db, user_id, data.order_id)
        payment = res["payment"]
        return PaymentResponse(
            id=payment.id,
            order_id=payment.order_id,
            user_id=payment.user_id,
            provider=payment.provider,
            amount=payment.amount,
            currency=payment.currency,
            status=payment.status,
            stripe_payment_intent_id=payment.stripe_payment_intent_id,
            client_secret=res["client_secret"],
            created_at=payment.created_at,
            updated_at=payment.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    data: CheckoutSessionCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    try:
        res = await payment_service.create_checkout_session(db, user_id, data.order_id)
        return CheckoutSessionResponse(
            session_id=res["session_id"],
            url=res["url"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify-checkout-session", response_model=OrderResponse)
async def verify_checkout_session(
    data: PaymentVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await payment_service.verify_checkout_session(db, data.session_id, data.order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/confirm", response_model=OrderResponse)
async def confirm_payment(
    data: PaymentConfirmRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await payment_service.confirm_payment_intent(
            db, user_id, data.order_id, data.payment_intent_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
