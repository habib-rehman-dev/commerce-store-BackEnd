from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user_id
from app.schemas.address import AddressResponse, AddressCreate, AddressUpdate
import app.services.address as address_service

router = APIRouter()

@router.get("/", response_model=List[AddressResponse])
async def list_addresses(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await address_service.get_user_addresses(db, user_id)

@router.post("/", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    data: AddressCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await address_service.create_address(db, user_id, data)

@router.patch("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: str,
    data: AddressUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    addr = await address_service.get_address_by_id(db, address_id, user_id)
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    return await address_service.update_address(db, addr, data)

@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    addr = await address_service.get_address_by_id(db, address_id, user_id)
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    await address_service.delete_address(db, addr)
