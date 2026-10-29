from fastapi import APIRouter, Request, HTTPException, status, Depends
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.models.payment import Payment
from app.models.order import Order

router = APIRouter()

@router.post("/stripe")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    event = None
    if settings.STRIPE_WEBHOOK_SECRET and sig_header:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")
    else:
        # Fallback for dev / unverified webhook test
        try:
            import json
            event = json.loads(payload.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")

    event_type = event.get("type") if isinstance(event, dict) else event.type
    data_object = event.get("data", {}).get("object") if isinstance(event, dict) else event.data.object

    if event_type == "payment_intent.succeeded":
        intent_id = data_object.get("id") if isinstance(data_object, dict) else data_object.id
        res = await db.execute(select(Payment).where(Payment.stripe_payment_intent_id == intent_id))
        payment = res.scalar_one_or_none()
        if payment:
            payment.status = "succeeded"
            o_res = await db.execute(select(Order).where(Order.id == payment.order_id))
            order = o_res.scalar_one_or_none()
            if order:
                order.payment_status = "paid"
                order.status = "processing"
            await db.flush()

    return {"received": True}
