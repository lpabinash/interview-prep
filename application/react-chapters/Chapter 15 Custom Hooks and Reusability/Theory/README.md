# Chapter 15 — Custom Hooks and Reusability

## What Is a Custom Hook?

A custom hook is a **JavaScript function whose name starts with `use`** and that calls other hooks. It lets you extract and reuse stateful logic across components without changing the component hierarchy.

```jsx
// A custom hook — just a function that uses hooks
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

// Any component can use it
function Header() {
  const width = useWindowWidth();
  return <h1>{width > 768 ? 'Desktop' : 'Mobile'} View</h1>;
}
```

**Key insight:** Each component calling the hook gets its **own isolated state**. Custom hooks share *logic*, not *state*.

---

## useOnlineStatus

Detect whether the user is online or offline:

```jsx
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}
```

Usage:

```jsx
function StatusBadge() {
  const isOnline = useOnlineStatus();
  return <span>{isOnline ? '🟢 Online' : '🔴 Offline'}</span>;
}
```

---

## useFetch — Data Fetching Hook

A reusable hook for fetching data with loading and error states:

```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => setData(json))
      .catch(err => {
        if (err.name !== 'AbortError') setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}
```

Usage:

```jsx
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return <h2>{user.name}</h2>;
}
```

### Key Points

- **AbortController** — cancels the in-flight request when `url` changes or the component unmounts, preventing memory leaks and race conditions.
- **Error handling** — ignores `AbortError` since it's expected during cleanup.

---

## useLocalStorage

Sync state to `localStorage` so it persists across page refreshes:

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or unavailable
    }
  }, [key, value]);

  return [value, setValue];
}
```

Usage:

```jsx
function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}
```

---

## useDebounce

Delay updating a value until a user stops typing:

```jsx
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

Usage — search with debounced API calls:

```jsx
function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const { data: results } = useFetch(
    debouncedQuery ? `/api/search?q=${debouncedQuery}` : null
  );

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {results?.map(item => <p key={item.id}>{item.title}</p>)}
    </div>
  );
}
```

---

## usePrevious

Track the previous value of a prop or state:

```jsx
function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}
```

Usage:

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <p>
      Now: {count}, Before: {prevCount}
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </p>
  );
}
```

---

## useClickOutside

Close dropdowns/modals when clicking outside:

```jsx
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
```

Usage:

```jsx
function Dropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref}>
      <button onClick={() => setOpen(!open)}>Menu</button>
      {open && <ul><li>Option 1</li><li>Option 2</li></ul>}
    </div>
  );
}
```

---

## useMediaQuery

React to CSS media query changes:

```jsx
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

Usage:

```jsx
function Layout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

---

## Best Practices for Custom Hooks

1. **Name must start with `use`** — this lets React enforce the Rules of Hooks via the linter.
2. **Keep hooks focused** — each hook should do one thing well.
3. **Return only what consumers need** — don't expose internal implementation details.
4. **Handle cleanup** — always return cleanup functions in `useEffect` to prevent memory leaks.
5. **Accept configuration** — make hooks flexible with parameters (delay, initial value, etc.).
6. **Don't over-abstract** — extract a hook only when the same logic is needed in 2+ places.

---

## Summary

| Hook | Purpose |
|---|---|
| `useOnlineStatus` | Detect network connectivity |
| `useFetch` | Data fetching with loading/error |
| `useLocalStorage` | Persist state to localStorage |
| `useDebounce` | Delay value updates |
| `usePrevious` | Track previous value |
| `useClickOutside` | Detect clicks outside an element |
| `useMediaQuery` | Respond to CSS media queries |
