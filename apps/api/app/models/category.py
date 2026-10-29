import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    image: Mapped[str | None] = mapped_column(String, nullable=True)
    image_public_id: Mapped[str | None] = mapped_column(String, nullable=True)
    parent_category_id: Mapped[str | None] = mapped_column(String, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String, default="active", nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    parent: Mapped["Category | None"] = relationship(
        "Category",
        remote_side=[id],
        back_populates="children",
        lazy="selectin",
    )
    children: Mapped[list["Category"]] = relationship(
        "Category",
        back_populates="parent",
        lazy="selectin",
    )
