from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.review import Review
from app.models.order import Order, OrderItem
from app.schemas.review import ReviewCreate, ReviewUpdate

async def get_product_reviews(db: AsyncSession, product_id: str) -> List[Review]:
    res = await db.execute(select(Review).where(Review.product_id == product_id).order_by(Review.created_at.desc()))
    return list(res.scalars().all())

async def get_review_by_id(db: AsyncSession, review_id: str) -> Optional[Review]:
    res = await db.execute(select(Review).where(Review.id == review_id))
    return res.scalar_one_or_none()

async def create_review(db: AsyncSession, user_id: str, data: ReviewCreate) -> Review:
    # Verify purchase if user bought this product in any delivered/paid order
    order_res = await db.execute(
        select(OrderItem).join(Order).where(
            Order.user_id == user_id,
            OrderItem.product_id == data.product_id,
            Order.payment_status == "paid"
        )
    )
    is_verified = order_res.scalar_one_or_none() is not None

    review = Review(
        user_id=user_id,
        product_id=data.product_id,
        rating=data.rating,
        title=data.title,
        comment=data.comment,
        is_verified_purchase=is_verified
    )
    db.add(review)
    await db.flush()
    return review

async def update_review(db: AsyncSession, review: Review, data: ReviewUpdate) -> Review:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(review, k, v)
    await db.flush()
    return review

async def delete_review(db: AsyncSession, review: Review) -> None:
    await db.delete(review)
    await db.flush()
