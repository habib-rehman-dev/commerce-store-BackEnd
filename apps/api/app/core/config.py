from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite+aiosqlite:///./commerce.db"
    SYNC_DATABASE_URL: str = "sqlite:///./commerce.db"
    AUTH_SECRET: str = "super-secret-auth-key-change-in-production-123456"
    CLIENT_URL: str = "http://localhost:3000"
    
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

settings = Settings()
