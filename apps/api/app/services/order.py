from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.order import Order, OrderItem, OrderShippingAddress
from app.models.cart import Cart, CartItem
from app.models.coupon import Coupon
from app.schemas.order import OrderCreate, OrderStatusUpdate

async def create_order_from_cart(db: AsyncSession, user_id: str, data: OrderCreate) -> Order:
    # 1. Fetch user's cart
    res = await db.execute(select(Cart).where(Cart.user_id == user_id))
    cart = res.scalar_one_or_none()
    if not cart or not cart.items:
        raise ValueError("Cart is empty")

    subtotal = 0.0
    order_items_to_create = []

    for ci in cart.items:
        unit_price = ci.variant.discount_price if ci.variant.discount_price is not None else ci.variant.price
        line_total = unit_price * ci.quantity
        subtotal += line_total
        order_items_to_create.append(
            OrderItem(
                product_id=ci.product_id,
                variant_id=ci.variant_id,
                product_name=ci.product.name,
                sku=ci.variant.sku,
                attributes=ci.variant.attributes,
                unit_price=unit_price,
                quantity=ci.quantity,
                line_total=line_total
            )
        )

    # 2. Check coupon if provided
    discount = 0.0
    if data.coupon_code:
        c_res = await db.execute(select(Coupon).where(Coupon.code == data.coupon_code.upper()))
        coupon = c_res.scalar_one_or_none()
        if coupon and coupon.status == "active":
            if coupon.discount_type == "percentage":
                discount = (subtotal * coupon.discount_value) / 100.0
            else:
                discount = min(coupon.discount_value, subtotal)
            coupon.used_count += 1

    shipping_fee = 0.0 if subtotal > 100 else 10.0
    total = max(0.0, subtotal - discount + shipping_fee)

    # 3. Create order
    order = Order(
        user_id=user_id,
        subtotal=subtotal,
        discount=discount,
        coupon_code=data.coupon_code,
        shipping_fee=shipping_fee,
        total=total,
        currency="usd",
        payment_method=data.payment_method,
        status="pending",
        payment_status="pending"
    )
    db.add(order)
    await db.flush()

    for item in order_items_to_create:
        item.order_id = order.id
        db.add(item)

    shipping_addr = OrderShippingAddress(
        order_id=order.id,
        **data.shipping_address.model_dump()
    )
    db.add(shipping_addr)

    # Clear cart
    for ci in cart.items:
        await db.delete(ci)

    await db.flush()
    await db.refresh(order)
    return order

async def get_user_orders(db: AsyncSession, user_id: str) -> List[Order]:
    res = await db.execute(select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc()))
    return list(res.scalars().all())

async def get_order_by_id(db: AsyncSession, order_id: str) -> Optional[Order]:
    res = await db.execute(select(Order).where(Order.id == order_id))
    return res.scalar_one_or_none()

async def get_all_orders(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Order]:
    res = await db.execute(select(Order).order_by(Order.created_at.desc()).offset(skip).limit(limit))
    return list(res.scalars().all())

async def update_order_status(db: AsyncSession, order: Order, data: OrderStatusUpdate) -> Order:
    if data.status:
        order.status = data.status
        if data.status == "cancelled":
            order.cancelled_at = datetime.now(timezone.utc)
            order.cancellation_reason = data.cancellation_reason
    if data.payment_status:
        order.payment_status = data.payment_status
    await db.flush()
    await db.refresh(order)
    return order
