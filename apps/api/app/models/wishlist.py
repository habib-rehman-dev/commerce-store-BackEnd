import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Wishlist(Base):
    __tablename__ = "wishlists"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    items: Mapped[list["WishlistItem"]] = relationship(
        "WishlistItem",
        back_populates="wishlist",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    wishlist_id: Mapped[str] = mapped_column(String, ForeignKey("wishlists.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)

    wishlist: Mapped["Wishlist"] = relationship("Wishlist", back_populates="items")
    product: Mapped["Product"] = relationship("Product", lazy="selectin")
