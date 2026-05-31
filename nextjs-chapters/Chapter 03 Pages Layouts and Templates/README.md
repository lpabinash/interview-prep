# Chapter 03 — Pages, Layouts, and Templates

## Pages

A `page.tsx` is the **unique UI** for a route. It's the leaf node that makes a route publicly accessible.

```tsx
// app/page.tsx → /
export default function Home() {
  return (
    <main>
      <h1>Welcome to our app</h1>
    </main>
  );
}

// app/dashboard/page.tsx → /dashboard
export default function Dashboard() {
  return <h1>Dashboard</h1>;
}
```

Pages are **Server Components** by default. They can be `async`:

```tsx
// app/users/page.tsx
export default async function UsersPage() {
  const users = await fetch('https://api.example.com/users').then(r => r.json());

  return (
    <ul>
      {users.map((user: { id: number; name: string }) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

---

## Layouts

A `layout.tsx` wraps child pages and **persists across navigations**. The layout does NOT re-render when navigating between child routes.

### Root Layout (Required)

```tsx
// app/layout.tsx — MUST exist, MUST include <html> and <body>
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'My App',
  description: 'A Next.js application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>© 2024</footer>
      </body>
    </html>
  );
}
```

### Nested Layouts

Layouts can be nested — each segment can have its own layout:

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <aside className="w-64">
        <nav>
          <a href="/dashboard">Overview</a>
          <a href="/dashboard/analytics">Analytics</a>
          <a href="/dashboard/settings">Settings</a>
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

**Rendering hierarchy:**

```
RootLayout
└── DashboardLayout
    └── page.tsx
```

When navigating from `/dashboard` to `/dashboard/settings`:
- `RootLayout` does NOT re-render
- `DashboardLayout` does NOT re-render
- Only the `page.tsx` changes

### Layout Rules

1. Root layout is **required** and must include `<html>` and `<body>`
2. Layouts **cannot** access `pathname` (they're Server Components)
3. Layouts **do not** re-render — state is preserved
4. Layouts **cannot** pass data to children via props (use `fetch` or context)

---

## Templates

`template.tsx` is similar to `layout.tsx` but **re-mounts** on navigation (creates a new instance).

```tsx
// app/dashboard/template.tsx
'use client';

import { useEffect } from 'react';

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Runs on every navigation within /dashboard/*
    console.log('Page view logged');
  }, []);

  return <div>{children}</div>;
}
```

**When to use template vs layout:**

| Feature | Layout | Template |
|---|---|---|
| Re-renders on navigation | No | Yes |
| State preserved | Yes | No |
| Effects re-run | No | Yes |
| Use case | Persistent shell | Analytics, animations |

---

## Loading UI

`loading.tsx` creates an automatic `<Suspense>` boundary:

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}
```

This is equivalent to:

```tsx
<Suspense fallback={<Loading />}>
  <Page />
</Suspense>
```

### Streaming with Suspense

For more granular loading states, use `<Suspense>` directly:

```tsx
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Suspense fallback={<p>Loading stats...</p>}>
        <Stats />
      </Suspense>

      <Suspense fallback={<p>Loading chart...</p>}>
        <Chart />
      </Suspense>

      <Suspense fallback={<p>Loading recent activity...</p>}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}

// Each component can fetch independently
async function Stats() {
  const stats = await fetchStats(); // 200ms
  return <div>{stats.totalUsers} users</div>;
}

async function Chart() {
  const data = await fetchChartData(); // 1500ms — shows loading while waiting
  return <div>Chart: {data.length} points</div>;
}
```

---

## Error Handling

`error.tsx` creates an **error boundary**:

```tsx
'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="text-center py-10">
      <h2>Something went wrong!</h2>
      <p className="text-gray-600">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}
```

### Error Boundary Hierarchy

```
layout.tsx          ← global-error.tsx catches errors here
├── error.tsx       ← catches errors in page.tsx and below
├── loading.tsx
└── page.tsx
```

For root layout errors, use `global-error.tsx`:

```tsx
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

---

## Not Found

`not-found.tsx` handles 404 errors:

```tsx
// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl mt-4">Page not found</p>
      <Link href="/" className="mt-6 text-blue-500 underline">
        Go home
      </Link>
    </div>
  );
}
```

Trigger it programmatically:

```tsx
import { notFound } from 'next/navigation';

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound(); // Renders the nearest not-found.tsx
  }

  return <h1>{post.title}</h1>;
}
```

---

## Rendering Hierarchy

The complete rendering order for a route:

```
layout.tsx
├── template.tsx
│   ├── error.tsx (boundary)
│   │   ├── loading.tsx (suspense)
│   │   │   └── page.tsx
│   │   └── not-found.tsx
```

---

## Summary

| File | Purpose | Re-renders? |
|---|---|---|
| `page.tsx` | Route UI | Yes |
| `layout.tsx` | Persistent wrapper | No |
| `template.tsx` | Re-mounting wrapper | Yes |
| `loading.tsx` | Suspense fallback | N/A |
| `error.tsx` | Error boundary | On error |
| `not-found.tsx` | 404 UI | On notFound() |
