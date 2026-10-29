# Commerce Store — Full-Stack Monorepo

Modern headless e-commerce store built with **Next.js 15+ App Router**, **FastAPI (async Python)**, **SQLite / PostgreSQL**, **Alembic**, **Auth.js v5 (NextAuth)**, and **shadcn/ui**.

---

## 🏗️ Architecture

```
commerce-store/
├── apps/
│   ├── web/                    # Next.js 15 (App Router) + Tailwind v4 + Auth.js v5
│   └── api/                    # FastAPI + SQLAlchemy 2.0 (async) + Alembic + SQLite
├── packages/
│   ├── ui/                     # @workspace/ui (shadcn components: button, card, input, badge, separator)
│   ├── types/                  # @workspace/types (shared TypeScript contracts)
│   ├── eslint-config/          # Shared ESLint configuration
│   └── typescript-config/      # Shared TypeScript configuration
├── .agents/skills/             # Developer assistant skills (fastapi, nextjs, shadcn, tailwind, authjs)
├── turbo.json                  # Turborepo task pipeline
└── package.json                # Root npm workspace manifest
```

---

## 🚀 Quick Start

### 1. Install Workspace Dependencies
```bash
npm install
```

### 2. Run the FastAPI Backend
```bash
cd apps/api
# The Python virtual environment is already prepared at apps/api/.venv
source .venv/bin/activate

# Run database migrations
alembic upgrade head

# (Optional) Seed initial demo catalog & test accounts
python seed.py

# Start FastAPI server on port 8000
uvicorn app.main:app --reload --port 8000
# Or use the FastAPI CLI from this directory
fastapi dev
```
- On startup, the API creates any missing model tables in the configured database.
  This prevents a fresh local `commerce.db` from failing with `no such table`
  before you seed it.
- Interactive Swagger API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### 3. Run the Next.js Frontend
```bash
# From root
npm run dev
# Or specifically for web:
npm run dev:web
```
- Open `http://localhost:3000` in your browser.

---

## 🔐 Authentication (Auth.js v5)

- **Strategy**: JWT session tokens signed with `AUTH_SECRET` (HS256).
- **FastAPI Token Verification**: FastAPI decodes the token using the shared `AUTH_SECRET`, extracting `sub` as the user ID and validating role privileges (`require_admin`).
- **Demo Accounts (Seeded)**:
  - **Admin**: `admin@commerce.local` / `admin123`
  - **Customer**: `customer@commerce.local` / `password123`
  - **Google OAuth**: Add `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `apps/web/.env.local`.

---

## 🎨 UI Components (shadcn/ui)

Add new components to `@workspace/ui` from inside `apps/web`:
```bash
cd apps/web
npx shadcn@latest add dialog table select
```

---

## 🛠️ Workflows & Skills

Specialized skill guides are located in `.agents/skills/`:
- [FastAPI Best Practices](.agents/skills/fastapi/SKILL.md)
- [Next.js 15 App Router](.agents/skills/nextjs/SKILL.md)
- [shadcn/ui Monorepo](.agents/skills/shadcn/SKILL.md)
- [Tailwind CSS v4](.agents/skills/tailwind/SKILL.md)
- [SQLAlchemy 2.0 & Alembic](.agents/skills/sqlalchemy-alembic/SKILL.md)
- [Auth.js & FastAPI Token Flow](.agents/skills/authjs/SKILL.md)
