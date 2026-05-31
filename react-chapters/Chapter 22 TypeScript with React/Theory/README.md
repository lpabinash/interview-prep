# Chapter 22 — TypeScript with React

## Why TypeScript in React?

TypeScript catches bugs at compile time, provides autocompletion, and makes refactoring safer. Most production React codebases use TypeScript.

---

## Typing Components

### Function Components

```tsx
// Inline props type
function Greeting({ name, age }: { name: string; age: number }) {
  return <p>Hello {name}, you are {age}</p>;
}

// Extracted props type (preferred)
type GreetingProps = {
  name: string;
  age: number;
  role?: string; // optional
};

function Greeting({ name, age, role = 'user' }: GreetingProps) {
  return <p>Hello {name} ({role}), you are {age}</p>;
}
```

### Props with Children

```tsx
type CardProps = {
  title: string;
  children: React.ReactNode; // accepts anything renderable
};

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
```

`React.ReactNode` includes: string, number, JSX, arrays, null, undefined, booleans.

### Props with Specific Element Type

```tsx
type LayoutProps = {
  header: React.ReactElement;    // must be JSX element
  sidebar?: React.ReactElement;
  children: React.ReactNode;
};
```

---

## Typing Hooks

### useState

TypeScript infers the type from the initial value:

```tsx
const [count, setCount] = useState(0);        // number
const [name, setName] = useState('');          // string
const [isOpen, setIsOpen] = useState(false);   // boolean
```

When the initial value is `null` or a complex type, provide a type argument:

```tsx
type User = {
  id: number;
  name: string;
  email: string;
};

const [user, setUser] = useState<User | null>(null);

// Later:
if (user) {
  console.log(user.name); // TypeScript knows user is User here
}
```

### useRef

```tsx
// DOM element ref — pass null as initial value
const inputRef = useRef<HTMLInputElement>(null);

function focusInput() {
  inputRef.current?.focus(); // optional chaining needed
}

// Mutable ref (no null)
const timerRef = useRef<number>(0);
timerRef.current = window.setTimeout(() => {}, 1000);
```

### useReducer

```tsx
type State = {
  count: number;
  error: string | null;
};

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset'; payload: number }
  | { type: 'error'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1, error: null };
    case 'decrement':
      return { ...state, count: state.count - 1, error: null };
    case 'reset':
      return { ...state, count: action.payload, error: null };
    case 'error':
      return { ...state, error: action.payload };
    default:
      // TypeScript ensures all cases are handled
      const _exhaustive: never = action;
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0, error: null });

dispatch({ type: 'increment' });        // OK
dispatch({ type: 'reset', payload: 5 }); // OK
dispatch({ type: 'reset' });             // ERROR: missing payload
```

### useContext

```tsx
type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook with null check
function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## Typing Events

```tsx
function Form() {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log(e.clientX, e.clientY);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // submit
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} onKeyDown={handleKeyDown} />
      <button onClick={handleClick}>Submit</button>
    </form>
  );
}
```

### Common Event Types

| Event | Type |
|---|---|
| `onChange` (input) | `React.ChangeEvent<HTMLInputElement>` |
| `onChange` (select) | `React.ChangeEvent<HTMLSelectElement>` |
| `onSubmit` | `React.FormEvent<HTMLFormElement>` |
| `onClick` | `React.MouseEvent<HTMLButtonElement>` |
| `onKeyDown` | `React.KeyboardEvent<HTMLInputElement>` |
| `onFocus` | `React.FocusEvent<HTMLInputElement>` |
| `onDrag` | `React.DragEvent<HTMLDivElement>` |

---

## Typing Styles

```tsx
const containerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  padding: '24px',
};

function Container({ children }: { children: React.ReactNode }) {
  return <div style={containerStyle}>{children}</div>;
}
```

---

## Generic Components

Create reusable components that work with any data type:

```tsx
type ListProps<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
};

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// Usage — TypeScript infers T from items
type User = { id: number; name: string };

<List<User>
  items={users}
  renderItem={(user) => <span>{user.name}</span>}
  keyExtractor={(user) => user.id}
