# Chapter 08 — Utility Types

TypeScript provides built-in utility types that transform existing types. These are essential for everyday TypeScript.

---

## Partial\<T\>

Makes all properties **optional**:

```ts
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// All properties become optional
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number }

// Perfect for update functions
function updateUser(id: number, updates: Partial<User>): User {
  const existing = getUserById(id);
  return { ...existing, ...updates };
}

updateUser(1, { name: 'New Name' });         // OK
updateUser(1, { email: 'new@email.com' });   // OK
updateUser(1, { name: 'New', age: 30 });     // OK
```

---

## Required\<T\>

Makes all properties **required** (opposite of Partial):

```ts
interface Config {
  host?: string;
  port?: number;
  debug?: boolean;
}

type RequiredConfig = Required<Config>;
// { host: string; port: number; debug: boolean }

function createServer(config: RequiredConfig): void {
  // All properties guaranteed to exist
  console.log(`Starting on ${config.host}:${config.port}`);
}
```

---

## Readonly\<T\>

Makes all properties **readonly**:

```ts
interface State {
  count: number;
  items: string[];
}

type FrozenState = Readonly<State>;
// { readonly count: number; readonly items: string[] }

const state: FrozenState = { count: 0, items: [] };
state.count = 1;        // ERROR: Cannot assign to 'count'
state.items.push('a');  // ⚠ Still works! Readonly is shallow
```

**Note:** `Readonly` is **shallow**. Nested objects and arrays can still be mutated. Use `as const` or deep readonly for truly immutable data.

---

## Pick\<T, K\>

Select specific properties from a type:

```ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Only pick the safe-to-expose properties
type PublicUser = Pick<User, 'id' | 'name' | 'email'>;
// { id: number; name: string; email: string }

function sanitizeUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
```

---

## Omit\<T, K\>

Remove specific properties (opposite of Pick):

```ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// Remove sensitive fields
type SafeUser = Omit<User, 'password'>;
// { id: number; name: string; email: string }

// For create operations — omit auto-generated fields
type CreateUserDto = Omit<User, 'id'>;
// { name: string; email: string; password: string }
```

---

## Record\<K, V\>

Create an object type with specific keys and value types:

```ts
// Simple dictionary
type UserMap = Record<string, User>;

const users: UserMap = {
  user1: { id: 1, name: 'Akshay', email: 'a@b.com', password: '***' },
};

// With literal key types
type StatusColors = Record<'success' | 'warning' | 'error', string>;

const colors: StatusColors = {
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
};

// Enum keys
type RolePermissions = Record<Role, Permission[]>;
```

---

## Exclude\<T, U\>

Remove types from a union:

```ts
type AllTypes = string | number | boolean | null | undefined;

type NonNullable2 = Exclude<AllTypes, null | undefined>;
// string | number | boolean

type Primitive = string | number | boolean | symbol | bigint;
type StringOrNumber = Exclude<Primitive, boolean | symbol | bigint>;
// string | number
```

---

## Extract\<T, U\>

Keep only types that match (opposite of Exclude):

```ts
type AllTypes = string | number | boolean | (() => void);

type Functions = Extract<AllTypes, Function>;
// () => void

type Strings = Extract<AllTypes, string>;
// string
```

---

## NonNullable\<T\>

Remove `null` and `undefined`:

```ts
type MaybeString = string | null | undefined;

type DefiniteString = NonNullable<MaybeString>;
// string

// Useful for function returns
function getUser(): User | null { /* ... */ }

function processUser(): NonNullable<ReturnType<typeof getUser>> {
  const user = getUser();
  if (!user) throw new Error('Not found');
  return user;
}
```

---

## ReturnType\<T\>

Extract the return type of a function:

```ts
function createUser(name: string, age: number) {
  return { id: Date.now(), name, age, createdAt: new Date() };
}

type User = ReturnType<typeof createUser>;
// { id: number; name: string; age: number; createdAt: Date }
```

---

## Parameters\<T\>

Extract the parameter types of a function as a tuple:

```ts
function fetch(url: string, options?: { method: string; body?: string }): Promise<Response> {
  /* ... */
}

type FetchParams = Parameters<typeof fetch>;
// [url: string, options?: { method: string; body?: string }]

type FirstParam = Parameters<typeof fetch>[0]; // string
```

---

## Awaited\<T\>

Unwrap Promise types:

```ts
type A = Awaited<Promise<string>>;              // string
type B = Awaited<Promise<Promise<number>>>;     // number (deep unwrap)
type C = Awaited<string | Promise<boolean>>;    // string | boolean
```

---

## Combining Utility Types

Real-world patterns often combine multiple utilities:

```ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

// Create DTO — no id or timestamps
type CreateUserDto = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

// Update DTO — partial, no id or timestamps
type UpdateUserDto = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

// Public response — no password
type UserResponse = Readonly<Omit<User, 'password'>>;

// Admin filter — only filterable fields, all optional
type UserFilter = Partial<Pick<User, 'name' | 'email' | 'role'>>;
```

---

## Summary

| Utility | What It Does | Example |
|---|---|---|
| `Partial<T>` | All properties optional | Update DTOs |
| `Required<T>` | All properties required | Config validation |
| `Readonly<T>` | All properties readonly | Immutable state |
| `Pick<T, K>` | Select properties | API responses |
| `Omit<T, K>` | Remove properties | Create DTOs |
| `Record<K, V>` | Object with typed keys | Dictionaries, maps |
| `Exclude<T, U>` | Remove from union | Filter types |
| `Extract<T, U>` | Keep matching union members | Filter types |
| `NonNullable<T>` | Remove null/undefined | Safe values |
| `ReturnType<T>` | Function return type | Infer types |
| `Parameters<T>` | Function params tuple | Wrapper functions |
| `Awaited<T>` | Unwrap Promises | Async values |
