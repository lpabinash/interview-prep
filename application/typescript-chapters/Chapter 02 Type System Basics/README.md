# Chapter 02 — Type System Basics

## Primitive Types

TypeScript has the same primitive types as JavaScript, plus a few extras.

```ts
// String
let name: string = 'Akshay';
let greeting: string = `Hello, ${name}`;

// Number (integers and floats)
let age: number = 25;
let price: number = 99.99;
let hex: number = 0xff;

// Boolean
let isActive: boolean = true;

// Null and Undefined
let nothing: null = null;
let notDefined: undefined = undefined;

// BigInt
let big: bigint = 100n;

// Symbol
let id: symbol = Symbol('id');
```

---

## Arrays

```ts
// Two syntaxes — both are equivalent
let numbers: number[] = [1, 2, 3, 4, 5];
let names: Array<string> = ['Alice', 'Bob'];

// TypeScript enforces element types
numbers.push('six');   // ERROR: Argument of type 'string' is not assignable
numbers.push(6);       // OK

// Readonly arrays
let frozen: readonly number[] = [1, 2, 3];
frozen.push(4);        // ERROR: Property 'push' does not exist on type 'readonly number[]'
```

---

## Tuples

Fixed-length arrays where each position has a specific type:

```ts
// [string, number]
let person: [string, number] = ['Akshay', 25];

person[0].toUpperCase(); // OK — TypeScript knows index 0 is string
person[1].toFixed(2);    // OK — TypeScript knows index 1 is number

// Named tuples (for readability)
type Coordinate = [x: number, y: number, z: number];
let point: Coordinate = [10, 20, 30];

// Destructuring
let [x, y, z] = point;

// Optional tuple elements
type Response = [number, string, boolean?];
let success: Response = [200, 'OK'];
let error: Response = [500, 'Error', false];
```

---

## Enums

Named constants that make code more readable:

### Numeric Enums

```ts
enum Direction {
  Up,       // 0
  Down,     // 1
  Left,     // 2
  Right,    // 3
}

let dir: Direction = Direction.Up;
console.log(dir);                  // 0
console.log(Direction[0]);         // "Up" (reverse mapping)
```

### String Enums

```ts
enum Status {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING',
}

let userStatus: Status = Status.Active;
console.log(userStatus); // "ACTIVE"
```

### const Enums (Optimized)

```ts
const enum Color {
  Red = '#FF0000',
  Green = '#00FF00',
  Blue = '#0000FF',
}

let bg = Color.Red; // Inlined at compile time — no runtime object
```

---

## Any, Unknown, Never, Void

### `any` — Escape Hatch (Avoid!)

```ts
let value: any = 42;
value = 'hello';        // OK
value = true;           // OK
value.nonExistent();    // No error! — defeats the purpose of TypeScript
```

**Rule:** Never use `any` unless migrating from JavaScript. It disables all type checking.

### `unknown` — Safe Alternative to `any`

```ts
let value: unknown = 42;
value = 'hello';        // OK — can assign anything

// But can't use it without narrowing
value.toUpperCase();    // ERROR: Object is of type 'unknown'

// Must narrow the type first
if (typeof value === 'string') {
  value.toUpperCase();  // OK — TypeScript knows it's string now
}
```

### `void` — No Return Value

```ts
function log(message: string): void {
  console.log(message);
  // no return statement
}
```

### `never` — Function Never Returns

```ts
// Throws an error — never completes
function throwError(message: string): never {
  throw new Error(message);
}

// Infinite loop — never completes
function infiniteLoop(): never {
  while (true) {}
}

// Exhaustive checking
type Shape = 'circle' | 'square';
function area(shape: Shape): number {
  switch (shape) {
    case 'circle': return Math.PI * 10 * 10;
    case 'square': return 10 * 10;
    default:
      const _exhaustive: never = shape; // ERROR if new shape added but not handled
      return _exhaustive;
  }
}
```

---

## Type Assertions

Tell TypeScript "I know better than you":

```ts
// Angle bracket syntax
let value: unknown = 'Hello World';
let length: number = (<string>value).length;

// `as` syntax (preferred, required in JSX)
let length2: number = (value as string).length;

// DOM example
const input = document.getElementById('myInput') as HTMLInputElement;
input.value = 'Hello';

// Non-null assertion (use sparingly)
const el = document.getElementById('app')!; // asserts non-null
```

**Warning:** Assertions don't perform runtime checks. Wrong assertions cause runtime errors.

---

## Literal Types

Restrict a variable to specific values:

```ts
let direction: 'up' | 'down' | 'left' | 'right' = 'up';
direction = 'up';      // OK
direction = 'diagonal'; // ERROR

let statusCode: 200 | 404 | 500 = 200;

let isTrue: true = true;
let isFalse: false = false;
```

---

## Type vs Interface (Preview)

Both define object shapes — we'll dive deep in Chapter 4:

```ts
// Type alias
type Point = {
  x: number;
  y: number;
};

// Interface
interface PointInterface {
  x: number;
  y: number;
}

// Both work the same way here
let p1: Point = { x: 10, y: 20 };
let p2: PointInterface = { x: 10, y: 20 };
```

---

## Summary

| Type | Example | When to Use |
|---|---|---|
| `string` | `'hello'` | Text values |
| `number` | `42`, `3.14` | All numbers |
| `boolean` | `true`, `false` | Flags, conditions |
| `array` | `number[]` | Collections |
| `tuple` | `[string, number]` | Fixed-length mixed arrays |
| `enum` | `Direction.Up` | Named constants |
| `any` | Anything | Never (avoid!) |
| `unknown` | Anything (safe) | External data, APIs |
| `void` | No return | Functions with no return |
| `never` | Impossible | Exhaustive checks, errors |
