import asyncio
from typing import Iterable

import cloudinary
from cloudinary import uploader

from app.core.config import settings


def is_configured() -> bool:
    return all(
        (
            settings.CLOUDINARY_CLOUD_NAME,
            settings.CLOUDINARY_API_KEY,
            settings.CLOUDINARY_API_SECRET,
        )
    )


def _configure() -> None:
    if not is_configured():
        raise RuntimeError("Cloudinary is not configured")
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_image(content: bytes, filename: str) -> dict[str, str]:
    _configure()
    result = await asyncio.to_thread(
        uploader.upload,
        content,
        resource_type="image",
        folder="commerce-store/products",
        use_filename=False,
        unique_filename=True,
        filename_override=filename,
    )
    return {
        "url": str(result["secure_url"]),
        "public_id": str(result["public_id"]),
    }


async def delete_images(public_ids: Iterable[str]) -> None:
    ids = [public_id for public_id in public_ids if public_id]
    if not ids:
        return
    _configure()
    for public_id in ids:
        result = await asyncio.to_thread(
            uploader.destroy,
            public_id,
            resource_type="image",
            invalidate=True,
        )
        if result.get("result") not in {"ok", "not found"}:
            raise RuntimeError(
                f"Cloudinary could not delete image '{public_id}'"
            )
