from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user_id
from app.schemas.review import ReviewResponse, ReviewCreate, ReviewUpdate
import app.services.review as review_service

router = APIRouter()

@router.get("/product/{product_id}", response_model=List[ReviewResponse])
async def get_reviews(product_id: str, db: AsyncSession = Depends(get_db)):
    return await review_service.get_product_reviews(db, product_id)

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    data: ReviewCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await review_service.create_review(db, user_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Review already exists for this product or invalid data")

@router.patch("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: str,
    data: ReviewUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    review = await review_service.get_review_by_id(db, review_id)
    if not review or review.user_id != user_id:
        raise HTTPException(status_code=404, detail="Review not found or unauthorized")
    return await review_service.update_review(db, review, data)

@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    review = await review_service.get_review_by_id(db, review_id)
    if not review or review.user_id != user_id:
        raise HTTPException(status_code=404, detail="Review not found or unauthorized")
    await review_service.delete_review(db, review)
