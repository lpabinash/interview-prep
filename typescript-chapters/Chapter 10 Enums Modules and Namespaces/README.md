# Chapter 10 — Enums, Modules, and Namespaces

## Enums

Enums define a set of named constants.

### Numeric Enums

```ts
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right,   // 3
}

let dir: Direction = Direction.Up;
console.log(dir);               // 0
console.log(Direction[0]);      // 'Up' — reverse mapping

// Custom starting value
enum StatusCode {
  OK = 200,
  NotFound = 404,
  ServerError = 500,
}
```

### String Enums

```ts
enum Color {
  Red = 'RED',
  Green = 'GREEN',
  Blue = 'BLUE',
}

// No reverse mapping for string enums
console.log(Color.Red);  // 'RED'

// Useful for API statuses, database values, config
enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}
```

### `const enum`

Completely inlined at compile time — no runtime object:

```ts
const enum Directions {
  Up = 'UP',
  Down = 'DOWN',
}

const dir = Directions.Up; // Compiled to: const dir = 'UP';
// No Directions object exists at runtime
```

### Enum vs Union Types

```ts
// Enum approach
enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}

// Union type approach (often preferred)
type Status2 = 'active' | 'inactive' | 'pending';

// Union types are simpler, no runtime cost, and work with discriminated unions
// Enums are better when you need runtime iteration or reverse mapping
```

**Interview tip:** Many teams prefer **union types over enums** because:
- No runtime overhead
- Better tree-shaking
- Works naturally with discriminated unions
- No `const enum` pitfalls with isolated modules

---

## Modules (ES Modules)

TypeScript uses **ES modules** — every file with `import` or `export` is a module.

### Named Exports

```ts
// math.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export const PI = 3.14159;

export interface MathResult {
  value: number;
  operation: string;
}
```

### Named Imports

```ts
// app.ts
import { add, multiply, PI, MathResult } from './math';

const result: MathResult = {
  value: add(1, 2),
  operation: 'addition',
};
```

### Default Exports

```ts
// logger.ts
export default class Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

// app.ts
import Logger from './logger'; // Name can be anything
const logger = new Logger();
```

### Re-exports and Barrel Files

```ts
// models/user.ts
export interface User { id: number; name: string; }

// models/post.ts
export interface Post { id: number; title: string; }

// models/index.ts — barrel file
export { User } from './user';
export { Post } from './post';
export type { User as UserType } from './user'; // type-only re-export

// app.ts
import { User, Post } from './models'; // Clean import from barrel
```

### Type-Only Imports

```ts
// Import only types (stripped at compile time)
import type { User } from './models';
import { type User, fetchUser } from './models';

// Ensures you don't accidentally use a type as a value
```

### Dynamic Imports

```ts
async function loadModule() {
  const { add } = await import('./math');
  console.log(add(1, 2));
}

// Conditional import
async function loadChart() {
  if (needsChart) {
    const { Chart } = await import('chart.js');
    new Chart(/* ... */);
  }
}
```

---

## Module Resolution

### `moduleResolution` in tsconfig

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",  // For modern bundlers (Vite, webpack, etc.)
    // "moduleResolution": "node16", // For Node.js with ESM
    // "moduleResolution": "node",   // Legacy CommonJS Node.js
  }
}
```

### Path Aliases

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

```ts
// Instead of: import { Button } from '../../../components/Button';
import { Button } from '@components/Button';
```

---

## Namespaces

Legacy way to organize code — **prefer modules** in modern TypeScript.

```ts
namespace Validation {
  export interface Validator {
    isValid(value: string): boolean;
  }

  export class EmailValidator implements Validator {
    isValid(value: string): boolean {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
  }

  // Not exported — private to namespace
  const maxLength = 255;
}

// Usage
const validator = new Validation.EmailValidator();
validator.isValid('test@example.com');
```

**When to use namespaces:**
- Global script files (not modules)
- Declaration merging with existing libraries
- **Almost never in modern TypeScript** — use modules instead

---

## Declaration Merging

TypeScript allows extending types through merging:

```ts
// Interface merging
interface User {
  id: number;
  name: string;
}

interface User {
  email: string;
}

// Merged result: { id: number; name: string; email: string }
const user: User = { id: 1, name: 'Akshay', email: 'a@b.com' };

// Module augmentation — extend third-party types
declare module 'express' {
  interface Request {
    user?: { id: number; role: string };
  }
}

// Now req.user is available in all Express handlers
```

---

## Ambient Declarations

Describe types for JavaScript libraries without TypeScript definitions:

```ts
// globals.d.ts
declare const API_URL: string;
declare function gtag(...args: any[]): void;

// For a module without types
declare module 'untyped-library' {
  export function doSomething(value: string): number;
  export default class Client {
    connect(): Promise<void>;
  }
}

// Wildcard module declarations
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
```

---

## Summary

| Concept | When to Use |
|---|---|
| Numeric enum | Runtime reverse mapping needed |
| String enum | Runtime string constants needed |
| `const enum` | Performance-critical, inline values |
| Union type | Usually preferred over enum |
| ES modules | Always in modern TypeScript |
| Type-only import | Import types without runtime cost |
| Barrel files | Clean public API for folders |
| Path aliases | Avoid deep relative imports |
| Namespaces | Almost never (legacy code only) |
| Declaration merging | Extend third-party library types |
| Ambient declarations | Type untyped JS libraries |
