---
name: sqlalchemy-alembic
description: >-
  Workflows and standards for SQLAlchemy 2.0 (async declarative models) and Alembic database
  migrations supporting SQLite and PostgreSQL.
---

# SQLAlchemy 2.0 & Alembic Guide

## SQLAlchemy 2.0 Standards
- Define models inheriting from `DeclarativeBase`.
- Use typed `Mapped[...]` and `mapped_column(...)`.
- UUID primary keys generated via Python's `uuid.uuid4`.
- Async queries using `select(...)` executed via `await session.execute(stmt)`.

## Alembic Migration Commands
Run from the `apps/api` directory:
- Generate migration:
  `alembic revision --autogenerate -m "description"`
- Apply migrations:
  `alembic upgrade head`
- Rollback:
  `alembic downgrade -1`
