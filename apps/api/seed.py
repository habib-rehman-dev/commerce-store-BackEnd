import asyncio
import uuid
from app.core.database import AsyncSessionLocal
from app.models.category import Category
from app.models.brand import Brand
from app.models.product import Product, ProductVariant
from app.models.specification import Specification
from app.models.coupon import Coupon
from app.models.user import User
from app.core.security import get_password_hash

async def seed():
    async with AsyncSessionLocal() as db:
        # Create default Admin and Customer
        admin = User(
            id=str(uuid.uuid4()),
            email="contact.habib.dev@gmail.com",
            name="Store Admin",
            role="admin",
            status="active",
            hashed_password=get_password_hash("admin123")
        )
        # customer = User(
        #     id=str(uuid.uuid4()),
        #     email="customer@commerce.local",
        #     name="John Doe",
        #     role="customer",
        #     status="active",
        #     hashed_password=get_password_hash("password123")
        # )
        # db.add_all([admin, customer])

        # Brands
        apple = Brand(
            id=str(uuid.uuid4()),
            name="Apple",
            slug="apple",
            description="Innovative tech products and accessories."
        )
        nike = Brand(
            id=str(uuid.uuid4()),
            name="Nike",
            slug="nike",
            description="Athletic footwear and apparel."
        )
        sony = Brand(
            id=str(uuid.uuid4()),
            name="Sony",
            slug="sony",
            description="Premium consumer electronics and audio."
        )
        db.add_all([apple, nike, sony])

        # Categories
        electronics = Category(
            id=str(uuid.uuid4()),
            name="Electronics",
            slug="electronics",
            description="Gadgets, laptops, audio and more."
        )
        apparel = Category(
            id=str(uuid.uuid4()),
            name="Apparel & Footwear",
            slug="apparel",
            description="Trending clothes and sneakers."
        )
        db.add_all([electronics, apparel])
        await db.flush()

        # Child category
        smartphones = Category(
            id=str(uuid.uuid4()),
            name="Smartphones",
            slug="smartphones",
            description="Flagship and budget phones.",
            parent_category_id=electronics.id
        )
        db.add(smartphones)
        await db.flush()

        # Specifications
        spec_color = Specification(
            id=str(uuid.uuid4()),
            name="Color",
            category_id=smartphones.id,
            values=["Space Black", "Natural Titanium", "Silver"]
        )
        spec_storage = Specification(
            id=str(uuid.uuid4()),
            name="Storage",
            category_id=smartphones.id,
            values=["128GB", "256GB", "512GB", "1TB"]
        )
        db.add_all([spec_color, spec_storage])

        # Sample Products with Variants
        iphone = Product(
            id=str(uuid.uuid4()),
            name="iPhone 16 Pro Max",
            slug="iphone-16-pro-max",
            description="Super-fast A18 Pro chip with 48MP Fusion camera system and titanium design.",
            category_id=smartphones.id,
            brand_id=apple.id,
            images=["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800"],
            image_public_ids=[]
        )
        db.add(iphone)
        await db.flush()

        v1 = ProductVariant(
            id=str(uuid.uuid4()),
            product_id=iphone.id,
            sku="IPH16PM-BLK-256",
            attributes={"color": "Space Black", "storage": "256GB"},
            price=1199.00,
            discount_price=1149.00,
            stock=45,
            images=["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800"]
        )
        v2 = ProductVariant(
            id=str(uuid.uuid4()),
            product_id=iphone.id,
            sku="IPH16PM-TIT-512",
            attributes={"color": "Natural Titanium", "storage": "512GB"},
            price=1399.00,
            discount_price=None,
            stock=20,
            images=["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800"]
        )
        db.add_all([v1, v2])

        # Sample Coupon
        coupon = Coupon(
            id=str(uuid.uuid4()),
            code="SAVE10",
            discount_type="percentage",
            discount_value=10.0,
            min_order_value=50.0,
            status="active"
        )
        db.add(coupon)

        await db.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
