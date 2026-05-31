# Chapter 03 — Functions and Type Annotations

## Function Parameter and Return Types

```ts
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function
const multiply = (a: number, b: number): number => a * b;

// Return type is inferred — but explicit is better for public APIs
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

---

## Optional and Default Parameters

```ts
// Optional parameter (must come after required ones)
function createUser(name: string, age?: number): string {
  if (age !== undefined) {
    return `${name}, age ${age}`;
  }
  return name;
}

createUser('Akshay');       // OK
createUser('Akshay', 25);   // OK

// Default parameter
function greet(name: string, greeting: string = 'Hello'): string {
  return `${greeting}, ${name}!`;
}

greet('Akshay');              // "Hello, Akshay!"
greet('Akshay', 'Namaste');   // "Namaste, Akshay!"
```

---

## Rest Parameters

```ts
function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

sum(1, 2, 3);       // 6
sum(1, 2, 3, 4, 5); // 15

// Rest with other params
function log(prefix: string, ...messages: string[]): void {
  messages.forEach(msg => console.log(`[${prefix}] ${msg}`));
}
```

---

## Function Types

Define the shape of a function:

```ts
// Function type alias
type MathOperation = (a: number, b: number) => number;

const add: MathOperation = (a, b) => a + b;
const subtract: MathOperation = (a, b) => a - b;

// As a parameter
function calculate(a: number, b: number, operation: MathOperation): number {
  return operation(a, b);
}

calculate(10, 5, add);       // 15
calculate(10, 5, subtract);  // 5
```

### Callback Types

```ts
function fetchData(url: string, callback: (data: string, error?: Error) => void): void {
  // ... fetch logic
  callback('response data');
}

// Using type alias for clarity
type EventHandler = (event: { type: string; target: HTMLElement }) => void;

function addEventListener(type: string, handler: EventHandler): void {
  // ...
}
```

---

## Function Overloads

When a function behaves differently based on parameter types:

```ts
// Overload signatures
function format(value: string): string;
function format(value: number): string;
function format(value: Date): string;

// Implementation signature
function format(value: string | number | Date): string {
  if (typeof value === 'string') {
    return value.trim();
  } else if (typeof value === 'number') {
    return value.toFixed(2);
  } else {
    return value.toISOString();
  }
}

format('  hello  ');     // "hello"
format(3.14159);         // "3.14"
format(new Date());      // "2026-05-30T..."
```

### Practical Example — createElement

```ts
function createElement(tag: 'input'): HTMLInputElement;
function createElement(tag: 'div'): HTMLDivElement;
function createElement(tag: 'a'): HTMLAnchorElement;
function createElement(tag: string): HTMLElement;

function createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}

const input = createElement('input');  // type: HTMLInputElement
const div = createElement('div');      // type: HTMLDivElement
input.value = 'hello';                 // OK — knows it's HTMLInputElement
```

---

## `this` Parameter

Explicitly type `this` in functions:

```ts
interface Button {
  label: string;
  click(this: Button): void;
}

const button: Button = {
  label: 'Submit',
  click() {
    console.log(`Clicked: ${this.label}`); // `this` is typed as Button
  },
};

button.click();          // OK
const fn = button.click;
fn();                    // ERROR: The 'this' context of type 'void' is not assignable
```

---

## Generic Functions (Preview)

Functions that work with multiple types while preserving type safety:

```ts
function identity<T>(value: T): T {
  return value;
}

identity(42);        // returns number
identity('hello');   // returns string
identity(true);      // returns boolean

// Array first element
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

first([1, 2, 3]);     // number | undefined
first(['a', 'b']);     // string | undefined
```

We'll cover generics in depth in Chapter 6.

---

## Void vs Undefined vs Never

```ts
// void — function doesn't return a meaningful value
function log(msg: string): void {
  console.log(msg);
}

// undefined — function explicitly returns undefined
function findUser(id: number): string | undefined {
  const users = ['Alice', 'Bob'];
  return users[id]; // might be undefined
}

// never — function never completes
function crash(msg: string): never {
  throw new Error(msg);
}
```

---

## Summary

| Concept | Example |
|---|---|
| Parameter types | `(a: number, b: string)` |
| Return type | `(): number` |
| Optional param | `(name?: string)` |
| Default param | `(name = 'World')` |
| Rest params | `(...args: number[])` |
| Function type | `type Fn = (x: number) => string` |
| Overloads | Multiple signatures, one implementation |
| `this` param | `click(this: Button)` |
