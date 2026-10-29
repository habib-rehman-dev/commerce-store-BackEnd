---
name: tailwind
description: >-
  Rules and patterns for Tailwind CSS v4 in Next.js and workspace packages, using
  CSS-first configuration and @theme directives.
---

# Tailwind CSS v4 Guide

## Core Concepts
1. **CSS-First Configuration**:
   - Tailwind v4 uses `@import "tailwindcss";` in CSS rather than a javascript configuration file.
   - Design tokens and theme customizations are placed under `@theme { ... }` in CSS.
2. **Monorepo Styling**:
   - `packages/ui/src/styles/globals.css` is the single source of truth for styles and CSS variables.
   - `apps/web/app/layout.tsx` imports `@workspace/ui/globals.css`.
3. **Class Merging**:
   - Always merge dynamic class names with the `cn()` helper from `@workspace/ui/lib/utils`.
