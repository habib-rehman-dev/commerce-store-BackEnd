from typing import Optional, Dict, Any
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.payment import Payment
from app.models.order import Order
from app.core.config import settings

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY

async def create_payment_intent(db: AsyncSession, user_id: str, order_id: str) -> dict:
    res = await db.execute(select(Order).where(Order.id == order_id, Order.user_id == user_id))
    order = res.scalar_one_or_none()
    if not order:
        raise ValueError("Order not found")

    amount_cents = max(50, int(round(order.total * 100)))
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
            stripe.api_key = settings.STRIPE_SECRET_KEY
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
    await db.commit()
    await db.refresh(payment)

    return {
        "payment": payment,
        "client_secret": client_secret
    }

async def create_checkout_session(db: AsyncSession, user_id: str, order_id: str) -> Dict[str, str]:
    res = await db.execute(select(Order).where(Order.id == order_id, Order.user_id == user_id))
    order = res.scalar_one_or_none()
    if not order:
        raise ValueError("Order not found")

    if order.payment_status == "paid":
        return {
            "session_id": f"paid_{order.id[:8]}",
            "url": f"{settings.CLIENT_URL}/checkout/success?order_id={order.id}"
        }

    amount_cents = max(50, int(round(order.total * 100)))

    if settings.STRIPE_SECRET_KEY:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="payment",
                client_reference_id=order.id,
                metadata={"order_id": order.id, "user_id": user_id},
                line_items=[
                    {
                        "price_data": {
                            "currency": order.currency.lower(),
                            "product_data": {
                                "name": f"Commerce Store Order #{order.id[:8]}",
                                "description": f"{len(order.items)} items in order",
                            },
                            "unit_amount": amount_cents,
                        },
                        "quantity": 1,
                    }
                ],
                success_url=f"{settings.CLIENT_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order.id}",
                cancel_url=f"{settings.CLIENT_URL}/checkout?cancelled=true&order_id={order.id}",
            )
            session_id = session.id
            checkout_url = session.url or f"{settings.CLIENT_URL}/checkout/success?session_id={session.id}&order_id={order.id}"
        except stripe.error.StripeError as exc:
            raise ValueError(f"Stripe Checkout error: {exc.user_message or str(exc)}") from exc
    else:
        # Dev / test mode fallback without requiring live Stripe keys
        session_id = f"cs_test_{order.id[:8]}"
        checkout_url = f"{settings.CLIENT_URL}/checkout/success?session_id={session_id}&order_id={order.id}"

    # Upsert pending payment record
    p_res = await db.execute(select(Payment).where(Payment.order_id == order.id))
    payment = p_res.scalar_one_or_none()
    if not payment:
        payment = Payment(
            order_id=order.id,
            user_id=user_id,
            provider="stripe",
            amount=order.total,
            currency=order.currency,
            status="pending",
            stripe_payment_intent_id=session_id
        )
        db.add(payment)
    else:
        payment.stripe_payment_intent_id = session_id

    await db.commit()
    return {"session_id": session_id, "url": checkout_url}

async def verify_checkout_session(db: AsyncSession, session_id: str, order_id: Optional[str] = None) -> Order:
    # 1. Identify order
    target_order_id = order_id
    is_paid = False
    intent_or_session_id = session_id

    if session_id.startswith("cs_test_") or session_id.startswith("paid_"):
        is_paid = True
        if not target_order_id and "_" in session_id:
            # find by session_id prefix in payment record
            res = await db.execute(select(Payment).where(Payment.stripe_payment_intent_id == session_id))
            pay = res.scalar_one_or_none()
            if pay:
                target_order_id = pay.order_id
    elif settings.STRIPE_SECRET_KEY:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status == "paid":
                is_paid = True
            target_order_id = session.metadata.get("order_id") if session.metadata else session.client_reference_id
            intent_or_session_id = session.payment_intent or session.id
        except stripe.error.StripeError as exc:
            raise ValueError(f"Stripe session verification failed: {str(exc)}") from exc
    else:
        is_paid = True

    if not target_order_id:
        raise ValueError("Could not determine order associated with this payment session")

    # 2. Update order and payment in database
    o_res = await db.execute(select(Order).where(Order.id == target_order_id))
    order = o_res.scalar_one_or_none()
    if not order:
        raise ValueError(f"Order {target_order_id} not found")

    if is_paid:
        order.payment_status = "paid"
        if order.status == "pending":
            order.status = "processing"

        # Update or create payment record
        p_res = await db.execute(select(Payment).where(Payment.order_id == order.id))
        payment = p_res.scalar_one_or_none()
        if payment:
            payment.status = "succeeded"
            payment.stripe_payment_intent_id = intent_or_session_id
        else:
            payment = Payment(
                order_id=order.id,
                user_id=order.user_id,
                provider="stripe",
                amount=order.total,
                currency=order.currency,
                status="succeeded",
                stripe_payment_intent_id=intent_or_session_id
            )
            db.add(payment)

        await db.commit()
        await db.refresh(order)

    return order

async def confirm_payment_intent(db: AsyncSession, user_id: str, order_id: str, payment_intent_id: Optional[str] = None) -> Order:
    o_res = await db.execute(select(Order).where(Order.id == order_id))
    order = o_res.scalar_one_or_none()
    if not order:
        raise ValueError(f"Order {order_id} not found")

    order.payment_status = "paid"
    if order.status == "pending":
        order.status = "processing"

    p_res = await db.execute(select(Payment).where(Payment.order_id == order.id))
    payment = p_res.scalar_one_or_none()
    if payment:
        payment.status = "succeeded"
        if payment_intent_id:
            payment.stripe_payment_intent_id = payment_intent_id
    else:
        payment = Payment(
            order_id=order.id,
            user_id=user_id,
            provider="stripe",
            amount=order.total,
            currency=order.currency,
            status="succeeded",
            stripe_payment_intent_id=payment_intent_id or f"pi_{order.id[:8]}"
        )
        db.add(payment)

    await db.commit()
    await db.refresh(order)
    return order
