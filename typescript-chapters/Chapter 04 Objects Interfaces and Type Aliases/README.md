# Chapter 04 — Objects, Interfaces, and Type Aliases

## Object Types

```ts
// Inline object type
function printUser(user: { name: string; age: number }): void {
  console.log(`${user.name}, ${user.age}`);
}

printUser({ name: 'Akshay', age: 25 });
printUser({ name: 'Akshay' });          // ERROR: Property 'age' is missing
```

### Optional Properties

```ts
type User = {
  name: string;
  age: number;
  email?: string;     // optional
};

const user1: User = { name: 'Akshay', age: 25 };                    // OK
const user2: User = { name: 'Akshay', age: 25, email: 'a@b.com' };  // OK
```

### Readonly Properties

```ts
type Config = {
  readonly apiUrl: string;
  readonly port: number;
};

const config: Config = { apiUrl: 'https://api.example.com', port: 3000 };
config.port = 4000;  // ERROR: Cannot assign to 'port' because it is a read-only property
```

---

## Interfaces

Interfaces define the **shape** of objects. They're the primary way to define object types in TypeScript.

```ts
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  readonly createdAt: Date;
}

const user: User = {
  id: 1,
  name: 'Akshay',
  email: 'akshay@example.com',
  createdAt: new Date(),
};
```

### Extending Interfaces

```ts
interface Animal {
  name: string;
  sound(): string;
}

interface Dog extends Animal {
  breed: string;
  fetch(): void;
}

const dog: Dog = {
  name: 'Rex',
  breed: 'Labrador',
  sound() { return 'Woof!'; },
  fetch() { console.log('Fetching...'); },
};
```

### Multiple Inheritance

```ts
interface Printable {
  print(): void;
}

interface Loggable {
  log(): void;
}

interface Document extends Printable, Loggable {
  title: string;
  content: string;
}
```

### Declaration Merging

Interfaces with the same name **merge** automatically:

```ts
interface Window {
  myCustomProperty: string;
}

// Now Window has myCustomProperty + all original properties
window.myCustomProperty = 'hello';
```

This is useful for extending third-party types.

---

## Type Aliases

Type aliases create a **name** for any type — not just objects.

```ts
// Object type
type Point = {
  x: number;
  y: number;
};

// Union type
type ID = string | number;

// Literal type
type Direction = 'up' | 'down' | 'left' | 'right';

// Function type
type Callback = (data: string) => void;

// Tuple type
type Pair<T> = [T, T];
```

### Intersection Types

Combine multiple types:

```ts
type HasName = { name: string };
type HasAge = { age: number };
type HasEmail = { email: string };

type Person = HasName & HasAge & HasEmail;

const person: Person = {
  name: 'Akshay',
  age: 25,
  email: 'akshay@example.com',
};
```

---

## Interface vs Type Alias

| Feature | Interface | Type Alias |
|---|---|---|
| Object shape | Yes | Yes |
| Extends/inheritance | `extends` | `&` (intersection) |
| Union types | No | Yes (`string \| number`) |
| Declaration merging | Yes | No |
| Computed properties | No | Yes |
| Primitives/tuples | No | Yes |

### When to Use Which?

- **Interface** — for defining object shapes, especially in public APIs and libraries (declaration merging is useful).
- **Type** — for unions, intersections, mapped types, conditional types, and anything that isn't a plain object shape.

```ts
// Use interface for objects
interface UserService {
  getUser(id: number): Promise<User>;
  createUser(data: CreateUserDto): Promise<User>;
}

// Use type for unions and complex types
type Result<T> = { success: true; data: T } | { success: false; error: string };
type EventName = 'click' | 'hover' | 'focus';
```

---

## Index Signatures

When you don't know property names in advance:

```ts
interface Dictionary {
  [key: string]: string;
}

const colors: Dictionary = {
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
};

// With known + unknown properties
interface Env {
  NODE_ENV: string;
  PORT: string;
  [key: string]: string;  // allow any additional string properties
}
```

### Record Type (Better Alternative)

```ts
type Dictionary = Record<string, string>;

type StatusMap = Record<'active' | 'inactive' | 'pending', number>;
const counts: StatusMap = {
  active: 10,
  inactive: 5,
  pending: 3,
};
```

---

## Nested Objects

```ts
interface Address {
  street: string;
  city: string;
  zip: string;
  country: string;
}

interface Company {
  name: string;
  address: Address;
}

interface Employee {
  id: number;
  name: string;
  company: Company;
  skills: string[];
}

const emp: Employee = {
  id: 1,
  name: 'Akshay',
  company: {
    name: 'TechCorp',
    address: {
      street: '123 Main St',
      city: 'Bangalore',
      zip: '560001',
      country: 'India',
    },
  },
  skills: ['TypeScript', 'React', 'Node.js'],
};
```

---

## Callable and Constructable Interfaces

```ts
// Callable interface
interface Formatter {
  (value: string): string;
}

const uppercase: Formatter = (value) => value.toUpperCase();

// Constructable interface
interface Constructor {
  new (name: string): { name: string };
}
```

---

## Excess Property Checking

TypeScript checks for extra properties when assigning object literals directly:

```ts
interface User {
  name: string;
  age: number;
}

// ERROR: Object literal may only specify known properties
const user: User = { name: 'Akshay', age: 25, email: 'test' };

// But this works — through a variable (structural typing)
const data = { name: 'Akshay', age: 25, email: 'test' };
const user2: User = data; // OK — has name and age, extra properties ignored
```

---

## Summary

| Concept | Use Case |
|---|---|
| Interface | Object shapes, class contracts, declaration merging |
| Type alias | Unions, intersections, primitives, tuples, functions |
| `extends` | Interface inheritance |
| `&` | Type intersection (combine types) |
| `readonly` | Prevent property mutation |
| `?` | Optional properties |
| Index signature | Objects with dynamic keys |
| `Record<K, V>` | Typed key-value maps |