/>
```

### Generic Select Component

```tsx
type SelectProps<T> = {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
};

function Select<T>({ options, value, onChange, getLabel, getValue }: SelectProps<T>) {
  return (
    <select
      value={getValue(value)}
      onChange={(e) => {
        const selected = options.find(o => getValue(o) === e.target.value);
        if (selected) onChange(selected);
      }}
    >
      {options.map(option => (
        <option key={getValue(option)} value={getValue(option)}>
          {getLabel(option)}
        </option>
      ))}
    </select>
  );
}
```

---

## Discriminated Unions for Props

When a component's props depend on a variant:

```tsx
type ButtonProps =
  | { variant: 'link'; href: string; onClick?: never }
  | { variant: 'button'; onClick: () => void; href?: never }
  | { variant: 'submit'; onClick?: never; href?: never };

type CommonProps = {
  children: React.ReactNode;
  disabled?: boolean;
};

function Button(props: ButtonProps & CommonProps) {
  if (props.variant === 'link') {
    return <a href={props.href}>{props.children}</a>;
  }
  return (
    <button
      type={props.variant === 'submit' ? 'submit' : 'button'}
      onClick={props.variant === 'button' ? props.onClick : undefined}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

// Usage:
<Button variant="link" href="/about">About</Button>        // OK
<Button variant="button" onClick={handleClick}>Click</Button> // OK
<Button variant="link" onClick={handleClick}>Bad</Button>   // ERROR!
```

---

## Typing Custom Hooks

```tsx
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}

// Usage
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
```

### Fetch Hook with Generics

```tsx
type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then((data: T) => setState({ data, loading: false, error: null }))
      .catch(err => {
        if (err.name !== 'AbortError') {
          setState({ data: null, loading: false, error: err.message });
        }
      });
    return () => controller.abort();
  }, [url]);

  return state;
}

// Usage
const { data: users, loading } = useFetch<User[]>('/api/users');
```

---

## Typing forwardRef (pre-React 19)

```tsx
type InputProps = {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...rest }, ref) => (
    <div>
      <label>{label}</label>
      <input ref={ref} {...rest} />
      {error && <span className="error">{error}</span>}
    </div>
  )
);
```

In React 19, `ref` is just a prop — no `forwardRef` needed:

```tsx
function Input({ ref, label, error, ...rest }: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <div>
      <label>{label}</label>
      <input ref={ref} {...rest} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

---

## Extending HTML Element Props

```tsx
// Button that accepts all native button props + custom ones
type ButtonProps = {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ variant, size = 'md', children, ...rest }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} {...rest}>
      {children}
    </button>
  );
}

// Inherits onClick, disabled, type, aria-label, etc.
<Button variant="primary" disabled onClick={handleClick}>
  Save
</Button>
```

---

## Utility Types for React

```tsx
// Extract component props
type MyButtonProps = React.ComponentProps<typeof Button>;

// Make all props required
type RequiredProps = Required<CardProps>;

// Make all props optional
type PartialProps = Partial<CardProps>;

// Pick specific props
type NameOnly = Pick<UserProps, 'name' | 'email'>;

// Omit specific props
type WithoutId = Omit<UserProps, 'id'>;

// Record for object maps
type ThemeColors = Record<'primary' | 'secondary' | 'accent', string>;
```

---

## Interview Questions

**Q: What's the difference between `type` and `interface` for React props?**
A: Both work for props. `type` supports unions and intersections. `interface` supports declaration merging and `extends`. Convention: use `type` for props and `interface` for shapes you might extend.

**Q: How do you type a component that accepts any HTML element's props?**
A: Use `React.ComponentPropsWithoutRef<'div'>` or `React.HTMLAttributes<HTMLDivElement>` and spread `...rest` onto the element.

**Q: How do you make TypeScript ensure all switch cases are handled?**
A: Use the `never` type in the default case. If a new action type is added but not handled, TypeScript throws a compile error.

**Q: What's the difference between `ReactNode` and `ReactElement`?**
A: `ReactNode` is the widest type — includes string, number, null, undefined, boolean, and JSX. `ReactElement` is specifically a JSX element. Use `ReactNode` for `children` in most cases.
