from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.cart import Cart, CartItem
from app.schemas.cart import CartItemCreate, CartItemUpdate

async def get_or_create_cart(db: AsyncSession, user_id: str) -> Cart:
    res = await db.execute(select(Cart).where(Cart.user_id == user_id))
    cart = res.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.flush()
        await db.refresh(cart)
    return cart

async def add_item_to_cart(db: AsyncSession, user_id: str, item_in: CartItemCreate) -> Cart:
    cart = await get_or_create_cart(db, user_id)
    # Check if item exists in cart
    res = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == item_in.product_id,
            CartItem.variant_id == item_in.variant_id
        )
    )
    existing = res.scalar_one_or_none()
    if existing:
        existing.quantity += item_in.quantity
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=item_in.product_id,
            variant_id=item_in.variant_id,
            quantity=item_in.quantity
        )
        db.add(new_item)
    await db.flush()
    await db.refresh(cart)
    return cart

async def update_cart_item(db: AsyncSession, user_id: str, item_id: str, item_in: CartItemUpdate) -> Cart:
    cart = await get_or_create_cart(db, user_id)
    res = await db.execute(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id
        )
    )
    item = res.scalar_one_or_none()
    if item:
        if item_in.quantity <= 0:
            await db.delete(item)
        else:
            item.quantity = item_in.quantity
        await db.flush()
        await db.refresh(cart)
    return cart

async def remove_cart_item(db: AsyncSession, user_id: str, item_id: str) -> Cart:
    cart = await get_or_create_cart(db, user_id)
    res = await db.execute(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id
        )
    )
    item = res.scalar_one_or_none()
    if item:
        await db.delete(item)
        await db.flush()
        await db.refresh(cart)
    return cart

async def clear_cart(db: AsyncSession, user_id: str) -> None:
    cart = await get_or_create_cart(db, user_id)
    for item in cart.items:
        await db.delete(item)
    await db.flush()
