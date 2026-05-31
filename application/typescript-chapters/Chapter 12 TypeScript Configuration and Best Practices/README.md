# Chapter 12 — TypeScript Configuration and Best Practices

## tsconfig.json

The `tsconfig.json` file controls how TypeScript compiles your code.

### Essential Options

```json
{
  "compilerOptions": {
    // Language and Output
    "target": "ES2022",              // JavaScript version to emit
    "module": "ESNext",              // Module system
    "moduleResolution": "bundler",   // How to resolve imports
    "lib": ["ES2022", "DOM", "DOM.Iterable"],  // Available APIs

    // Strictness (enable ALL of these)
    "strict": true,                  // Enables all strict checks below:
    //   "strictNullChecks": true,
    //   "strictFunctionTypes": true,
    //   "strictBindCallApply": true,
    //   "strictPropertyInitialization": true,
    //   "noImplicitAny": true,
    //   "noImplicitThis": true,
    //   "alwaysStrict": true,
    //   "useUnknownInCatchVariables": true,

    // Additional Checks
    "noUncheckedIndexedAccess": true,  // arr[0] is T | undefined
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true,

    // Emit
    "outDir": "./dist",
    "declaration": true,            // Generate .d.ts files
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": false,                // true for type-checking only (Next.js)
    "esModuleInterop": true,
    "skipLibCheck": true,

    // Path Aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Framework-Specific Configs

**Next.js:**
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**React (Vite):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true
  }
}
```

---

## Best Practices

### 1. Always Enable Strict Mode

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

This catches the most bugs. **Never set `strict: false`** in a new project.

### 2. Prefer `unknown` Over `any`

```ts
// BAD — any disables type checking
function parse(json: string): any {
  return JSON.parse(json);
}

// GOOD — unknown forces you to validate
function parse(json: string): unknown {
  return JSON.parse(json);
}

const data = parse('{"name":"Akshay"}');
// Must narrow before using
if (typeof data === 'object' && data !== null && 'name' in data) {
  console.log((data as { name: string }).name);
}
```

### 3. Use `satisfies` for Const Objects

```ts
// BAD — loses specific type info
const routes: Record<string, string> = {
  home: '/',
  about: '/about',
};
routes.typo; // No error — string index allows anything

// GOOD — validates AND preserves specific keys
const routes = {
  home: '/',
  about: '/about',
} satisfies Record<string, string>;
routes.typo; // ERROR: Property 'typo' does not exist
```

### 4. Prefer Interfaces for Objects, Types for Unions

```ts
// Interface — for object shapes (can be extended/merged)
interface User {
  id: number;
  name: string;
}

// Type — for unions, intersections, mapped types
type Status = 'active' | 'inactive';
type Response<T> = { data: T } | { error: string };
```

### 5. Use Discriminated Unions Over Optional Properties

```ts
// BAD — unclear which properties exist together
interface Shape {
  kind: string;
  radius?: number;
  width?: number;
  height?: number;
}

// GOOD — each variant is clear
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };
```

### 6. Use `as const` for Fixed Values

```ts
// BAD — inferred as string[]
const ROLES = ['admin', 'user', 'guest'];

// GOOD — inferred as readonly ['admin', 'user', 'guest']
const ROLES = ['admin', 'user', 'guest'] as const;
type Role = (typeof ROLES)[number]; // 'admin' | 'user' | 'guest'
```

### 7. Avoid Type Assertions When Possible

```ts
// BAD — skips type checking
const user = {} as User;

// GOOD — type-safe construction
const user: User = {
  id: 1,
  name: 'Akshay',
};

// OK — when narrowing known safe values
const input = event.target as HTMLInputElement;
```

### 8. Use `readonly` for Data That Shouldn't Change

```ts
interface Config {
  readonly apiUrl: string;
  readonly maxRetries: number;
}

function processItems(items: readonly string[]): void {
  // items.push('x'); // ERROR — can't mutate
  items.forEach(item => console.log(item)); // OK — reading
}
```

### 9. Return Type Annotations for Public APIs

```ts
// Internal/private — let TypeScript infer
const double = (n: number) => n * 2;

// Public/exported — annotate return type
export function getUser(id: number): User | null {
  // Return type change = compile error = intentional change
}
```

### 10. Use Exhaustive Checks

```ts
type Action = 'create' | 'update' | 'delete';

function handle(action: Action): string {
  switch (action) {
    case 'create': return 'Created';
    case 'update': return 'Updated';
    case 'delete': return 'Deleted';
    default:
      const _exhaustive: never = action;
      return _exhaustive;
  }
}
```

---

## Common Patterns

### Zod for Runtime Validation

```ts
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).optional(),
});

// Infer TypeScript type from schema
type User = z.infer<typeof UserSchema>;

// Runtime validation + type narrowing
function parseUser(data: unknown): User {
  return UserSchema.parse(data); // throws ZodError if invalid
}

// Safe parsing
const result = UserSchema.safeParse(data);
if (result.success) {
  console.log(result.data.name); // fully typed
} else {
  console.error(result.error.issues);
}
```

### Error Handling Pattern

```ts
// Result type — no exceptions
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { ok: false, error: 'Division by zero' };
  }
  return { ok: true, value: a / b };
}

const result = divide(10, 0);
if (result.ok) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

### Type-Safe API Client

```ts
interface ApiEndpoints {
  '/users': { GET: User[]; POST: User };
  '/users/:id': { GET: User; PUT: User; DELETE: void };
  '/posts': { GET: Post[]; POST: Post };
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function api<
  Path extends keyof ApiEndpoints,
  M extends keyof ApiEndpoints[Path] & Method
>(
  path: Path,
  method: M
): Promise<ApiEndpoints[Path][M]> {
  const response = await fetch(path as string, { method });
  return response.json();
}

// Fully type-safe
const users = await api('/users', 'GET');    // User[]
const user = await api('/users/:id', 'GET'); // User
```

---

## Project Conventions

### Folder Structure

```
src/
  components/     # UI components
  hooks/          # Custom hooks
  types/          # Shared types (index.ts barrel)
  utils/          # Utility functions
  services/       # API calls
  constants/      # Constants and config
```

### Naming Conventions

```ts
// Types and interfaces — PascalCase
interface UserProfile { }
type ApiResponse<T> = { };

// Variables and functions — camelCase
const userName = 'Akshay';
function getUserById(id: number) { }

// Constants — SCREAMING_SNAKE_CASE or camelCase
const MAX_RETRIES = 3;
const apiUrl = 'https://api.example.com';

// Enums — PascalCase name, PascalCase members
enum UserRole { Admin, Editor, Viewer }

// Generic parameters — single uppercase letter or descriptive
function map<T, U>(arr: T[], fn: (item: T) => U): U[] { }
function merge<TSource, TTarget>(source: TSource, target: TTarget) { }

// File names — kebab-case or PascalCase for components
// user-profile.ts, UserProfile.tsx, use-auth.ts
```

---

## Summary

| Practice | Rule |
|---|---|
| Strict mode | Always `"strict": true` |
| `any` | Avoid — use `unknown` instead |
| Assertions | Minimize — prefer narrowing |
| Union vs optional | Discriminated unions are clearer |
| `as const` | Use for fixed value sets |
| `satisfies` | Validate without widening |
| Return types | Annotate public/exported functions |
| `readonly` | Use for immutable data |
| Exhaustive checks | Use `never` in default case |
| Runtime validation | Use Zod or similar library |
