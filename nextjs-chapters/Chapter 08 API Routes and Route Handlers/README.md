# Chapter 08 — API Routes and Route Handlers

## Route Handlers

Route Handlers let you create API endpoints using `route.ts` files in the App Router:

```
app/
├── api/
│   ├── users/
│   │   └── route.ts        → /api/users
│   ├── users/
│   │   └── [id]/
│   │       └── route.ts    → /api/users/123
│   └── health/
│       └── route.ts        → /api/health
```

---

## Basic Route Handlers

### GET

```tsx
// app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}
```

### POST

```tsx
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const user = await db.user.create({
    data: {
      name: body.name,
      email: body.email,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
```

### All HTTP Methods

```tsx
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const post = await db.post.findUnique({ where: { id: Number(id) } });

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  const post = await db.post.update({
    where: { id: Number(id) },
    data: body,
  });

  return NextResponse.json(post);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await db.post.delete({ where: { id: Number(id) } });
  return new NextResponse(null, { status: 204 });
}
```

---

## Request Object

### Query Parameters

```tsx
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;

  const results = await search(query, page, limit);
  return NextResponse.json(results);
}
// GET /api/search?q=hello&page=2&limit=20
```

### Headers

```tsx
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  const userAgent = request.headers.get('user-agent');

  return NextResponse.json({ authenticated: !!authHeader });
}
```

### Cookies

```tsx
export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const response = NextResponse.json({ data: 'hello' });
  response.cookies.set('visited', 'true', {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
  });

  return response;
}
```

### Form Data

```tsx
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const file = formData.get('file') as File;

  if (file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    // Save file...
  }

  return NextResponse.json({ success: true });
}
```

---

## Response Patterns

### JSON Response

```tsx
return NextResponse.json(data);
return NextResponse.json(data, { status: 201 });
return NextResponse.json({ error: 'Not found' }, { status: 404 });
```

### Custom Headers

```tsx
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, max-age=3600',
    'X-Custom-Header': 'value',
  },
});
```

### Streaming Response

```tsx
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`data: ${i}\n\n`));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

### Redirect

```tsx
import { redirect } from 'next/navigation';

export async function GET() {
  redirect('/new-location');
}

// Or with NextResponse
export async function GET() {
  return NextResponse.redirect(new URL('/new-location', request.url));
}
```

---

## Input Validation

Always validate input from external sources:

```tsx
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = CreateUserSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: result.error.issues },
      { status: 400 }
    );
  }

  const user = await db.user.create({ data: result.data });
  return NextResponse.json(user, { status: 201 });
}
```

---

## CORS

```tsx
// app/api/public/route.ts
export async function GET(request: NextRequest) {
  const data = { message: 'Hello from API' };

  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': 'https://example.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://example.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
```

---

## Route Handler Caching

```tsx
// Static — cached by default (GET with no dynamic data)
export async function GET() {
  return NextResponse.json({ message: 'cached' });
}

// Dynamic — opt out of caching
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ timestamp: Date.now() });
}
```

A GET Route Handler is **cached** unless it:
- Uses `Request` object
- Uses any other HTTP method (POST, PUT, etc.)
- Uses dynamic functions (`cookies()`, `headers()`)
- Uses `export const dynamic = 'force-dynamic'`

---

## Route Handlers vs Server Actions

| Feature | Route Handler | Server Action |
|---|---|---|
| HTTP Methods | GET, POST, PUT, DELETE, etc. | POST only |
| Called from | Client fetch, external APIs | Forms, client components |
| URL | Has a public URL | No public URL |
| Caching | GET can be cached | Not cached |
| Use case | REST APIs, webhooks | Form submissions, mutations |

**When to use Route Handlers:**
- Building a public REST API
- Webhooks from third-party services
- Need specific HTTP methods
- External clients consume your API

**When to use Server Actions:**
- Form submissions
- Data mutations from your UI
- No need for a public API endpoint

---

## Summary

| Concept | Usage |
|---|---|
| Route file | `app/api/route.ts` |
| Dynamic params | `app/api/[id]/route.ts` |
| Request body | `await request.json()` |
| Query params | `request.nextUrl.searchParams` |
| JSON response | `NextResponse.json(data)` |
| Status codes | `NextResponse.json(data, { status: 201 })` |
| Validation | Use Zod for input validation |
| Streaming | Return `ReadableStream` |
| Caching | GET is cached by default |
