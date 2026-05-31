# Chapter 07 — Type Narrowing and Guards

## What Is Type Narrowing?

Narrowing is the process of refining a broad type into a more specific one. TypeScript tracks your control flow and narrows types automatically.

```ts
function process(value: string | number) {
  // Here, value is string | number

  if (typeof value === 'string') {
    // Here, value is string
    console.log(value.toUpperCase());
  } else {
    // Here, value is number
    console.log(value.toFixed(2));
  }
}
```

---

## typeof Guards

Works for primitive types: `string`, `number`, `boolean`, `symbol`, `bigint`, `undefined`, `function`, `object`.

```ts
function stringify(value: string | number | boolean): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return value ? 'true' : 'false';
}
```

**Limitation:** `typeof null === 'object'` — so `typeof` can't distinguish `null` from objects.

---

## instanceof Guards

Check if a value is an instance of a class:

```ts
class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

class ValidationError extends Error {
  field: string;
  constructor(message: string, field: string) {
    super(message);
    this.field = field;
  }
}

function handleError(error: Error) {
  if (error instanceof ApiError) {
    console.log(`API Error ${error.statusCode}: ${error.message}`);
  } else if (error instanceof ValidationError) {
    console.log(`Validation Error on ${error.field}: ${error.message}`);
  } else {
    console.log(`Unknown Error: ${error.message}`);
  }
}
```

---

## `in` Operator Guard

Check if a property exists on an object:

```ts
type Fish = { swim: () => void; name: string };
type Bird = { fly: () => void; name: string };
type Dog = { run: () => void; name: string };

type Animal = Fish | Bird | Dog;

function move(animal: Animal) {
  if ('swim' in animal) {
    animal.swim();       // TypeScript knows: Fish
  } else if ('fly' in animal) {
    animal.fly();        // TypeScript knows: Bird
  } else {
    animal.run();        // TypeScript knows: Dog
  }
}
```

---

## Equality Narrowing

```ts
function compare(a: string | number, b: string | boolean) {
  if (a === b) {
    // Both must be string (the only common type)
    console.log(a.toUpperCase());
    console.log(b.toUpperCase());
  }
}

// Null checks
function process(value: string | null | undefined) {
  if (value != null) {
    // Excludes both null and undefined
    console.log(value.toUpperCase());
  }
}
```

---

## Discriminated Union Narrowing

The most powerful narrowing pattern — use a shared literal property:

```ts
type LoadingState = { status: 'loading' };
type SuccessState = { status: 'success'; data: string[] };
type ErrorState = { status: 'error'; message: string };

type State = LoadingState | SuccessState | ErrorState;

function render(state: State): string {
  switch (state.status) {
    case 'loading':
      return 'Loading...';
    case 'success':
      return state.data.join(', ');    // TypeScript knows data exists
    case 'error':
      return `Error: ${state.message}`; // TypeScript knows message exists
  }
}
```

---

## Custom Type Guards (Type Predicates)

Create reusable narrowing functions using `value is Type` syntax:

```ts
interface Cat {
  meow(): void;
  purr(): void;
}

interface Dog {
  bark(): void;
  fetch(): void;
}

// Type predicate — tells TypeScript what the function narrows to
function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal;
}

function interact(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.purr();    // TypeScript knows it's Cat
  } else {
    animal.fetch();   // TypeScript knows it's Dog
  }
}
```

### Filtering Arrays with Type Guards

```ts
type Result = { value: string } | null | undefined;

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

const results: Result[] = [{ value: 'a' }, null, { value: 'b' }, undefined];
const valid = results.filter(isDefined);
// type: { value: string }[]  — nulls and undefineds removed!
```

### Validating External Data

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data &&
    typeof (data as User).id === 'number' &&
    typeof (data as User).name === 'string' &&
    typeof (data as User).email === 'string'
  );
}

async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  const data: unknown = await res.json();

  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }

  return data; // TypeScript knows it's User
}
```

---

## Assertion Functions

Assert that a condition is true — and narrow the type:

```ts
function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Expected string, got ${typeof value}`);
  }
}

function process(value: unknown) {
  assertString(value);
  // After the assertion, TypeScript knows value is string
  console.log(value.toUpperCase());
}

// Non-null assertion function
function assertDefined<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error('Value is null or undefined');
  }
}

function getUser(id: number) {
  const user = users.find(u => u.id === id);
  assertDefined(user);
  return user.name; // TypeScript knows user is defined
}
```

---

## Narrowing with `satisfies`

The `satisfies` operator (TS 4.9+) validates a type without widening it:

```ts
type Color = 'red' | 'green' | 'blue';
type Theme = Record<string, Color | [number, number, number]>;

// Without satisfies — type is widened
const theme1: Theme = {
  primary: 'red',
  secondary: [0, 128, 0],
};
theme1.primary.toUpperCase(); // ERROR: Property doesn't exist on Color | [number, number, number]

// With satisfies — preserves the specific type
const theme2 = {
  primary: 'red',
  secondary: [0, 128, 0],
} satisfies Theme;

theme2.primary.toUpperCase(); // OK — TypeScript knows primary is 'red' (string)
theme2.secondary[0];          // OK — TypeScript knows secondary is [number, number, number]
```

---

## Control Flow Analysis

TypeScript tracks assignments through your code:

```ts
function example() {
  let x: string | number | boolean;

  x = Math.random() > 0.5 ? 'hello' : 42;
  // x is string | number

  if (typeof x === 'string') {
    x; // string
    return;
  }

  x; // number (string was eliminated by the return)
}
```

### Truthiness Narrowing

```ts
function printAll(values: string | string[] | null) {
  if (values) {
    // Excluded null, undefined, empty string, 0
    if (Array.isArray(values)) {
      console.log(values.join(', '));
    } else {
      console.log(values);
    }
  }
}
```

---

## Summary

| Guard Type | Syntax | Works With |
|---|---|---|
| `typeof` | `typeof x === 'string'` | Primitives |
| `instanceof` | `x instanceof Error` | Classes |
| `in` | `'key' in obj` | Property checks |
| Equality | `x === y` | Any types |
| Discriminated union | `switch (x.kind)` | Tagged unions |
| Type predicate | `x is Type` | Custom reusable guards |
| Assertion function | `asserts x is Type` | Throw on invalid |
| `satisfies` | `value satisfies Type` | Validate without widening |
