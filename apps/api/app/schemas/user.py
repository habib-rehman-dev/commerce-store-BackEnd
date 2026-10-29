from datetime import datetime
from typing import Optional
import re
from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PASSWORD_PATTERN = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$")

class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    image: Optional[str] = None
    role: str = "customer"
    status: str = "active"

class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)
    name: Optional[str] = None
    image: Optional[str] = None
    role: str = "customer"

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not EMAIL_PATTERN.fullmatch(normalized):
            raise ValueError("Enter a valid email address")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not PASSWORD_PATTERN.match(value):
            raise ValueError("Password must include uppercase, lowercase, and a number")
        return value

class UserUpdate(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime

class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not EMAIL_PATTERN.fullmatch(normalized):
            raise ValueError("Enter a valid email address")
        return normalized

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
