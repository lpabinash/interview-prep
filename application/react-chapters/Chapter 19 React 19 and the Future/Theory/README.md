# Chapter 19 — React 19 and the Future

## What Changed in React 19

React 19 is the biggest release since hooks. It introduces new primitives for async operations, form handling, and server-client communication.

---

## The `use` Hook

`use` is a new hook that can read **Promises** and **Context** in render. Unlike other hooks, `use` can be called inside conditionals and loops.

### Reading Promises

```jsx
import { use, Suspense } from 'react';

function UserProfile({ userPromise }) {
  const user = use(userPromise); // suspends until resolved
  return <h2>{user.name}</h2>;
}

function App() {
  const userPromise = fetchUser(1);
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

### Reading Context Conditionally

```jsx
function StatusDisplay({ showTheme }) {
  if (showTheme) {
    const theme = use(ThemeContext); // allowed inside conditionals!
    return <p>Theme: {theme}</p>;
  }
  return <p>No theme</p>;
}
```

**Note:** `useContext` cannot be used in conditionals — `use` can.

---

## useActionState

Replaces the pattern of managing form state + loading + errors manually. Handles async form actions with built-in pending state.

```jsx
'use client';
import { useActionState } from 'react';

async function submitForm(prevState, formData) {
  const name = formData.get('name');
  if (!name) return { error: 'Name is required' };

  await saveToDatabase(name);
  return { error: null, success: true };
}

function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitForm, {
    error: null,
    success: false,
  });

  return (
    <form action={formAction}>
      <input name="name" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit'}
      </button>
      {state.error && <p style={{ color: 'red' }}>{state.error}</p>}
      {state.success && <p style={{ color: 'green' }}>Saved!</p>}
    </form>
  );
}
```

### How It Works

1. `useActionState(action, initialState)` returns `[state, wrappedAction, isPending]`.
2. When the form submits, `isPending` becomes `true`.
3. The `action` receives the previous state and `FormData`.
4. When the action resolves, `state` updates with the return value.

---

## useFormStatus

Read the status of a parent `<form>` from any child component — no prop drilling needed.

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </button>
  );
}

function MyForm() {
  return (
    <form action={serverAction}>
      <input name="email" type="email" />
      <SubmitButton /> {/* Knows if form is submitting */}
    </form>
  );
}
```

**Important:** `useFormStatus` must be called from a component **inside** the `<form>`, not the component that renders the form.

---

## useOptimistic

Show an **optimistic UI update** while an async action is in progress, then reconcile when it resolves.

```jsx
import { useOptimistic } from 'react';

function TodoList({ todos, addTodoAction }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (currentTodos, newTodo) => [...currentTodos, { ...newTodo, pending: true }]
  );

  async function handleSubmit(formData) {
    const title = formData.get('title');
    addOptimistic({ id: Date.now(), title }); // show immediately
    await addTodoAction(title); // wait for server
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input name="title" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
            {todo.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Actions

React 19 introduces **Actions** — async functions that can be passed to `<form action>`, `startTransition`, and `useActionState`.

### Form Actions

```jsx
<form action={async (formData) => {
  'use server';
  await db.insert({ name: formData.get('name') });
}}>
  <input name="name" />
  <button type="submit">Save</button>
</form>
```

### Key Properties of Actions

- Automatically manage **pending states**.
- Support **optimistic updates** with `useOptimistic`.
- Handle **errors** through error boundaries or return values.
- Work with `useTransition` for non-blocking updates.

---

## ref as a Prop

In React 19, **`ref` is a regular prop** for function components — no more `forwardRef`.

```jsx
// React 18 — needed forwardRef
const Input = forwardRef(function Input(props, ref) {
  return <input ref={ref} {...props} />;
});

// React 19 — ref is just a prop
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

`forwardRef` is deprecated in React 19 and will be removed in a future version.

---

## Ref Callbacks with Cleanup

Ref callbacks can now return a **cleanup function**, similar to `useEffect`:

```jsx
function MeasuredBox() {
  return (
    <div
      ref={(node) => {
        if (node) {
          const observer = new ResizeObserver(entries => {
            console.log('Size changed:', entries[0].contentRect);
          });
          observer.observe(node);

          // Cleanup when ref detaches
          return () => observer.disconnect();
        }
      }}
    >
      Resize me
    </div>
  );
}
```

---

## Document Metadata

React 19 natively supports `<title>`, `<meta>`, and `<link>` tags **inside components**. React hoists them to `<head>` automatically.

```jsx
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />
      <link rel="canonical" href={`https://mysite.com/posts/${post.slug}`} />

      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

No more need for `react-helmet` or `next/head` for basic metadata.

---

## Stylesheet and Script Support

### Stylesheets with Precedence

```jsx
function Component() {
  return (
    <>
      <link
        rel="stylesheet"
        href="/styles/theme.css"
        precedence="default"
      />
      <div>Styled content</div>
    </>
  );
}
```

React deduplicates stylesheets and orders them by `precedence`.

### Async Scripts

```jsx
function Widget() {
  return (
    <>
      <script async src="https://analytics.example.com/script.js" />
      <div>Widget with analytics</div>
    </>
  );
}
```

React deduplicates and hoists scripts to `<head>`.

---

## Improved Error Reporting

React 19 provides better error messages and removes duplicate console logs. Errors now show:

- The component stack trace
- Proper error messages instead of minified codes
- `onCaughtError` and `onUncaughtError` callbacks on `createRoot`

```jsx
const root = createRoot(document.getElementById('root'), {
  onCaughtError(error, errorInfo) {
    // Errors caught by Error Boundaries
    reportToService(error, errorInfo.componentStack);
  },
  onUncaughtError(error, errorInfo) {
    // Errors NOT caught by Error Boundaries
    showErrorOverlay(error);
  },
});
```

---

## Migration Checklist

When upgrading to React 19:

1. Replace `forwardRef` with ref-as-prop.
2. Replace `useContext(Ctx)` with `use(Ctx)` where conditional access is needed.
3. Adopt `useActionState` for form handling.
4. Replace custom loading/error state management with Actions + Suspense.
5. Use `useOptimistic` for immediate UI feedback.
6. Remove `react-helmet` — use native metadata tags.
7. Run the React 19 codemod: `npx codemod@latest react/19/migration-recipe`.

---

## Summary

| Feature | What It Does |
|---|---|
| `use` | Read Promises/Context anywhere (even conditionals) |
| `useActionState` | Manage form action state + pending |
| `useFormStatus` | Read parent form pending state |
| `useOptimistic` | Show optimistic UI updates |
| Actions | Async functions for forms and transitions |
| ref as prop | No more `forwardRef` needed |
| Ref cleanup | Return cleanup from ref callbacks |
| Document metadata | Native `<title>`, `<meta>` in components |
