---
name: fastapi
description: >-
  Expert guidelines and best practices for developing FastAPI applications, async endpoints,
  Pydantic v2 schema validation, dependency injection, and centralized error handling.
---

# FastAPI Development Guide

## Architecture
- Use a 3-layer architecture:
  - **Routers** (`app/routers/`): Parse requests, validate via Pydantic schemas, call services, handle HTTP status codes.
  - **Services** (`app/services/`): Pure business logic, async database transactions.
  - **Models** (`app/models/`): SQLAlchemy ORM models representing database tables.
- **Dependencies** (`app/core/deps.py`): Common dependencies such as `get_db`, `get_current_user_id`, and `require_admin`.

## Best Practices
1. **Async by Default**: All route handlers interacting with the database must be `async def`.
2. **Pydantic v2**: Use `model_config = ConfigDict(from_attributes=True)` on response schemas.
3. **CORS & Middleware**: Always place CORS middleware with exact allowed origins from environment settings.
4. **Exception Handling**: Use `HTTPException` with clear detail messages.
