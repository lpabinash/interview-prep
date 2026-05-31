# Chapter 14 — React Hooks Deep Dive

## Why Hooks?

Before React 16.8, stateful logic was only possible in **class components**. Hooks let you use state and other React features in **function components**, making code simpler, more reusable, and easier to test.

### Rules of Hooks

1. **Only call hooks at the top level** — never inside loops, conditions, or nested functions.
2. **Only call hooks from React function components** or custom hooks — never from regular JavaScript functions.

React relies on the **order of hook calls** to correctly associate state with each hook. Breaking these rules leads to bugs.

---

## useState

`useState` returns a state variable and a setter function.

```jsx
const [count, setCount] = useState(0);
```

### Functional Updates

When the new state depends on the previous state, pass a function to the setter:

```jsx
setCount(prev => prev + 1);
```

This is critical when multiple state updates are batched together.

### Lazy Initialization

If computing the initial state is expensive, pass a function to `useState`:

```jsx
const [data, setData] = useState(() => computeExpensiveValue());
```

The function runs only on the **first render**.

---

## useEffect

`useEffect` lets you perform **side effects** in function components: data fetching, subscriptions, DOM mutations, timers, etc.

```jsx
useEffect(() => {
  // effect runs after render
  const subscription = api.subscribe(handleChange);

  // cleanup function runs before next effect or unmount
  return () => subscription.unsubscribe();
}, [handleChange]); // dependency array
```

### Dependency Array Behavior

| Dependency Array | When Effect Runs |
|---|---|
| `undefined` (omitted) | After every render |
| `[]` (empty) | Only after the first render (mount) |
| `[a, b]` | When `a` or `b` changes (shallow comparison) |

### Common Pitfall — Stale Closures

```jsx
// BUG: count is always 0 inside the interval
useEffect(() => {
  const id = setInterval(() => {
    console.log(count); // stale closure!
  }, 1000);
  return () => clearInterval(id);
}, []);

// FIX: use functional update or add count to deps
useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + 1); // always uses latest value
  }, 1000);
  return () => clearInterval(id);
}, []);
```

---

## useReducer

`useReducer` is an alternative to `useState` for **complex state logic** or when the next state depends on the previous state.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}
```

### When to Use useReducer vs useState

- **useState** — simple, independent state values (toggle, counter, form field).
- **useReducer** — complex state objects, multiple sub-values, or when state transitions depend on the action type.

---

## useRef

`useRef` returns a **mutable ref object** whose `.current` property persists across renders without causing re-renders.

### DOM Access

```jsx
function TextInput() {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current.focus();
  };

  return (
    <>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus</button>
    </>
  );
}
```

### Storing Mutable Values (No Re-render)

```jsx
function Timer() {
  const intervalRef = useRef(null);

  const start = () => {
    intervalRef.current = setInterval(() => {
      console.log('tick');
    }, 1000);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
  };

  return (
    <>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </>
  );
}
```

### useRef vs useState

| | `useRef` | `useState` |
|---|---|---|
| Triggers re-render? | No | Yes |
| Returns | `{ current: value }` | `[value, setter]` |
| Use case | DOM refs, timers, previous values | UI state |

---

## useContext

`useContext` reads the value from the **nearest provider** of a given context above it in the tree.

```jsx
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  return <ThemedButton />;
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click me</button>;
}
```

### When Context Re-renders

Every component that calls `useContext(MyContext)` will re-render whenever the **context value changes**. To optimize:

- Split contexts (separate data from dispatch).
- Memoize the provider value with `useMemo`.
- Use state management libraries for high-frequency updates.

---

## useLayoutEffect

`useLayoutEffect` has the same signature as `useEffect`, but fires **synchronously after all DOM mutations**, before the browser paints.

```jsx
useLayoutEffect(() => {
  // Measure DOM, adjust layout
  const { height } = ref.current.getBoundingClientRect();
  setBoxHeight(height);
}, []);
```

### useEffect vs useLayoutEffect

| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| Timing | After paint | Before paint |
| Use case | Data fetching, subscriptions | DOM measurements, scroll position |
| Blocking? | No | Yes (blocks visual update) |

**Rule of thumb:** Use `useEffect` by default. Only switch to `useLayoutEffect` if you see a visual flicker.

---

## useId

`useId` generates a **unique, stable ID** for accessibility attributes. Introduced in React 18.

```jsx
function EmailField() {
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>Email</label>
      <input id={id} type="email" />
    </div>
  );
}
```

This works correctly with **server-side rendering** — IDs stay consistent between server and client.

---

## Summary

| Hook | Purpose |
|---|---|
| `useState` | Simple state management |
| `useEffect` | Side effects (async, subscriptions, DOM) |
| `useReducer` | Complex state transitions |
| `useRef` | DOM refs, mutable values (no re-render) |
| `useContext` | Read context value from provider |
| `useLayoutEffect` | Synchronous DOM measurement |
| `useId` | Unique IDs for accessibility |
