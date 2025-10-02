# Copilot Instructions for Vitalink

## Project Architecture

This is a **Next.js hybrid application** using both App Router (`app/`) and Pages Router (`pages/`) simultaneously:

-   **App Router** (`app/`): Primary routing system for new features, supports React Server Components
-   **Pages Router** (`pages/`): Legacy routing, requires `_app.tsx` for global setup

## Test Co-location Pattern

Tests live alongside their source files, not in a separate directory:

-   ✅ `app/counter.tsx` + `app/counter.test.tsx`
-   ✅ `app/page.tsx` + `app/page.test.tsx`
-   ✅ `app/utils/add.ts` + `app/utils/add.test.ts`
-   Exception: `__tests__/` directory exists for Pages Router tests (e.g., `__tests__/index.test.tsx` tests `pages/home/index.tsx`)

## Testing Conventions

### Jest Environment Declaration

All component tests **must** include the jsdom environment comment:

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
```

### Testing Server Components vs Client Components

-   **Server Components** (default in App Router): Test by rendering directly
-   **Client Components** (`"use client"`): Test with state interactions using `fireEvent`
-   Example: `app/counter.test.tsx` tests client state with `fireEvent.click()`

### Server-Only Code

Functions importing `server-only` (like `app/utils/add.ts`) can still be tested with Jest. The setup handles this automatically.

## Path Aliases

Use TypeScript path aliases defined in `tsconfig.json`:

-   `@/components/*` → `components/*`
-   `@/pages/*` → `pages/*`
-   `@/styles/*` → `styles/*`

Example: `import styles from "@/pages/index.module.css"`

## CSS Modules Typing

CSS Modules are typed via `types.d.ts` as objects with string keys. Always import as default:

```tsx
import styles from "./index.module.css";
<div className={styles.container} />;
```

## Development Workflow

-   **Dev server**: `npm run dev` (or `yarn dev`)
-   **Watch tests**: `npm test` (runs Jest in watch mode)
-   **CI tests**: `npm run test:ci` (non-interactive)
-   **Build**: `npm run build`

## Dynamic Routes in App Router

Dynamic route segments use bracket notation and receive params as props:

```tsx
// app/blog/[slug]/page.tsx
type Params = { params: { slug: string } };
export default function Page({ params }: Params) {
    return <h1>Slug: {params.slug}</h1>;
}
```

Test by passing params directly: `<Page params={{ slug: "Test" }} />`
