from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.wishlist import Wishlist, WishlistItem
from app.schemas.wishlist import WishlistItemCreate

def wishlist_load_options():
    return [
        selectinload(Wishlist.items).selectinload(WishlistItem.product),
    ]

async def get_or_create_wishlist(db: AsyncSession, user_id: str) -> Wishlist:
    res = await db.execute(
        select(Wishlist)
        .where(Wishlist.user_id == user_id)
        .options(*wishlist_load_options())
    )
    wishlist = res.scalar_one_or_none()
    if not wishlist:
        wishlist = Wishlist(user_id=user_id)
        db.add(wishlist)
        await db.commit()
        res = await db.execute(
            select(Wishlist)
            .where(Wishlist.user_id == user_id)
            .options(*wishlist_load_options())
        )
        wishlist = res.scalar_one()
    return wishlist

async def add_item_to_wishlist(db: AsyncSession, user_id: str, item_in: WishlistItemCreate) -> Wishlist:
    wishlist = await get_or_create_wishlist(db, user_id)
    res = await db.execute(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == item_in.product_id
        )
    )
    if not res.scalar_one_or_none():
        new_item = WishlistItem(
            wishlist_id=wishlist.id,
            product_id=item_in.product_id
        )
        db.add(new_item)
        await db.commit()

    res = await db.execute(
        select(Wishlist)
        .where(Wishlist.id == wishlist.id)
        .options(*wishlist_load_options())
    )
    return res.scalar_one()

async def remove_item_from_wishlist(db: AsyncSession, user_id: str, product_id: str) -> Wishlist:
    wishlist = await get_or_create_wishlist(db, user_id)
    res = await db.execute(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == product_id
        )
    )
    item = res.scalar_one_or_none()
    if item:
        await db.delete(item)
        await db.commit()

    res = await db.execute(
        select(Wishlist)
        .where(Wishlist.id == wishlist.id)
        .options(*wishlist_load_options())
    )
    return res.scalar_one()
