from pydantic import model_validator
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def to_async_postgres_url(url: str) -> str:
    """Convert a standard libpq/Neon URL into an asyncpg-compatible URL."""
    parsed = urlsplit(url.replace("postgres://", "postgresql://", 1))
    query = [
        ("ssl" if key == "sslmode" else key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key != "channel_binding"
    ]
    return urlunsplit(
        (
            "postgresql+asyncpg",
            parsed.netloc,
            parsed.path,
            urlencode(query),
            parsed.fragment,
        )
    )


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env.local",
        extra="ignore",
    )

    DATABASE_URL: str = "sqlite+aiosqlite:///./commerce.db"
    DATABASE_URL_POOLED: str = ""
    SYNC_DATABASE_URL: str = "sqlite:///./commerce.db"
    AUTH_SECRET: str = "super-secret-auth-key-change-in-production-123456"
    CLIENT_URL: str = "http://localhost:3000"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    ADMIN_EMAIL: str = "contact.habib.dev@gmail.com"

    @model_validator(mode="after")
    def configure_postgres_drivers(self):
        """Normalize a standard Neon URL for async app queries and Alembic."""
        database_url = self.DATABASE_URL_POOLED or self.DATABASE_URL
        if database_url.startswith(("postgres://", "postgresql://")):
            sync_url = database_url.replace("postgres://", "postgresql://", 1)
            self.SYNC_DATABASE_URL = sync_url
            self.DATABASE_URL = to_async_postgres_url(sync_url)
        return self

settings = Settings()
