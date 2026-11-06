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

    # 1. Handle Checkout Session Completed
    if event_type == "checkout.session.completed":
        session_id = data_object.get("id") if isinstance(data_object, dict) else data_object.id
        metadata = data_object.get("metadata", {}) if isinstance(data_object, dict) else (data_object.metadata or {})
        client_ref = data_object.get("client_reference_id") if isinstance(data_object, dict) else data_object.client_reference_id
        order_id = metadata.get("order_id") or client_ref

        if order_id:
            o_res = await db.execute(select(Order).where(Order.id == order_id))
            order = o_res.scalar_one_or_none()
            if order:
                order.payment_status = "paid"
                if order.status == "pending":
                    order.status = "processing"

                # Update or insert payment
                p_res = await db.execute(select(Payment).where(Payment.order_id == order.id))
                payment = p_res.scalar_one_or_none()
                intent_id = (
                    (data_object.get("payment_intent") if isinstance(data_object, dict) else data_object.payment_intent)
                    or session_id
                )
                if payment:
                    payment.status = "succeeded"
                    payment.stripe_payment_intent_id = intent_id
                else:
                    payment = Payment(
                        order_id=order.id,
                        user_id=order.user_id,
                        provider="stripe",
                        amount=order.total,
                        currency=order.currency,
                        status="succeeded",
                        stripe_payment_intent_id=intent_id
                    )
                    db.add(payment)
                await db.commit()

    # 2. Handle Payment Intent Succeeded
    elif event_type == "payment_intent.succeeded":
        intent_id = data_object.get("id") if isinstance(data_object, dict) else data_object.id
        res = await db.execute(select(Payment).where(Payment.stripe_payment_intent_id == intent_id))
        payment = res.scalar_one_or_none()
        if payment:
            payment.status = "succeeded"
            o_res = await db.execute(select(Order).where(Order.id == payment.order_id))
            order = o_res.scalar_one_or_none()
            if order:
                order.payment_status = "paid"
                if order.status == "pending":
                    order.status = "processing"
            await db.commit()

    # 3. Handle Payment Failed
    elif event_type == "payment_intent.payment_failed":
        intent_id = data_object.get("id") if isinstance(data_object, dict) else data_object.id
        res = await db.execute(select(Payment).where(Payment.stripe_payment_intent_id == intent_id))
        payment = res.scalar_one_or_none()
        if payment:
            payment.status = "failed"
            o_res = await db.execute(select(Order).where(Order.id == payment.order_id))
            order = o_res.scalar_one_or_none()
            if order:
                order.payment_status = "failed"
            await db.commit()

    # 4. Handle Refund
    elif event_type == "charge.refunded":
        metadata = data_object.get("metadata", {}) if isinstance(data_object, dict) else (data_object.metadata or {})
        order_id = metadata.get("order_id")
        if order_id:
            o_res = await db.execute(select(Order).where(Order.id == order_id))
            order = o_res.scalar_one_or_none()
            if order:
                order.payment_status = "refunded"
                order.status = "cancelled"
            p_res = await db.execute(select(Payment).where(Payment.order_id == order_id))
            payment = p_res.scalar_one_or_none()
            if payment:
                payment.status = "refunded"
            await db.commit()

    return {"received": True}
