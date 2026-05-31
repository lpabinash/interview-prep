# Chapter 17 — React Suspense and Error Boundaries

## Error Boundaries

Error boundaries are React components that **catch JavaScript errors** in their child component tree, log them, and display a fallback UI.

### Why Error Boundaries?

Without error boundaries, a single error in one component **crashes the entire app** — the whole component tree unmounts and the user sees a blank screen.

### Class-Based Error Boundary

Error boundaries **must be class components** (there is no hook equivalent for `componentDidCatch`).

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to show fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to an error reporting service
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div>
            <h2>Something went wrong.</h2>
            <details>{this.state.error?.message}</details>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
```

### Usage

```jsx
function App() {
  return (
    <ErrorBoundary fallback={<h2>Oops! Something broke.</h2>}>
      <Dashboard />
    </ErrorBoundary>
  );
}
```

### What Error Boundaries DO NOT Catch

- Event handlers (use try/catch instead)
- Asynchronous code (setTimeout, fetch)
- Server-side rendering
- Errors in the error boundary itself

### Best Practice — Granular Boundaries

```jsx
function App() {
  return (
    <div>
      <ErrorBoundary fallback={<p>Header failed</p>}>
        <Header />
      </ErrorBoundary>

      <ErrorBoundary fallback={<p>Feed failed to load</p>}>
        <Feed />
      </ErrorBoundary>

      <ErrorBoundary fallback={<p>Sidebar failed</p>}>
        <Sidebar />
      </ErrorBoundary>
    </div>
  );
}
```

If the Feed crashes, the Header and Sidebar still work.

---

## React Suspense

Suspense lets you **declaratively wait** for something (code, data, images) before rendering.

### Suspense for Code Splitting

```jsx
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <HeavyChart />
    </Suspense>
  );
}
```

### How Suspense Works Under the Hood

1. A child component **throws a Promise** (or uses a Suspense-compatible library).
2. Suspense **catches the thrown Promise**.
3. It renders the **fallback** while the Promise is pending.
4. When the Promise resolves, it **re-renders the children** with the data.

### Nested Suspense Boundaries

```jsx
<Suspense fallback={<PageSkeleton />}>
  <Header />

  <Suspense fallback={<FeedSkeleton />}>
    <Feed />
  </Suspense>

  <Suspense fallback={<SidebarSkeleton />}>
    <Sidebar />
  </Suspense>
</Suspense>
```

The outer boundary shows while the page shell loads. Inner boundaries show for individual sections.

---

## Suspense for Data Fetching

### Using React's `use` Hook (React 19+)

```jsx
import { use, Suspense } from 'react';

function UserProfile({ userPromise }) {
  const user = use(userPromise);
  return <h2>{user.name}</h2>;
}

function App() {
  const userPromise = fetchUser(1); // returns a Promise

  return (
    <Suspense fallback={<p>Loading user...</p>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

### With TanStack Query (Practical Approach)

```jsx
import { useSuspenseQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
  });

  return <h2>{user.name}</h2>;
}

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

---

## Combining Error Boundaries with Suspense

```jsx
function App() {
  return (
    <ErrorBoundary fallback={<p>Something went wrong</p>}>
      <Suspense fallback={<p>Loading...</p>}>
        <Dashboard />
      </Suspense>
    </ErrorBoundary>
  );
}
```

- **Suspense** handles the **loading** state.
- **ErrorBoundary** handles the **error** state.
- Together they cover all async states: loading → success → error.

---

## Transitions (React 18+)

`useTransition` lets you mark state updates as **non-urgent**, keeping the UI responsive during heavy renders.

```jsx
import { useState, useTransition } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value); // urgent: update input immediately

    startTransition(() => {
      // non-urgent: filter/search can be deferred
      setResults(filterLargeDataset(value));
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <p>Updating...</p>}
      <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>
    </div>
  );
}
```

### useDeferredValue

An alternative approach — defer a **value** rather than an update:

```jsx
import { useState, useDeferredValue } from 'react';

function Search() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <SearchResults query={deferredQuery} />
      </div>
    </div>
  );
}
```

---

## Summary

| Feature | Purpose |
|---|---|
| Error Boundary | Catch render errors, show fallback UI |
| `Suspense` | Declarative loading states |
| `lazy()` | Code-split components |
| `use()` | Read promises in render (React 19) |
| `useTransition` | Mark updates as non-urgent |
| `useDeferredValue` | Defer a value to keep UI responsive |
