# Chapter 11 — Caching, Revalidation, and Streaming

## Caching in Next.js

Next.js has a multi-layered caching system. Understanding it is key to building performant apps.

### Caching Layers

| Layer | What It Caches | Where | Duration |
|---|---|---|---|
| Request Memoization | `fetch` return values | Server | Per request |
| Data Cache | `fetch` responses | Server | Persistent (until revalidated) |
| Full Route Cache | Rendered HTML + RSC payload | Server | Persistent (until revalidated) |
| Router Cache | RSC payload | Client | Session (auto-managed) |

---

## Request Memoization

React automatically **deduplicates** identical `fetch` calls within a single render pass:

```tsx
// Both components can call getUser() — only ONE fetch is made
async function getUser() {
  const res = await fetch('https://api.example.com/user');
  return res.json();
}

// layout.tsx
export default async function Layout({ children }) {
  const user = await getUser(); // Fetch #1
  return <div>{user.name}{children}</div>;
}

// page.tsx
export default async function Page() {
  const user = await getUser(); // Deduped — reuses fetch #1
  return <p>{user.email}</p>;
}
```

**Key points:**
- Only works with `fetch` (not database queries)
- Only within a single server request/render
- For non-fetch calls, use React `cache()`:

```tsx
import { cache } from 'react';
import { db } from '@/lib/db';

export const getUser = cache(async (id: number) => {
  return db.user.findUnique({ where: { id } });
});
```

---

## Data Cache

The Data Cache stores `fetch` responses persistently on the server:

### Default: Cached

```tsx
// Cached indefinitely (static)
const res = await fetch('https://api.example.com/data');
```

### Opt Out: No Caching

```tsx
// Fresh data on every request
const res = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});
```

### Time-Based Revalidation

```tsx
// Revalidate every 60 seconds
const res = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 },
});
```

### Tag-Based Revalidation

```tsx
// Tag the fetch
const res = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },
});

// Later, invalidate by tag
import { revalidateTag } from 'next/cache';
revalidateTag('posts'); // All fetches tagged 'posts' are refreshed
```

---

## Full Route Cache

Pre-rendered routes are cached on the server. Static routes are cached at build time; ISR routes are cached after the first request.

```tsx
// This page is fully cached at build time
export default async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 },
  });
  return <PostList posts={await posts.json()} />;
}
```

### Opting Out

A route becomes dynamic (not cached) when it uses:

```tsx
import { cookies, headers } from 'next/headers';

// Any of these make the route dynamic:
const cookieStore = await cookies();
const headerList = await headers();

// Or:
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

---

## Router Cache (Client-Side)

The browser caches RSC payloads for visited routes:

- **Prefetched routes** (via `<Link>`) are cached for 30 seconds
- **Visited routes** are cached for the browser session

### Invalidating Router Cache

```tsx
'use client';

import { useRouter } from 'next/navigation';

function RefreshButton() {
  const router = useRouter();

  return (
    <button onClick={() => router.refresh()}>
      Refresh
    </button>
  );
}
```

Server Actions automatically invalidate the Router Cache when you call `revalidatePath()` or `revalidateTag()`.

---

## Revalidation Strategies

### 1. Time-Based

```tsx
// Page level
export const revalidate = 60; // seconds

// Fetch level
fetch(url, { next: { revalidate: 60 } });
```

### 2. On-Demand (Path)

```tsx
// In a Server Action or Route Handler
import { revalidatePath } from 'next/cache';

revalidatePath('/blog');            // Specific page
revalidatePath('/blog', 'layout');  // Page + layout
revalidatePath('/', 'layout');      // Everything
```

### 3. On-Demand (Tag)

```tsx
// Tag your fetches
fetch(url, { next: { tags: ['posts'] } });

// Invalidate by tag
import { revalidateTag } from 'next/cache';
revalidateTag('posts');
```

### 4. Webhook-Triggered

```tsx
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Verify webhook authenticity
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Revalidate based on webhook event
  if (body.event === 'post.updated') {
    revalidateTag('posts');
    revalidateTag(`post-${body.postId}`);
  }

  return NextResponse.json({ revalidated: true });
}
```

---

## Streaming

Send HTML progressively to the browser:

### With Suspense

```tsx
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Streams in as resolved */}
      <Suspense fallback={<CardSkeleton />}>
        <RevenueChart />
      </Suspense>

      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<CardSkeleton />}>
          <LatestUsers />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <LatestOrders />
        </Suspense>
      </div>
    </div>
  );
}

// Skeleton component
function CardSkeleton() {
  return (
    <div className="animate-pulse bg-gray-200 rounded-lg h-40" />
  );
}

// Slow component — user doesn't wait for this
async function RevenueChart() {
  const data = await fetch('https://api.example.com/revenue'); // Takes 3 seconds
  const revenue = await data.json();
  return <Chart data={revenue} />;
}
```

### With loading.tsx

```
app/dashboard/
├── loading.tsx    ← Auto Suspense boundary
├── page.tsx
└── analytics/
    ├── loading.tsx  ← Nested loading
    └── page.tsx
```

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-40 bg-gray-200 rounded" />
        <div className="h-40 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
```

### Streaming with Route Handlers

```tsx
// app/api/stream/route.ts
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (const item of items) {
        const processed = await processItem(item);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(processed)}\n\n`)
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

---

## Caching Decision Guide

```
Does the data change?
├── Never → Static (default caching)
├── On a schedule → Time-based revalidation
├── On specific events → Tag-based revalidation
└── Every request → cache: 'no-store'

Is the data user-specific?
├── Yes → Dynamic rendering (no cache)
└── No → Cache it
```

---

## Debugging Caching

```tsx
// See which routes are static vs dynamic in build output
// next build shows:
// ○ (Static)   /about
// ● (SSG)      /blog/[slug]
// λ (Dynamic)  /dashboard
// ƒ (Dynamic)  /api/users

// Check headers in dev
// x-nextjs-cache: HIT | MISS | STALE
```

---

## Summary

| Cache | Scope | Control |
|---|---|---|
| Request Memoization | Per render | Automatic (`fetch` dedup) |
| Data Cache | Persistent | `revalidate`, `no-store`, tags |
| Full Route Cache | Persistent | `dynamic`, `revalidate` segment config |
| Router Cache | Client session | `router.refresh()`, `revalidatePath()` |
| Streaming | Per request | `<Suspense>`, `loading.tsx` |
