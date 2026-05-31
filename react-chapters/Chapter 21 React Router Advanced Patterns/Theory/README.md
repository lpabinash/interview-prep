# Chapter 21 — React Router Advanced Patterns

## React Router v6 Fundamentals

React Router is the standard routing library for React SPAs. Version 6 introduced a cleaner API with hooks-first design.

```bash
npm install react-router-dom
```

### Basic Setup

```jsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'contact', element: <Contact /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

### Layout with Outlet

`<Outlet />` renders the matched child route:

```jsx
import { Outlet, Link } from 'react-router-dom';

function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <main>
        <Outlet /> {/* Child route renders here */}
      </main>
    </div>
  );
}
```

---

## Dynamic Routes and Params

```jsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'users', element: <UserList /> },
      { path: 'users/:userId', element: <UserProfile /> },
      { path: 'users/:userId/posts/:postId', element: <Post /> },
    ],
  },
]);
```

### Reading Params

```jsx
import { useParams } from 'react-router-dom';

function UserProfile() {
  const { userId } = useParams();

  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
  }, [userId]);

  if (!user) return <Shimmer />;
  return <h2>{user.name}</h2>;
}
```

---

## Nested Routes

Routes can be nested to create shared layouts:

```jsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardHome /> },
          { path: 'analytics', element: <Analytics /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
    ],
  },
]);

function DashboardLayout() {
  return (
    <div className="flex">
      <aside>
        <Link to="/dashboard">Overview</Link>
        <Link to="/dashboard/analytics">Analytics</Link>
        <Link to="/dashboard/settings">Settings</Link>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

Each layout renders its own `<Outlet>` for child routes. The URL `/dashboard/analytics` renders:

```
AppLayout → DashboardLayout → Analytics
```

---

## Protected Routes (Auth Guard)

Prevent unauthenticated users from accessing certain pages:

```jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';

function ProtectedRoute({ isAuthenticated }) {
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
```

### Using in Routes

```jsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },

      // Protected routes
      {
        element: <ProtectedRoute isAuthenticated={isLoggedIn} />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'profile', element: <Profile /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
    ],
  },
]);
```

### Redirect After Login

```jsx
function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (credentials) => {
    await loginAPI(credentials);
    navigate(from, { replace: true }); // go to originally intended page
  };

  return <LoginForm onSubmit={handleLogin} />;
}
```

### Role-Based Access

```jsx
function RoleGuard({ allowedRoles, userRole }) {
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}

// Routes
{
  element: <RoleGuard allowedRoles={['admin']} userRole={user.role} />,
  children: [
    { path: 'admin', element: <AdminPanel /> },
    { path: 'admin/users', element: <ManageUsers /> },
  ],
}
```

---

## Navigation Hooks

### useNavigate

Programmatic navigation:

```jsx
import { useNavigate } from 'react-router-dom';

function CreatePost() {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    const post = await createPost(data);
    navigate(`/posts/${post.id}`); // navigate to the new post
  };

  // Go back
  const handleCancel = () => navigate(-1);

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <button type="button" onClick={handleCancel}>Cancel</button>
      <button type="submit">Create</button>
    </form>
  );
}
```

### useSearchParams

Read and update URL query parameters:

```jsx
import { useSearchParams } from 'react-router-dom';

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'name';

  const updateFilters = (key, value) => {
    setSearchParams(prev => {
      prev.set(key, value);
      return prev;
    });
  };

  return (
    <div>
      <select
        value={category}
        onChange={e => updateFilters('category', e.target.value)}
      >
        <option value="all">All</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>

      <ProductGrid category={category} sort={sort} />
    </div>
  );
}
```

### useLocation

Access the current location object:

```jsx
import { useLocation } from 'react-router-dom';

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="breadcrumb">
      <Link to="/">Home</Link>
      {segments.map((segment, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        return (
          <span key={path}>
            {' / '}
            <Link to={path}>{segment}</Link>
          </span>
        );
      })}
    </nav>
  );
}
```

---

## Error Handling in Routes

```jsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,  // catches errors in any child
    children: [
      { path: 'users/:id', element: <UserProfile /> },
    ],
  },
  { path: '*', element: <NotFound /> },  // 404 fallback
]);

function ErrorPage() {
  const error = useRouteError();
  return (
    <div>
      <h1>Something went wrong</h1>
      <p>{error.statusText || error.message}</p>
    </div>
  );
}
```

---

## Data Loading with Loaders

React Router v6.4+ supports **loaders** — fetch data before the route renders:

```jsx
const router = createBrowserRouter([
  {
    path: 'users/:userId',
    element: <UserProfile />,
    loader: async ({ params }) => {
      const res = await fetch(`/api/users/${params.userId}`);
      if (!res.ok) throw new Response('Not Found', { status: 404 });
      return res.json();
    },
    errorElement: <UserNotFound />,
  },
]);

function UserProfile() {
  const user = useLoaderData();
  return <h2>{user.name}</h2>;
}
```

**Benefits:** Data loads in parallel with code, eliminates loading spinners, errors caught by errorElement.

---

## Lazy Loading Routes

Combine `React.lazy` with route code splitting:

```jsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<Shimmer />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<Shimmer />}>
            <Settings />
          </Suspense>
        ),
      },
    ],
  },
]);
```

---

## Router Types

| Router | URL Format | Use Case |
|---|---|---|
| `createBrowserRouter` | `/path` | Production SPAs (requires server config) |
| `createHashRouter` | `/#/path` | Static hosting without server config |
| `createMemoryRouter` | In-memory | Testing, React Native, embedded UIs |

---

## Interview Questions

**Q: How do you handle 404 pages in React Router v6?**
A: Add a catch-all route with `path: '*'` at the end of your route config, and render a `<NotFound />` component. You can also use `errorElement` on parent routes to catch errors.

**Q: What is the difference between `<Link>` and `<NavLink>`?**
A: `NavLink` is like `Link` but adds an `active` class (or applies a style function) when its `to` matches the current URL. Use it for navigation menus to highlight the current page.

**Q: How do you pass data between routes?**
A: (1) URL params — `useParams()`, (2) query strings — `useSearchParams()`, (3) location state — `navigate('/path', { state: data })` and `useLocation().state`, (4) loaders — `useLoaderData()`.

**Q: How do you prevent navigation (e.g., unsaved form)?**
A: Use the `useBlocker` hook (v6.4+) to intercept navigation and show a confirmation prompt when the form has unsaved changes.
