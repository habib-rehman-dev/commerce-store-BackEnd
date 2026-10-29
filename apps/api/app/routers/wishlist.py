from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user_id
from app.schemas.wishlist import WishlistResponse, WishlistItemCreate
import app.services.wishlist as wishlist_service

router = APIRouter()

@router.get("/", response_model=WishlistResponse)
async def get_wishlist(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await wishlist_service.get_or_create_wishlist(db, user_id)

@router.post("/items", response_model=WishlistResponse)
async def add_to_wishlist(
    item_in: WishlistItemCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await wishlist_service.add_item_to_wishlist(db, user_id, item_in)

@router.delete("/items/{product_id}", response_model=WishlistResponse)
async def remove_from_wishlist(
    product_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await wishlist_service.remove_item_from_wishlist(db, user_id, product_id)
