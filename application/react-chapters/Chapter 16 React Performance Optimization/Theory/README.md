# Chapter 16 — React Performance Optimization

## Why Performance Matters

React re-renders a component whenever its **state, props, or context** changes. By default, when a parent re-renders, **all its children re-render too** — even if their props haven't changed. In large apps this cascade can cause jank.

The goal: **skip unnecessary work**.

---

## React.memo

`React.memo` is a higher-order component that **skips re-rendering** when the props are the same (shallow comparison).

```jsx
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  console.log('ExpensiveList rendered');
  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
});
```

### When to Use

- The component renders **the same result** given the same props.
- The component renders **often** with unchanged props.
- The component is **expensive** to render (large lists, charts, etc.).

### When NOT to Use

- Don't wrap every component — the memoization itself has a cost.
- If props change on every render (new objects/arrays/functions), `memo` is useless.

---

## useMemo

`useMemo` **caches the result** of an expensive computation between re-renders.

```jsx
function ProductList({ products, filter }) {
  const filtered = useMemo(() => {
    return products.filter(p => p.category === filter);
  }, [products, filter]);

  return <ul>{filtered.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

### Rules

- Only use when the computation is **genuinely expensive** (sorting large arrays, complex transformations).
- The dependency array `[products, filter]` must include every value used inside the function.
- **Don't use for everything** — premature memoization makes code harder to read with no benefit.

---

## useCallback

`useCallback` **caches a function definition** between re-renders. This is essential when passing callbacks to memoized child components.

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // Without useCallback, this creates a new function every render
  // causing MemoizedChild to re-render
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <MemoizedChild onClick={handleClick} />
    </div>
  );
}

const MemoizedChild = React.memo(function Child({ onClick }) {
  console.log('Child rendered');
  return <button onClick={onClick}>Click me</button>;
});
```

### useMemo vs useCallback

```jsx
// These are equivalent:
useCallback(fn, deps)
useMemo(() => fn, deps)
```

`useCallback` caches the **function itself**, while `useMemo` caches the **return value** of calling a function.

---

## Code Splitting with React.lazy

Split your bundle so users only download the code they need:

```jsx
import { lazy, Suspense } from 'react';

const AdminPanel = lazy(() => import('./AdminPanel'));
const UserDashboard = lazy(() => import('./UserDashboard'));

function App({ isAdmin }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {isAdmin ? <AdminPanel /> : <UserDashboard />}
    </Suspense>
  );
}
```

### Route-Based Code Splitting

The most natural place to split code is at **route boundaries**:

```jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

---

## Virtualization

When rendering **thousands of items** in a list, render only the visible ones:

```jsx
import { useRef, useState, useEffect } from 'react';

function VirtualList({ items, itemHeight, windowHeight }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(windowHeight / itemHeight) + 1,
    items.length
  );
  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = () => {
    setScrollTop(containerRef.current.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: windowHeight, overflow: 'auto' }}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, i) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: (startIndex + i) * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

Libraries like **react-window** and **TanStack Virtual** handle this for you.

---

## Avoiding Re-renders — Common Patterns

### 1. Move State Down

```jsx
// BAD: typing in input re-renders ExpensiveTree
function App() {
  const [text, setText] = useState('');
  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <ExpensiveTree />
    </div>
  );
}

// GOOD: isolate the state
function App() {
  return (
    <div>
      <SearchInput />
      <ExpensiveTree />
    </div>
  );
}

function SearchInput() {
  const [text, setText] = useState('');
  return <input value={text} onChange={e => setText(e.target.value)} />;
}
```

### 2. Lift Content Up (Children Pattern)

```jsx
// The children don't re-render when color changes
function ColorPicker({ children }) {
  const [color, setColor] = useState('red');
  return (
    <div style={{ color }}>
      <input value={color} onChange={e => setColor(e.target.value)} />
      {children}
    </div>
  );
}

function App() {
  return (
    <ColorPicker>
      <ExpensiveTree /> {/* Doesn't re-render! */}
    </ColorPicker>
  );
}
```

### 3. Stable Object/Array References

```jsx
// BAD: new array every render
<MemoizedList items={data.filter(d => d.active)} />

// GOOD: memoize the derived data
const activeItems = useMemo(() => data.filter(d => d.active), [data]);
<MemoizedList items={activeItems} />
```

---

## React DevTools Profiler

Use the **React DevTools Profiler** to identify performance bottlenecks:

1. Open React DevTools → Profiler tab.
2. Click Record, interact with your app, then Stop.
3. Look for components with:
   - **High render count** — may need memoization.
   - **Long render duration** — may need code splitting or virtualization.
   - **Cascading re-renders** — may need state restructuring.

### Highlight Updates

Enable **"Highlight updates when components render"** in React DevTools settings. Flashing borders show which components re-render in real time.

---

## Summary

| Technique | What It Does |
|---|---|
| `React.memo` | Skip re-render if props unchanged |
| `useMemo` | Cache expensive computed values |
| `useCallback` | Cache function references |
| `React.lazy` | Code-split components |
| Virtualization | Render only visible list items |
| Move state down | Isolate frequently-changing state |
| Children pattern | Prevent parent re-renders from affecting children |
| DevTools Profiler | Identify bottlenecks |
