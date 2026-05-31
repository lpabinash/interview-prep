# Chapter 18 — React Server Components and SSR

## Client-Side Rendering (CSR) — The Problem

In a traditional React SPA:

1. Browser downloads a mostly empty HTML file.
2. Downloads and parses a large JavaScript bundle.
3. React renders the UI on the client.
4. Data fetching begins only **after** the component mounts.

**Result:** Users see a blank screen or spinner for seconds. SEO is poor because crawlers see empty HTML.

---

## Server-Side Rendering (SSR)

SSR renders React components to HTML **on the server**, sending a fully-formed page to the browser.

### How SSR Works

1. **Server** renders components to HTML string.
2. **Browser** receives complete HTML — user sees content immediately.
3. **Hydration** — React attaches event handlers to the server-rendered HTML, making it interactive.

```
Request → Server renders HTML → Browser shows content → JS loads → Hydration → Interactive
```

### SSR Benefits

- **Faster First Contentful Paint** — content is visible before JS loads.
- **Better SEO** — crawlers see full HTML content.
- **Better for slow devices** — less client-side work.

### SSR Limitations

- **TTFB increases** — server must render before responding.
- **Hydration is expensive** — entire tree must hydrate before anything is interactive.
- **All-or-nothing** — can't stream parts of the page.

---

## Streaming SSR (React 18)

React 18 introduced **streaming SSR** with `renderToPipeableStream`, solving the all-or-nothing problem.

```jsx
// server.js
import { renderToPipeableStream } from 'react-dom/server';

app.get('/', (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    bootstrapScripts: ['/bundle.js'],
    onShellReady() {
      res.setHeader('Content-Type', 'text/html');
      pipe(res);
    },
  });
});
```

### Selective Hydration

With streaming SSR + Suspense, React can:

1. **Stream HTML** as it becomes ready (not wait for everything).
2. **Hydrate components independently** — interactive parts hydrate first.
3. **Prioritize hydration** based on user interaction.

```jsx
function App() {
  return (
    <html>
      <body>
        <Header /> {/* Hydrates immediately */}

        <Suspense fallback={<FeedSkeleton />}>
          <Feed /> {/* Streams in when ready */}
        </Suspense>

        <Suspense fallback={<CommentsSkeleton />}>
          <Comments /> {/* Streams in independently */}
        </Suspense>
      </body>
    </html>
  );
}
```

---

## React Server Components (RSC)

React Server Components are a new paradigm where components run **exclusively on the server**. They never ship JavaScript to the browser.

### Server Components vs Client Components

| | Server Component | Client Component |
|---|---|---|
| Where it runs | Server only | Client (browser) |
| Can use hooks? | No | Yes |
| Can use browser APIs? | No | Yes |
| Can access DB/filesystem? | Yes | No |
| JavaScript sent to browser? | No (only HTML) | Yes |
| Can use `onClick`, `onChange`? | No | Yes |
| Default in Next.js App Router? | Yes | No (needs `'use client'`) |

### Server Component Example

```jsx
// app/users/page.tsx — Server Component (default)
// Runs on the server. Zero JavaScript sent to the client.
async function UsersPage() {
  const users = await db.query('SELECT * FROM users'); // Direct DB access!

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

export default UsersPage;
```

### Client Component

```jsx
// components/LikeButton.tsx — Client Component
'use client'; // This directive marks it as a client component

import { useState } from 'react';

export function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? '❤️' : '🤍'} Like
    </button>
  );
}
```

### Composing Server and Client Components

```jsx
// app/post/[id]/page.tsx — Server Component
import { LikeButton } from '@/components/LikeButton'; // Client Component

async function PostPage({ params }) {
  const post = await db.query('SELECT * FROM posts WHERE id = ?', [params.id]);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <LikeButton postId={post.id} /> {/* Interactive island */}
    </article>
  );
}
```

### Key Rules

1. **Server Components can import Client Components**, but not vice versa.
2. **Client Components cannot import Server Components directly** — pass them as `children` or props instead.
3. **Props passed from Server → Client must be serializable** (no functions, no classes).

```jsx
// CORRECT: Pass Server Component as children
'use client';
function ClientWrapper({ children }) {
  const [show, setShow] = useState(true);
  return show ? children : null;
}

// In a Server Component:
<ClientWrapper>
  <ServerComponent /> {/* This works! */}
</ClientWrapper>
```

---

## Server Actions

Server Actions let you call server-side functions **directly from client components** — no API routes needed.

```jsx
// app/actions.ts
'use server';

export async function addTodo(formData: FormData) {
  const title = formData.get('title');
  await db.query('INSERT INTO todos (title) VALUES (?)', [title]);
}
```

```jsx
// components/TodoForm.tsx
'use client';

import { addTodo } from '@/app/actions';

export function TodoForm() {
  return (
    <form action={addTodo}>
      <input name="title" placeholder="New todo..." />
      <button type="submit">Add</button>
    </form>
  );
}
```

### Server Actions with useActionState (React 19)

```jsx
'use client';

import { useActionState } from 'react';
import { addTodo } from '@/app/actions';

export function TodoForm() {
  const [state, formAction, isPending] = useActionState(addTodo, null);

  return (
    <form action={formAction}>
      <input name="title" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Adding...' : 'Add'}
      </button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
```

---

## Rendering Strategies Summary

| Strategy | When HTML is Generated | Use Case |
|---|---|---|
| CSR | In the browser | SPAs, dashboards, authenticated apps |
| SSR | On each request | Dynamic, personalized pages |
| SSG | At build time | Blogs, docs, marketing pages |
| ISR | At build time + revalidation | E-commerce, news (stale-while-revalidate) |
| Streaming SSR | Progressively on each request | Complex pages with independent sections |
| RSC | On the server (no hydration) | Data-heavy pages, zero JS for static parts |

---

## Summary

| Concept | Key Benefit |
|---|---|
| SSR | Faster FCP, better SEO |
| Streaming SSR | Progressive rendering, selective hydration |
| Server Components | Zero client JS, direct server access |
| Client Components | Interactivity, hooks, browser APIs |
| Server Actions | Call server functions from forms/components |
