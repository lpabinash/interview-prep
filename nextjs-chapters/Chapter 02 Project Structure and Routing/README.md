# Chapter 02 — Project Structure and Routing

## File-System Based Routing

In Next.js App Router, the **folder structure defines the routes**:

```
app/
├── page.tsx            → /
├── about/
│   └── page.tsx        → /about
├── blog/
│   ├── page.tsx        → /blog
│   └── [slug]/
│       └── page.tsx    → /blog/hello-world, /blog/my-post
├── dashboard/
│   ├── layout.tsx      → Shared layout for dashboard
│   ├── page.tsx        → /dashboard
│   └── settings/
│       └── page.tsx    → /dashboard/settings
```

**Key rule:** A route is only accessible if the folder contains a `page.tsx` file.

---

## Special Files

| File | Purpose |
|---|---|
| `page.tsx` | UI for a route (makes route publicly accessible) |
| `layout.tsx` | Shared UI that wraps children (persists across navigations) |
| `template.tsx` | Like layout but re-mounts on navigation |
| `loading.tsx` | Loading UI (Suspense boundary) |
| `error.tsx` | Error boundary UI |
| `not-found.tsx` | 404 UI |
| `route.ts` | API endpoint (Route Handler) |

---

## Dynamic Routes

### Single Parameter

```
app/blog/[slug]/page.tsx → /blog/hello-world
```

```tsx
// app/blog/[slug]/page.tsx
type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  return <h1>Post: {slug}</h1>;
}
```

### Multiple Parameters

```
app/shop/[category]/[id]/page.tsx → /shop/electronics/42
```

```tsx
type Props = {
  params: Promise<{ category: string; id: string }>;
};

export default async function Product({ params }: Props) {
  const { category, id } = await params;
  return <h1>{category} — Product {id}</h1>;
}
```

### Catch-All Routes

```
app/docs/[...slug]/page.tsx
```

Matches:
- `/docs/a` → `{ slug: ['a'] }`
- `/docs/a/b` → `{ slug: ['a', 'b'] }`
- `/docs/a/b/c` → `{ slug: ['a', 'b', 'c'] }`
- Does NOT match `/docs`

### Optional Catch-All

```
app/docs/[[...slug]]/page.tsx
```

Also matches `/docs` → `{ slug: undefined }`

---

## Route Groups

Organize routes without affecting the URL path using `(groupName)`:

```
app/
├── (marketing)/
│   ├── layout.tsx       # Marketing layout
│   ├── page.tsx         # → /
│   └── about/
│       └── page.tsx     # → /about
├── (dashboard)/
│   ├── layout.tsx       # Dashboard layout (different from marketing)
│   ├── dashboard/
│   │   └── page.tsx     # → /dashboard
│   └── settings/
│       └── page.tsx     # → /settings
```

The `(marketing)` and `(dashboard)` folders are **invisible in the URL** but let you apply different layouts.

---

## Parallel Routes

Render multiple pages simultaneously in the same layout using `@slot`:

```
app/
├── layout.tsx
├── page.tsx
├── @team/
│   └── page.tsx
├── @analytics/
│   └── page.tsx
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode;
  team: React.ReactNode;
  analytics: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="grid grid-cols-2">
        {team}
        {analytics}
      </div>
    </div>
  );
}
```

---

## Intercepting Routes

Show a route in a modal while keeping the background page:

```
app/
├── feed/
│   └── page.tsx            # Feed page
├── photo/
│   └── [id]/
│       └── page.tsx        # Full photo page (/photo/123)
├── @modal/
│   └── (.)photo/
│       └── [id]/
│           └── page.tsx    # Photo modal (intercepted from feed)
```

Convention: `(.)` = same level, `(..)` = one level up, `(...)` = root.

---

## Navigation

### Link Component

```tsx
import Link from 'next/link';

export default function Nav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/blog/hello-world">Blog Post</Link>
      <Link href="/dashboard" prefetch={false}>Dashboard</Link>
    </nav>
  );
}
```

`<Link>` automatically **prefetches** pages in the viewport for instant navigation.

### Programmatic Navigation

```tsx
'use client';

import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const router = useRouter();

  function handleLogin() {
    // ... login logic
    router.push('/dashboard');
    // router.replace('/dashboard'); // replace history entry
    // router.back();                // go back
    // router.refresh();             // refresh server components
  }

  return <button onClick={handleLogin}>Login</button>;
}
```

### Active Links

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={isActive ? 'text-blue-600 font-bold' : 'text-gray-600'}
    >
      {children}
    </Link>
  );
}
```

---

## Metadata

### Static Metadata

```tsx
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our company',
  openGraph: {
    title: 'About Us',
    description: 'Learn about our company',
    images: ['/og-about.png'],
  },
};

export default function About() {
  return <h1>About</h1>;
}
```

### Dynamic Metadata

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post.title,
    description: post.excerpt,
  };
}
```

---

## Summary

| Concept | Pattern |
|---|---|
| Static route | `app/about/page.tsx` → `/about` |
| Dynamic route | `app/[id]/page.tsx` → `/123` |
| Catch-all | `app/[...slug]/page.tsx` → `/a/b/c` |
| Route group | `app/(group)/page.tsx` → `/` (group hidden) |
| Parallel route | `app/@slot/page.tsx` |
| Intercepting route | `app/(.)route/page.tsx` |
| Navigation | `<Link>` or `useRouter()` |
| Metadata | `export const metadata` or `generateMetadata()` |
