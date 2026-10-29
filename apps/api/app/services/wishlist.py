from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.wishlist import Wishlist, WishlistItem
from app.schemas.wishlist import WishlistItemCreate

async def get_or_create_wishlist(db: AsyncSession, user_id: str) -> Wishlist:
    res = await db.execute(select(Wishlist).where(Wishlist.user_id == user_id))
    wishlist = res.scalar_one_or_none()
    if not wishlist:
        wishlist = Wishlist(user_id=user_id)
        db.add(wishlist)
        await db.flush()
        await db.refresh(wishlist)
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
        await db.flush()
        await db.refresh(wishlist)
    return wishlist

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
        await db.flush()
        await db.refresh(wishlist)
    return wishlist
