from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user_id, require_admin
from app.schemas.order import OrderResponse, OrderCreate, OrderStatusUpdate
import app.services.order as order_service

router = APIRouter()

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await order_service.create_order_from_cart(db, user_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/my-orders", response_model=List[OrderResponse])
async def get_my_orders(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await order_service.get_user_orders(db, user_id)

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    order = await order_service.get_order_by_id(db, order_id)
    if not order or order.user_id != user_id:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/", response_model=List[OrderResponse])
async def list_all_orders(
    skip: int = 0,
    limit: int = 50,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    return await order_service.get_all_orders(db, skip=skip, limit=limit)

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_status(
    order_id: str,
    data: OrderStatusUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    order = await order_service.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return await order_service.update_order_status(db, order, data)
