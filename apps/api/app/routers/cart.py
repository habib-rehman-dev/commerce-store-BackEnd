from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user_id
from app.schemas.cart import CartResponse, CartItemCreate, CartItemUpdate
import app.services.cart as cart_service

router = APIRouter()

@router.get("/", response_model=CartResponse)
async def get_cart(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await cart_service.get_or_create_cart(db, user_id)

@router.post("/items", response_model=CartResponse)
async def add_item(
    item_in: CartItemCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await cart_service.add_item_to_cart(db, user_id, item_in)

@router.patch("/items/{item_id}", response_model=CartResponse)
async def update_item(
    item_id: str,
    item_in: CartItemUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await cart_service.update_cart_item(db, user_id, item_id, item_in)

@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_item(
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await cart_service.remove_cart_item(db, user_id, item_id)

@router.delete("/clear", status_code=204)
async def clear(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    await cart_service.clear_cart(db, user_id)
