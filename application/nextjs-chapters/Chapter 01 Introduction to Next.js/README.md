# Chapter 01 — Introduction to Next.js

## What Is Next.js?

Next.js is a **React framework** built by Vercel that provides structure, features, and optimizations for production React applications.

React is a **library** for building UI. Next.js is a **framework** that handles:
- Routing
- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes
- Code splitting
- Image optimization
- And much more

---

## Why Next.js?

### Problems with plain React (CRA / Vite)

| Problem | Next.js Solution |
|---|---|
| No built-in routing | File-system based routing |
| Client-side only rendering | SSR, SSG, ISR |
| Poor SEO for SPAs | Server-rendered HTML |
| No API layer | Route Handlers (API routes) |
| Manual code splitting | Automatic per-route splitting |
| No image optimization | `next/image` component |
| Complex configuration | Zero-config with sensible defaults |

### Next.js App Router vs Pages Router

Next.js has two routing systems:

- **Pages Router** (`pages/` directory) — the original, stable approach
- **App Router** (`app/` directory) — the modern approach (Next.js 13+), recommended for new projects

This course covers the **App Router** exclusively.

---

## Creating a Next.js Project

```bash
npx create-next-app@latest my-app
```

You'll be asked:
```
✔ Would you like to use TypeScript? → Yes
✔ Would you like to use ESLint? → Yes
✔ Would you like to use Tailwind CSS? → Yes
✔ Would you like to use `src/` directory? → Yes
✔ Would you like to use App Router? → Yes
✔ Would you like to customize the default import alias? → No
```

```bash
cd my-app
npm run dev
```

Open `http://localhost:3000`.

---

## Project Structure

```
my-app/
├── src/
│   └── app/
│       ├── layout.tsx        # Root layout (wraps all pages)
│       ├── page.tsx          # Home page (/)
│       ├── globals.css       # Global styles
│       └── favicon.ico
├── public/                   # Static files (images, fonts)
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript config
├── tailwind.config.ts        # Tailwind config
├── package.json
└── .eslintrc.json
```

---

## Server Components vs Client Components

The most important concept in modern Next.js:

### Server Components (Default)

Every component in the `app/` directory is a **Server Component** by default.

```tsx
// app/page.tsx — this is a Server Component
export default function Home() {
  // This code runs on the SERVER
  console.log('This logs on the server, not the browser');

  return <h1>Hello from the server!</h1>;
}
```

**Server Components can:**
- Access databases directly
- Read files from the filesystem
- Use `async/await` at the component level
- Keep sensitive data (API keys) on the server
- Reduce client-side JavaScript bundle

**Server Components CANNOT:**
- Use `useState`, `useEffect`, or other hooks
- Use browser APIs (`window`, `document`)
- Add event handlers (`onClick`, `onChange`)
- Use Context providers

### Client Components

Add `'use client'` directive to make a component run in the browser:

```tsx
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### When to Use Which?

| Need | Component Type |
|---|---|
| Fetch data | Server |
| Access backend resources | Server |
| Keep sensitive info on server | Server |
| Reduce client JS | Server |
| Interactivity (click, input) | Client |
| useState, useEffect | Client |
| Browser APIs | Client |
| Event listeners | Client |

**Rule of thumb:** Start with Server Components. Only add `'use client'` when you need interactivity.

---

## The Rendering Flow

```
1. User requests /about
2. Next.js server renders the page
3. Server Components execute on the server
4. HTML is sent to the browser
5. Client Components hydrate (attach event handlers)
6. Page becomes interactive
```

This gives you:
- **Fast initial load** (HTML arrives pre-rendered)
- **Good SEO** (crawlers see full HTML)
- **Small bundles** (Server Component code never reaches the browser)

---

## Key Files

### `layout.tsx` — Root Layout

Wraps every page. Must include `<html>` and `<body>`:

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### `page.tsx` — Page Component

Maps to a URL route:

```tsx
// app/page.tsx → /
export default function Home() {
  return <h1>Home Page</h1>;
}

// app/about/page.tsx → /about
export default function About() {
  return <h1>About Page</h1>;
}
```

---

## Next.js vs Other Frameworks

| Feature | Next.js | Remix | Gatsby | Astro |
|---|---|---|---|---|
| React-based | Yes | Yes | Yes | Optional |
| SSR | Yes | Yes | No | Yes |
| SSG | Yes | No | Yes | Yes |
| API Routes | Yes | Loaders | Serverless Functions | Endpoints |
| App Router | Yes | Similar | No | No |
| Edge Runtime | Yes | Yes | No | Yes |

---

## Summary

- Next.js is a **full-stack React framework**
- The **App Router** is the modern way to build Next.js apps
- Components are **Server Components by default**
- Add `'use client'` only when you need interactivity
- `layout.tsx` wraps pages, `page.tsx` defines routes
