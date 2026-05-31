# Chapter 04 — Data Fetching Patterns

## Fetching in Server Components

Server Components can use `async/await` directly — no `useEffect` or `useState` needed:

```tsx
// app/users/page.tsx
export default async function UsersPage() {
  const res = await fetch('https://api.example.com/users');
  const users = await res.json();

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

## Fetch API Extensions

Next.js extends the native `fetch` API with caching and revalidation options:

### Caching Behavior

```tsx
// Cached by default (equivalent to SSG)
const res = await fetch('https://api.example.com/data');

// Opt out of caching (equivalent to SSR — fresh on every request)
const res = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});

// Revalidate every 60 seconds (ISR)
const res = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 },
});

// Revalidate based on tags (on-demand)
const res = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },
});
```

---

## Parallel Data Fetching

Fetch multiple resources simultaneously — don't create waterfalls:

```tsx
// BAD — sequential (waterfall)
export default async function Dashboard() {
  const user = await getUser();      // 500ms
  const posts = await getPosts();    // 300ms
  const analytics = await getAnalytics(); // 400ms
  // Total: 1200ms

  return <div>...</div>;
}

// GOOD — parallel
export default async function Dashboard() {
  const [user, posts, analytics] = await Promise.all([
    getUser(),        // 500ms
    getPosts(),       // 300ms
    getAnalytics(),   // 400ms
  ]);
  // Total: ~500ms (max of all three)

  return <div>...</div>;
}
```

---

## Sequential Data Fetching

When one fetch depends on another:

```tsx
export default async function UserPosts() {
  // First fetch user
  const user = await getUser();

  // Then fetch posts using user ID
  const posts = await getPostsByUser(user.id);

  return (
    <div>
      <h1>{user.name}'s Posts</h1>
      {posts.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
}
```

### Breaking Waterfalls with Suspense

```tsx
export default async function UserPage() {
  const user = await getUser(); // Required first

  return (
    <div>
      <h1>{user.name}</h1>
      {/* Posts load independently — doesn't block the page */}
      <Suspense fallback={<p>Loading posts...</p>}>
        <UserPosts userId={user.id} />
      </Suspense>
    </div>
  );
}

async function UserPosts({ userId }: { userId: number }) {
  const posts = await getPostsByUser(userId);
  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}
```

---

## Data Fetching Patterns

### 1. Fetch on the Server (Recommended)

```tsx
// app/products/page.tsx
async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 }, // Revalidate every hour
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}
```

### 2. Fetch in Client Components (When Needed)

For real-time data or user-triggered fetches:

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function search() {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${query}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data);
      } catch (err) {
        if (err instanceof DOMException && err.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }

    search();
    return () => controller.abort();
  }, [query]);

  if (loading) return <p>Searching...</p>;
  return <ul>{results.map(r => <li key={r.id}>{r.title}</li>)}</ul>;
}
```

### 3. Database Queries (Direct)

Server Components can query databases directly:

```tsx
import { db } from '@/lib/db';

export default async function UsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

---

## Request Deduplication

Next.js automatically **deduplicates** identical `fetch` requests in a single render:

```tsx
// layout.tsx
async function Layout({ children }) {
  const user = await getUser(); // Fetch #1
  return <div><h1>{user.name}</h1>{children}</div>;
}

// page.tsx
async function Page() {
  const user = await getUser(); // Same fetch — automatically deduped!
  return <p>{user.email}</p>;
}
```

Both components call `getUser()`, but Next.js only makes **one HTTP request**.

**Note:** Deduplication only works with `fetch`. For database queries, use React `cache()`:

```tsx
import { cache } from 'react';

export const getUser = cache(async (id: number) => {
  return db.user.findUnique({ where: { id } });
});
```

---

## Preloading Data

Start fetching before a component renders:

```tsx
import { getUser } from '@/lib/data';

// Preload pattern
export function preloadUser(id: number) {
  void getUser(id); // Start fetch, don't await
}

// In a parent component
export default function UserLayout({ userId }: { userId: number }) {
  preloadUser(userId); // Start fetching immediately

  return (
    <Suspense fallback={<Loading />}>
      <UserProfile userId={userId} />
    </Suspense>
  );
}
```

---

## Passing Data Between Components

### Through Props (Server → Client)

```tsx
// Server Component — fetches data
export default async function Page() {
  const data = await getData();
  return <ClientComponent data={data} />;
}

// Client Component — receives serializable data
'use client';
export function ClientComponent({ data }: { data: Data }) {
  const [filtered, setFiltered] = useState(data);
  // ... interactive logic
}
```

**Important:** Data passed from Server to Client Components must be **serializable** (no functions, classes, Date objects need conversion).

---

## Summary

| Pattern | When to Use |
|---|---|
| Server Component fetch | Default for most data |
| `cache: 'no-store'` | Always-fresh data (SSR) |
| `next: { revalidate: N }` | Periodic refresh (ISR) |
| `next: { tags: [...] }` | On-demand revalidation |
| `Promise.all()` | Multiple independent fetches |
| `<Suspense>` | Break dependent waterfalls |
| Client-side fetch | Real-time data, user-triggered |
| Direct DB queries | Server Components only |
| `cache()` | Deduplicate non-fetch calls |
