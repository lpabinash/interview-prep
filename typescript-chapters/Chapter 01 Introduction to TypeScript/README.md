# Chapter 01 — Introduction to TypeScript

## What Is TypeScript?

TypeScript is a **superset of JavaScript** that adds static type checking. Every valid JavaScript file is already valid TypeScript. TypeScript compiles down to plain JavaScript.

```
TypeScript (.ts) → tsc compiler → JavaScript (.js)
```

---

## Why TypeScript?

### Problems TypeScript Solves

```js
// JavaScript — no errors until runtime
function add(a, b) {
  return a + b;
}

add(5, '3');     // "53" — string concatenation, not addition
add(5);          // NaN — missing argument
add(5, 3, 7);   // 8 — extra argument silently ignored
```

```ts
// TypeScript — catches errors at compile time
function add(a: number, b: number): number {
  return a + b;
}

add(5, '3');     // ERROR: Argument of type 'string' is not assignable
add(5);          // ERROR: Expected 2 arguments, but got 1
add(5, 3, 7);   // ERROR: Expected 2 arguments, but got 3
```

### Key Benefits

| Benefit | Description |
|---|---|
| **Catch bugs early** | Type errors found at compile time, not runtime |
| **Better IDE support** | Autocompletion, inline docs, refactoring |
| **Self-documenting** | Types serve as documentation |
| **Safer refactoring** | Rename a property → see all breakages instantly |
| **Team productivity** | Clear contracts between modules |

---

## Setting Up TypeScript

### Installation

```bash
# Install globally
npm install -g typescript

# Or per project (recommended)
npm install -D typescript

# Check version
npx tsc --version
```

### Initialize a Project

```bash
npx tsc --init
```

This creates a `tsconfig.json` with default settings.

### Compile and Run

```bash
# Compile a single file
npx tsc hello.ts

# Compile entire project (uses tsconfig.json)
npx tsc

# Watch mode — recompile on save
npx tsc --watch
```

### Running TypeScript Directly

```bash
# Using ts-node (for development)
npm install -D ts-node
npx ts-node hello.ts

# Using tsx (faster, uses esbuild)
npm install -D tsx
npx tsx hello.ts
```

---

## Your First TypeScript File

```ts
// hello.ts
let message: string = 'Hello, TypeScript!';
let count: number = 42;
let isActive: boolean = true;

console.log(message);
console.log(`Count: ${count}, Active: ${isActive}`);
```

---

## Type Inference

TypeScript doesn't always need explicit annotations. It **infers** types from values:

```ts
let name = 'Akshay';      // inferred as string
let age = 25;              // inferred as number
let isStudent = true;      // inferred as boolean

name = 42;                 // ERROR: Type 'number' is not assignable to type 'string'
```

**Rule of thumb:** Let TypeScript infer when the type is obvious from the value. Add explicit annotations for function parameters, return types, and complex objects.

---

## TypeScript vs JavaScript

| Feature | JavaScript | TypeScript |
|---|---|---|
| Type System | Dynamic (runtime) | Static (compile time) |
| File Extension | `.js` | `.ts`, `.tsx` |
| Compilation | Not needed | Required (`tsc`) |
| Type Annotations | No | Yes |
| Interfaces/Enums | No | Yes |
| Browser Support | Direct | Compiles to JS first |
| Learning Curve | Lower | Higher |

---

## Playground

Try TypeScript without installing anything: [TypeScript Playground](https://www.typescriptlang.org/play)

---

## Summary

- TypeScript = JavaScript + Static Types
- Catches bugs at compile time, not runtime
- Type inference reduces the need for explicit annotations
- Compiles to plain JavaScript — runs everywhere JS runs
