from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_admin
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate
from app.core.cloudinary import is_configured, upload_image
import app.services.product as product_service

router = APIRouter()


@router.post("/images", status_code=status.HTTP_201_CREATED)
async def upload_product_image(
    image: UploadFile = File(...),
    admin=Depends(require_admin),
):
    if not is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary is not configured",
        )
    if image.content_type not in {"image/jpeg", "image/png", "image/webp", "image/gif"}:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, WebP, and GIF images are supported")

    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="Image file is empty")
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be 10 MB or smaller")

    try:
        return await upload_image(content, image.filename or "product-image")
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Cloudinary upload failed",
        ) from exc

@router.get("/", response_model=List[ProductResponse])
async def list_products(
    categoryId: Optional[str] = Query(None),
    brandId: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    return await product_service.get_products(
        db,
        category_id=categoryId,
        brand_id=brandId,
        status=status,
        skip=skip,
        limit=limit
    )

@router.get("/slug/{slug}", response_model=ProductResponse)
async def get_product_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    product = await product_service.get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    product = await product_service.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    existing = await product_service.get_product_by_slug(db, data.slug)
    if existing:
        raise HTTPException(status_code=400, detail="Product slug already exists")
    return await product_service.create_product(db, data)

@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    product = await product_service.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return await product_service.update_product(db, product, data)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    product = await product_service.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    try:
        await product_service.delete_product(db, product)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
