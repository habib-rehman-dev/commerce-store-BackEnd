from typing import Optional
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.payment import Payment
from app.models.order import Order
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

async def create_payment_intent(db: AsyncSession, user_id: str, order_id: str) -> dict:
    res = await db.execute(select(Order).where(Order.id == order_id, Order.user_id == user_id))
    order = res.scalar_one_or_none()
    if not order:
        raise ValueError("Order not found")

    amount_cents = int(order.total * 100)
    intent_id = f"pi_mock_{order.id[:8]}"
    client_secret = f"pi_mock_{order.id[:8]}_secret"

    existing = await db.execute(
        select(Payment).where(
            Payment.order_id == order.id,
            Payment.status.in_(["pending", "succeeded"]),
        )
    )
    existing_payment = existing.scalar_one_or_none()
    if existing_payment:
        return {
            "payment": existing_payment,
            "client_secret": client_secret if existing_payment.status == "pending" else None,
        }

    if settings.STRIPE_SECRET_KEY:
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=order.currency.lower(),
                metadata={"order_id": order.id, "user_id": user_id}
            )
            intent_id = intent.id
            client_secret = intent.client_secret
        except stripe.error.StripeError as exc:
            raise ValueError(f"Unable to create Stripe payment: {exc.user_message or str(exc)}") from exc

    payment = Payment(
        order_id=order.id,
        user_id=user_id,
        provider="stripe",
        amount=order.total,
        currency=order.currency,
        status="pending",
        stripe_payment_intent_id=intent_id
    )
    db.add(payment)
    await db.flush()
    await db.refresh(payment)

    return {
        "payment": payment,
        "client_secret": client_secret
    }
