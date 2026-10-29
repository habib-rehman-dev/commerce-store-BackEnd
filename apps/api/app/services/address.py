from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate

async def get_user_addresses(db: AsyncSession, user_id: str) -> List[Address]:
    res = await db.execute(select(Address).where(Address.user_id == user_id))
    return list(res.scalars().all())

async def get_address_by_id(db: AsyncSession, address_id: str, user_id: str) -> Optional[Address]:
    res = await db.execute(select(Address).where(Address.id == address_id, Address.user_id == user_id))
    return res.scalar_one_or_none()

async def create_address(db: AsyncSession, user_id: str, data: AddressCreate) -> Address:
    if data.is_default:
        await db.execute(
            update(Address).where(Address.user_id == user_id).values(is_default=False)
        )
    addr = Address(user_id=user_id, **data.model_dump())
    db.add(addr)
    await db.flush()
    return addr

async def update_address(db: AsyncSession, address: Address, data: AddressUpdate) -> Address:
    if data.is_default:
        await db.execute(
            update(Address).where(Address.user_id == address.user_id).values(is_default=False)
        )
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(address, k, v)
    await db.flush()
    return address

async def delete_address(db: AsyncSession, address: Address) -> None:
    await db.delete(address)
    await db.flush()
