---
name: nextjs
description: >-
  Best practices for Next.js 15+ App Router, React 19 Server Components, Server Actions,
  client vs server boundaries, routing, and Turbopack optimization in a monorepo.
---

# Next.js 15+ App Router Guide

## Core Principles
1. **Server Components by Default**:
   - Keep page components as React Server Components (RSC) for data fetching.
   - Add `"use client"` only when interactive state (`useState`, `useEffect`, event handlers) or browser APIs are required.
2. **Monorepo Imports**:
   - Shared UI components come from `@workspace/ui/components/<name>`.
   - Utility functions come from `@workspace/ui/lib/utils`.
3. **Data Fetching**:
   - Fetch data on the server when possible and pass down as props.
   - For authenticated requests from Server Components or route handlers, attach the Auth.js session token to the `Authorization: Bearer <token>` header.
4. **Environment Variables**:
   - Server-only: `API_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
   - Browser-accessible: `NEXT_PUBLIC_*`.
