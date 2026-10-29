from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # noqa: F401
from app.routers import (
    auth, users, categories, brands, products, specifications,
    cart, wishlist, orders, payments, coupons, addresses, reviews
)
from app.webhooks import stripe as stripe_webhook

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="Commerce Store API",
    version="1.0.0",
    description="FastAPI async backend for Commerce Store with SQLite & Alembic",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.CLIENT_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": str(exc)}
    )

# Health endpoint
@app.get("/api/health", tags=["health"])
async def health():
    database = "postgresql" if settings.DATABASE_URL.startswith("postgresql") else "sqlite"
    return {"success": True, "message": "API is running", "database": database}

# Feature Routers
app.include_router(auth.router,           prefix="/api/auth",           tags=["auth"])
app.include_router(users.router,          prefix="/api/users",          tags=["users"])
app.include_router(categories.router,     prefix="/api/categories",     tags=["categories"])
app.include_router(brands.router,         prefix="/api/brands",         tags=["brands"])
app.include_router(products.router,       prefix="/api/products",       tags=["products"])
app.include_router(specifications.router, prefix="/api/specifications", tags=["specifications"])
app.include_router(cart.router,           prefix="/api/cart",           tags=["cart"])
app.include_router(wishlist.router,       prefix="/api/wishlist",       tags=["wishlist"])
app.include_router(orders.router,         prefix="/api/orders",         tags=["orders"])
app.include_router(payments.router,       prefix="/api/payments",       tags=["payments"])
app.include_router(coupons.router,        prefix="/api/coupons",        tags=["coupons"])
app.include_router(addresses.router,      prefix="/api/addresses",      tags=["addresses"])
app.include_router(reviews.router,        prefix="/api/reviews",        tags=["reviews"])
app.include_router(stripe_webhook.router, prefix="/api/webhooks",       tags=["webhooks"])
