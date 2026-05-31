# Chapter 06 — Middleware and Authentication

## Middleware

Middleware runs **before** a request is completed. It executes on the Edge runtime for every matching route.

### Basic Middleware

```tsx
// middleware.ts (at the root of your project, same level as app/)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('Middleware running for:', request.nextUrl.pathname);
  return NextResponse.next(); // Continue to the page
}

// Run middleware only on specific routes
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

### Redirects

```tsx
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect old paths
  if (pathname === '/old-page') {
    return NextResponse.redirect(new URL('/new-page', request.url));
  }

  // Redirect www to non-www
  if (request.headers.get('host')?.startsWith('www.')) {
    const newUrl = new URL(request.url);
    newUrl.host = newUrl.host.replace('www.', '');
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
}
```

### Rewriting (URL Masking)

```tsx
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Feature flags — serve different page without changing URL
  if (pathname === '/dashboard') {
    const isBeta = request.cookies.get('beta')?.value === 'true';
    if (isBeta) {
      return NextResponse.rewrite(new URL('/dashboard-beta', request.url));
    }
  }

  return NextResponse.next();
}
```

### Setting Headers and Cookies

```tsx
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set response headers
  response.headers.set('x-custom-header', 'my-value');

  // Set cookies
  response.cookies.set('visited', 'true', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  });

  // Read cookies
  const token = request.cookies.get('token')?.value;

  return response;
}
```

### Matcher Configuration

```tsx
export const config = {
  matcher: [
    // Match all routes except static files and API
    '/((?!_next/static|_next/image|favicon.ico).*)',

    // Specific paths
    '/dashboard/:path*',
    '/api/:path*',

    // Regex
    '/blog/:slug*',
  ],
};
```

---

## Authentication Patterns

### Session-Based Auth with Middleware

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/profile', '/settings'];
const publicRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value;

  // Redirect unauthenticated users from protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users from login/register
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/settings/:path*', '/login', '/register'],
};
```

### JWT Verification in Middleware

```tsx
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.sub as string);
    response.headers.set('x-user-role', payload.role as string);
    return response;
  } catch {
    // Invalid or expired token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}
```

---

## Auth with Server Actions

### Login Action

```tsx
// app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(prevState: any, formData: FormData) {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const { email, password } = validatedFields.data;
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'Invalid credentials' };
  }

  // Create JWT
  const token = await new SignJWT({ sub: user.id, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  redirect('/dashboard');
}
```

### Logout Action

```tsx
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  redirect('/login');
}
```

### Auth Check in Server Components

```tsx
// lib/auth.ts
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!)
    );
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

// app/dashboard/page.tsx
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  return <h1>Welcome, User {user.id}!</h1>;
}
```

---

## Role-Based Access

```tsx
// middleware.ts
const roleRoutes: Record<string, string[]> = {
  admin: ['/admin', '/dashboard', '/settings'],
  editor: ['/dashboard', '/posts'],
  user: ['/dashboard', '/profile'],
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { payload } = await jwtVerify(token, JWT_SECRET);
  const role = payload.role as string;
  const { pathname } = request.nextUrl;

  const allowed = roleRoutes[role] || [];
  const hasAccess = allowed.some(route => pathname.startsWith(route));

  if (!hasAccess) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}
```

---

## Middleware Limitations

- Runs on the **Edge Runtime** — limited API surface
- Cannot use Node.js APIs (`fs`, `path`, `crypto` full module)
- Should be **fast** — runs on every matched request
- Cannot render React components
- Cannot use `cookies().set()` or `headers()` from `next/headers` — use `NextResponse`

---

## Summary

| Feature | Implementation |
|---|---|
| Middleware | `middleware.ts` at project root |
| Route matching | `config.matcher` array |
| Redirect | `NextResponse.redirect()` |
| Rewrite | `NextResponse.rewrite()` |
| Auth check | Verify JWT/session in middleware |
| Login | Server Action + set cookie |
| Logout | Server Action + delete cookie |
| Protected routes | Middleware redirect to login |
| Role-based access | Check role in middleware |
