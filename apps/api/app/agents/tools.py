from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.product import Product
from app.models.order import Order
from app.models.coupon import Coupon

async def search_catalog(db: AsyncSession, query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Search products in catalog by name or description."""
    stmt = select(Product).where(
        or_(
            Product.name.ilike(f"%{query}%"),
            Product.description.ilike(f"%{query}%")
        )
    ).limit(limit)
    res = await db.execute(stmt)
    products = res.scalars().all()
    
    output = []
    for p in products:
        variant = p.variants[0] if p.variants else None
        output.append({
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "price": variant.discount_price if variant and variant.discount_price else (variant.price if variant else 0.0),
            "description": p.description,
            "image": p.images[0] if p.images else None
        })
    return output

async def check_order_status(db: AsyncSession, order_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Look up order fulfillment and payment status."""
    stmt = select(Order).where(Order.id == order_id)
    if user_id:
        stmt = stmt.where(Order.user_id == user_id)
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        return None
    
    return {
        "order_id": order.id,
        "status": order.status,
        "payment_status": order.payment_status,
        "total": order.total,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items_count": len(order.items)
    }

async def get_active_coupons(db: AsyncSession) -> List[Dict[str, Any]]:
    """Retrieve active promotion codes available for customers."""
    res = await db.execute(select(Coupon).where(Coupon.status == "active"))
    coupons = res.scalars().all()
    return [
        {
            "code": c.code,
            "type": c.discount_type,
            "value": c.discount_value,
            "min_order": c.min_order_value
        }
        for c in coupons
    ]
