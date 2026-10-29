---
name: authjs
description: >-
  Implementation guide for Auth.js v5 (NextAuth) in Next.js App Router, JWT session management,
  Google OAuth, credentials authentication, role enforcement, and FastAPI JWT verification.
---

# Auth.js v5 & FastAPI Token Verification Guide

## Frontend Configuration (`apps/web/lib/auth.ts`)
- Configured using `NextAuth({ session: { strategy: "jwt" }, providers: [...] })`.
- JWT callback injects user `id` and `role` into token.
- Session callback exposes `id` and `role` on `session.user`.
- Route protection handled cleanly via `middleware.ts`.

## Backend Verification (`apps/api/app/core/deps.py`)
- FastAPI receives JWT in `Authorization: Bearer <token>`.
- Token verified using `python-jose` with shared `AUTH_SECRET` (HS256).
- `get_current_user_id` extracts `sub` claim.
- `require_admin` ensures `role == "admin"`.
