# Chapter 07 — Static, Dynamic, and Incremental Rendering

## Rendering Strategies Overview

Next.js offers multiple rendering strategies. Understanding when to use each is critical for performance.

| Strategy | When HTML is Generated | Data Freshness |
|---|---|---|
| Static (SSG) | Build time | Stale until rebuild |
| Dynamic (SSR) | Request time | Always fresh |
| ISR | Build time + background revalidation | Fresh within revalidation window |
| Streaming | Request time, progressive | Always fresh |

---

## Static Rendering (SSG)

Pages are rendered at **build time** and served from a CDN. This is the **default** in Next.js.

```tsx
// This page is statically rendered at build time
export default async function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>This page is generated at build time.</p>
    </div>
  );
}
```

### Static with Data

```tsx
// Still static — fetch is cached by default
export default async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts');
  const data = await posts.json();

  return (
    <ul>
      {data.map((post: any) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### generateStaticParams

Pre-render dynamic routes at build time:

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());

  return posts.map((post: any) => ({
    slug: post.slug,
  }));
  // Generates: /blog/hello-world, /blog/my-first-post, etc.
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetch(`https://api.example.com/posts/${slug}`).then(r => r.json());

  return <article><h1>{post.title}</h1><p>{post.content}</p></article>;
}
```

---

## Dynamic Rendering (SSR)

Pages are rendered on **every request**. A route becomes dynamic when it uses:

- `cookies()` or `headers()`
- `searchParams` prop
- `fetch` with `cache: 'no-store'`
- `export const dynamic = 'force-dynamic'`

```tsx
import { cookies } from 'next/headers';

// This page is dynamically rendered because it reads cookies
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value || 'light';

  return <div className={theme}>Dashboard</div>;
}
```

### searchParams

```tsx
// Dynamic because it reads URL search params
type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const results = await search(q || '', Number(page) || 1);

  return (
    <div>
      <h1>Results for: {q}</h1>
      {results.map(r => <div key={r.id}>{r.title}</div>)}
    </div>
  );
}
```

### Force Dynamic

```tsx
// Force a page to be dynamic even without dynamic APIs
export const dynamic = 'force-dynamic';

export default async function Page() {
  const data = await fetch('https://api.example.com/realtime');
  return <div>{/* ... */}</div>;
}
```

---

## Incremental Static Regeneration (ISR)

Revalidate static pages **in the background** after a set interval:

### Time-Based Revalidation

```tsx
// Revalidate this page every 60 seconds
export const revalidate = 60;

export default async function ProductsPage() {
  const products = await fetch('https://api.example.com/products');
  const data = await products.json();

  return <ProductList products={data} />;
}
```

Or at the fetch level:

```tsx
export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }, // Revalidate every hour
  });

  return <div>{/* ... */}</div>;
}
```

### How ISR Works

```
1. User A requests /products
   → Serves cached (stale) page instantly
   → If revalidation window has passed, triggers background regeneration

2. User B requests /products (after regeneration completes)
   → Serves the freshly generated page

3. If regeneration fails, the old page continues to be served
```

### On-Demand Revalidation

Revalidate when data actually changes (webhooks, admin actions):

```tsx
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { path, tag, secret } = await request.json();

  // Verify webhook secret
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (tag) {
    revalidateTag(tag);
  } else if (path) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
```

---

## Streaming

Send HTML progressively — user sees content sooner:

```tsx
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* This renders immediately */}
      <StaticHeader />

      {/* These stream in as they resolve */}
      <Suspense fallback={<Skeleton />}>
        <SlowChart />    {/* Takes 2s to fetch */}
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <SlowerTable />  {/* Takes 4s to fetch */}
      </Suspense>
    </div>
  );
}
```

### Streaming with `loading.tsx`

```
app/dashboard/
├── page.tsx
└── loading.tsx    ← Automatic Suspense boundary for the entire page
```

---

## Partial Prerendering (PPR)

Experimental feature that combines static shell with dynamic content:

```tsx
// next.config.ts
const nextConfig = {
  experimental: {
    ppr: true,
  },
};

// app/page.tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      {/* Static shell — prerendered at build time */}
      <header>My App</header>
      <nav>Home | About | Blog</nav>

      {/* Dynamic holes — streamed at request time */}
      <Suspense fallback={<p>Loading user...</p>}>
        <UserGreeting />  {/* Uses cookies() — dynamic */}
      </Suspense>

      {/* Static content */}
      <footer>© 2024</footer>
    </div>
  );
}
```

---

## Route Segment Config

Control rendering per route segment:

```tsx
// Force static generation
export const dynamic = 'force-static';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Set revalidation interval
export const revalidate = 60; // seconds

// Set runtime
export const runtime = 'nodejs';    // Default
export const runtime = 'edge';      // Edge Runtime

// Allow or disallow dynamic params
export const dynamicParams = true;  // Default
export const dynamicParams = false; // Return 404 for unknown params
```

---

## Choosing the Right Strategy

```
Is the data the same for all users?
├── Yes → Is the data updated frequently?
│   ├── No → Static (SSG)
│   └── Yes → ISR (revalidate = N)
└── No → Is real-time freshness critical?
    ├── Yes → Dynamic (SSR)
    └── No → ISR with on-demand revalidation
```

| Use Case | Strategy |
|---|---|
| Marketing pages | Static |
| Blog posts | ISR (revalidate: 3600) |
| E-commerce product pages | ISR (on-demand revalidation) |
| User dashboard | Dynamic (SSR) |
| Social media feed | Dynamic + Streaming |
| Documentation | Static (generateStaticParams) |

---

## Summary

| Strategy | Config | When |
|---|---|---|
| Static (SSG) | Default | Content rarely changes |
| Dynamic (SSR) | `cookies()`, `headers()`, `cache: 'no-store'` | Per-request data |
| ISR | `revalidate = N` | Periodically updated content |
| On-demand ISR | `revalidatePath()` / `revalidateTag()` | CMS webhooks, admin actions |
| Streaming | `<Suspense>` / `loading.tsx` | Progressive loading |
