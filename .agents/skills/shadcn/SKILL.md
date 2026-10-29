---
name: shadcn
description: >-
  Guide for managing, adding, and customizing shadcn/ui components within the @workspace/ui
  package in a Turborepo monorepo setup.
---

# shadcn/ui in Monorepo Guide

## Overview
In this monorepo, all shadcn components live in `packages/ui/src/components/` and are consumed across applications via:
```tsx
import { Button } from "@workspace/ui/components/button";
```

## Adding New Components
Run the shadcn CLI from `apps/web`:
```bash
cd apps/web
pnpm dlx shadcn@latest add <component-name>
```
The CLI automatically places component source files in `packages/ui/src/components/`.

## Customization
- Utility functions are in `packages/ui/src/lib/utils.ts` (`cn()` helper).
- Theme CSS variables and base tokens are defined in `packages/ui/src/styles/globals.css`.
