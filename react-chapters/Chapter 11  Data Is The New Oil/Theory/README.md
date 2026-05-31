# Chapter 11 — Data Is The New Oil

## The Data Flow Problem

In React, data flows **top-down** (parent → child) via props. As apps grow, this creates problems.

---

## Prop Drilling

Prop drilling is when you pass data through multiple levels of components that don't need it — just to reach a deeply nested child.

```jsx
function App() {
  const [user, setUser] = useState({ name: 'Akshay', theme: 'dark' });
  return <Dashboard user={user} />;
}

function Dashboard({ user }) {
  // Dashboard doesn't need user, just passes it down
  return <Sidebar user={user} />;
}

function Sidebar({ user }) {
  // Sidebar doesn't need user either
  return <UserProfile user={user} />;
}

function UserProfile({ user }) {
  // Only this component actually uses user
  return <h2>Hello, {user.name}</h2>;
}
```

**Problem:** Dashboard and Sidebar are forced to accept and forward `user` even though they don't use it. This makes refactoring painful and components less reusable.

---

## Lifting State Up

When two sibling components need to share state, **lift the state to their closest common parent**.

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Display count={count} />
      <Controls onIncrement={() => setCount(c => c + 1)} />
    </div>
  );
}

function Display({ count }) {
  return <p>Count: {count}</p>;
}

function Controls({ onIncrement }) {
  return <button onClick={onIncrement}>+1</button>;
}
```

**Rule:** The component that **owns** the state should be the **lowest common ancestor** of all components that need it.

---

## Context API

Context provides a way to pass data through the component tree **without prop drilling**.

### Creating Context

```jsx
import { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);
```

### Providing Context

```jsx
function App() {
  const [user, setUser] = useState({ name: 'Akshay', theme: 'dark' });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Dashboard />
    </UserContext.Provider>
  );
}
```

### Consuming Context

```jsx
function UserProfile() {
  const { user } = useContext(UserContext);
  return <h2>Hello, {user.name}</h2>;
}

// Dashboard and Sidebar don't need user prop anymore!
function Dashboard() {
  return <Sidebar />;
}

function Sidebar() {
  return <UserProfile />;
}
```

### Custom Provider Pattern

Encapsulate context + state in a reusable provider:

```jsx
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook for consuming
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Usage
function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className={theme}>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </header>
  );
}
```

### Nested Providers

You can nest multiple contexts:

```jsx
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          <Router />
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### Context Re-render Problem

**Every component** that calls `useContext(SomeContext)` re-renders when the provider value changes — even if the specific field they use hasn't changed.

```jsx
// BAD: Creates a new object every render → all consumers re-render
function App() {
  const [user, setUser] = useState('Akshay');
  const [theme, setTheme] = useState('dark');

  return (
    <AppContext.Provider value={{ user, theme, setUser, setTheme }}>
      <Page />
    </AppContext.Provider>
  );
}

// BETTER: Split into separate contexts
function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <Page />
      </ThemeProvider>
    </UserProvider>
  );
}
```

**Solutions for context re-renders:**
1. **Split contexts** — separate frequently-changing from stable values.
2. **Memoize the value** — `useMemo` to stabilize the reference.
3. **Memo the consumers** — wrap child components with `React.memo`.

---

## Higher Order Components (HOCs)

A Higher Order Component is a **function that takes a component and returns a new enhanced component**.

```jsx
function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" />;
    return <WrappedComponent {...props} user={user} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);
```

### Common HOC Patterns

**withLoader** — adds loading state:
```jsx
function withLoader(WrappedComponent, fetchData) {
  return function LoaderComponent(props) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchData().then(result => {
        setData(result);
        setLoading(false);
      });
    }, []);

    if (loading) return <Spinner />;
    return <WrappedComponent {...props} data={data} />;
  };
}
```

**withTheme** — injects theme:
```jsx
function withTheme(WrappedComponent) {
  return function ThemedComponent(props) {
    const theme = useTheme();
    return <WrappedComponent {...props} theme={theme} />;
  };
}
```

### HOCs vs Hooks

| Aspect | HOC | Custom Hook |
|---|---|---|
| Reuse logic | Yes | Yes |
| Wrapper hell | Yes (nesting) | No |
| Props conflict | Possible | Not possible |
| Debugging | Harder (wrapper layers) | Easier |
| Modern approach | Legacy | Preferred |

**Today, custom hooks have largely replaced HOCs.** But you'll encounter HOCs in older codebases and libraries (e.g., Redux's `connect`, React Router's `withRouter`).

---

## Render Props Pattern

A component that takes a **function as a prop** (or children) and calls it to determine what to render.

```jsx
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return render(position);
}

// Usage
function App() {
  return (
    <MouseTracker
      render={({ x, y }) => (
        <p>Mouse is at ({x}, {y})</p>
      )}
    />
  );
}
```

**Children as a function** (same pattern):
```jsx
function DataFetcher({ url, children }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(url).then(r => r.json()).then(setData);
  }, [url]);

  return children(data);
}

<DataFetcher url="/api/users">
  {(users) => users ? <UserList users={users} /> : <Spinner />}
</DataFetcher>
```

Like HOCs, render props have been **largely replaced by custom hooks** but appear in interview questions and older libraries.

---

## Controlled vs Uncontrolled Components

### Controlled Component

React state is the **single source of truth**. The component's value is controlled by React.

```jsx
function ControlledInput() {
  const [value, setValue] = useState('');

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
```

**You need controlled components when:**
- Validating on every keystroke.
- Formatting input (e.g., phone numbers).
- Conditionally disabling submit button.
- Multiple inputs that depend on each other.

### Uncontrolled Component

The DOM itself holds the state. You read it with a **ref** when needed.

```jsx
function UncontrolledInput() {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    console.log(inputRef.current.value);
  };

  return (
    <>
      <input ref={inputRef} defaultValue="Hello" />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
```

**Use uncontrolled when:**
- Simple forms where you only need the value on submit.
- File inputs (`<input type="file">` is always uncontrolled).
- Integrating with non-React code.

### Comparison

| Feature | Controlled | Uncontrolled |
|---|---|---|
| State location | React state | DOM |
| Read value | From state variable | Via ref |
| Validation | On every change | On submit |
| Re-renders | On every keystroke | Minimal |
| Recommended | Most cases | Simple forms, file inputs |

---

## Summary

| Concept | When to Use |
|---|---|
| Props | Parent → child, 1-2 levels deep |
| Lifting State | Siblings need shared state |
| Context | Many components need same data, deep tree |
| HOCs | Legacy pattern, enhancing components |
| Render Props | Legacy pattern, sharing behavior |
| Controlled | Forms needing validation/formatting |
| Uncontrolled | Simple forms, file inputs |