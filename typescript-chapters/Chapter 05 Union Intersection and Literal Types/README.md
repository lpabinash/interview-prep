# Chapter 05 — Union, Intersection, and Literal Types

## Union Types

A value can be **one of several types**:

```ts
let id: string | number;
id = 'abc-123';  // OK
id = 42;         // OK
id = true;       // ERROR: Type 'boolean' is not assignable

// Function parameter
function printId(id: string | number): void {
  console.log(`ID: ${id}`);
}

printId(101);
printId('abc-123');
```

### Narrowing Unions

TypeScript requires you to **narrow** the type before using type-specific methods:

```ts
function printId(id: string | number): void {
  // id.toUpperCase();  // ERROR: Property 'toUpperCase' does not exist on type 'number'

  if (typeof id === 'string') {
    console.log(id.toUpperCase());  // OK — TypeScript knows id is string here
  } else {
    console.log(id.toFixed(2));     // OK — TypeScript knows id is number here
  }
}
```

---

## Discriminated Unions

The most powerful pattern in TypeScript. Use a **common property** (discriminant) to distinguish between variants:

```ts
type Circle = {
  kind: 'circle';
  radius: number;
};

type Rectangle = {
  kind: 'rectangle';
  width: number;
  height: number;
};

type Triangle = {
  kind: 'triangle';
  base: number;
  height: number;
};

type Shape = Circle | Rectangle | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return 0.5 * shape.base * shape.height;
  }
}
```

### Exhaustive Checking with `never`

```ts
function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return 0.5 * shape.base * shape.height;
    default:
      // If you add a new shape but forget to handle it,
      // TypeScript throws a compile error here
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}
```

### API Response Pattern

```ts
type ApiResponse<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }
  | { status: 'loading' };

function handleResponse(response: ApiResponse<User[]>): void {
  switch (response.status) {
    case 'success':
      console.log(response.data);     // TypeScript knows data exists
      break;
    case 'error':
      console.error(response.message); // TypeScript knows message exists
      break;
    case 'loading':
      console.log('Loading...');
      break;
  }
}
```

---

## Intersection Types

Combine multiple types into one — the result has **all** properties:

```ts
type HasId = { id: number };
type HasName = { name: string };
type HasEmail = { email: string };

type User = HasId & HasName & HasEmail;

const user: User = {
  id: 1,
  name: 'Akshay',
  email: 'akshay@example.com',
};
// Must have ALL three: id, name, and email
```

### Extending Existing Types

```ts
type BaseEntity = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};

type User = BaseEntity & {
  name: string;
  email: string;
};

type Post = BaseEntity & {
  title: string;
  content: string;
  authorId: number;
};
```

### Function Intersection

```ts
type Logger = {
  log: (msg: string) => void;
};

type ErrorHandler = {
  handleError: (err: Error) => void;
};

type Service = Logger & ErrorHandler;

const service: Service = {
  log(msg) { console.log(msg); },
  handleError(err) { console.error(err.message); },
};
```

---

## Literal Types

Restrict values to specific literals:

### String Literals

```ts
type Theme = 'light' | 'dark' | 'system';

function setTheme(theme: Theme): void {
  document.body.className = theme;
}

setTheme('dark');      // OK
setTheme('blue');      // ERROR: Argument of type '"blue"' is not assignable
```

### Numeric Literals

```ts
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

function roll(): DiceRoll {
  return (Math.floor(Math.random() * 6) + 1) as DiceRoll;
}
```

### Boolean Literals

```ts
type True = true;
type False = false;

// Useful in conditional types and mapped types
type IsString<T> = T extends string ? true : false;
```

### `as const` — Infer Literal Types

```ts
// Without as const — inferred as string[]
const colors = ['red', 'green', 'blue'];

// With as const — inferred as readonly ['red', 'green', 'blue']
const colors2 = ['red', 'green', 'blue'] as const;

// Type is 'red' | 'green' | 'blue'
type Color = (typeof colors2)[number];

// Object with as const
const config = {
  api: 'https://api.example.com',
  port: 3000,
  debug: false,
} as const;
// config.port is type 3000 (literal), not number
```

---

## Template Literal Types

Build string types from other types:

```ts
type Color = 'red' | 'green' | 'blue';
type Size = 'sm' | 'md' | 'lg';

// Generates: 'red-sm' | 'red-md' | 'red-lg' | 'green-sm' | ... (9 combinations)
type ClassName = `${Color}-${Size}`;

let cls: ClassName = 'red-sm';   // OK
let cls2: ClassName = 'red-xl';  // ERROR

// Event handlers
type EventName = 'click' | 'focus' | 'blur';
type HandlerName = `on${Capitalize<EventName>}`;
// 'onClick' | 'onFocus' | 'onBlur'
```

---

## Type Guards

Narrow types at runtime:

```ts
// typeof guard
function process(value: string | number): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value.toString();
}

// instanceof guard
function formatError(error: Error | string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return error;
}

// `in` operator guard
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird): void {
  if ('swim' in animal) {
    animal.swim();
  } else {
    animal.fly();
  }
}

// Custom type guard (type predicate)
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process(value: unknown): void {
  if (isString(value)) {
    console.log(value.toUpperCase()); // TypeScript knows it's string
  }
}
```

---

## Nullable Types

```ts
// strictNullChecks enabled (recommended)
let name: string = 'Akshay';
name = null;       // ERROR
name = undefined;  // ERROR

// Explicitly allow null
let name2: string | null = 'Akshay';
name2 = null;      // OK

// Optional chaining + nullish coalescing
type User = {
  name: string;
  address?: {
    city?: string;
  };
};

function getCity(user: User): string {
  return user.address?.city ?? 'Unknown';
}
```

---

## Summary

| Concept | Syntax | Use Case |
|---|---|---|
| Union | `A \| B` | Value is one of several types |
| Intersection | `A & B` | Value has all properties of both |
| Discriminated Union | `{ kind: 'x' }` | Tagged variants with exhaustive checking |
| Literal Type | `'dark' \| 'light'` | Restrict to specific values |
| `as const` | `[...] as const` | Infer literal types from values |
| Template Literal | `` `${A}-${B}` `` | Build string types dynamically |
| Type Guard | `typeof`, `in`, `instanceof` | Narrow types at runtime |
