# Chapter 06 — Generics

## What Are Generics?

Generics let you write code that works with **any type** while preserving type safety. Think of them as **type parameters** — like function parameters, but for types.

```ts
// Without generics — loses type information
function identity(value: any): any {
  return value;
}
const result = identity('hello'); // type: any — lost!

// With generics — preserves type information
function identity<T>(value: T): T {
  return value;
}
const result = identity('hello');  // type: string — preserved!
const result2 = identity(42);     // type: number
```

---

## Generic Functions

```ts
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

firstElement([1, 2, 3]);       // number | undefined
firstElement(['a', 'b']);      // string | undefined
firstElement<boolean>([true]); // boolean | undefined — explicit type argument

// Multiple type parameters
function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second];
}

pair('hello', 42);   // [string, number]
pair(true, [1, 2]);  // [boolean, number[]]

// Map function
function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

map([1, 2, 3], (n) => n.toString());  // string[]
map(['a', 'b'], (s) => s.length);     // number[]
```

---

## Generic Constraints

Restrict what types `T` can be using `extends`:

```ts
// T must have a length property
function logLength<T extends { length: number }>(value: T): void {
  console.log(value.length);
}

logLength('hello');     // OK — string has length
logLength([1, 2, 3]);   // OK — array has length
logLength(42);          // ERROR: number doesn't have length

// T must be an object with specific properties
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Akshay', age: 25 };
getProperty(user, 'name');   // string
getProperty(user, 'age');    // number
getProperty(user, 'email');  // ERROR: Argument of type '"email"' is not assignable
```

---

## Generic Interfaces and Types

```ts
// Generic interface
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

const userResponse: ApiResponse<User> = {
  data: { id: 1, name: 'Akshay' },
  status: 200,
  message: 'OK',
  timestamp: new Date(),
};

const postsResponse: ApiResponse<Post[]> = {
  data: [{ id: 1, title: 'Hello' }],
  status: 200,
  message: 'OK',
  timestamp: new Date(),
};

// Generic type alias
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fetchUser(id: number): Result<User> {
  if (id <= 0) {
    return { success: false, error: 'Invalid ID' };
  }
  return { success: true, data: { id, name: 'Akshay' } };
}
```

---

## Generic Classes

```ts
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
numberStack.pop();  // number | undefined

const stringStack = new Stack<string>();
stringStack.push('hello');
stringStack.push(42); // ERROR: Argument of type 'number' is not assignable
```

### Generic with Constraints in Classes

```ts
interface Identifiable {
  id: number;
}

class Repository<T extends Identifiable> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  findById(id: number): T | undefined {
    return this.items.find(item => item.id === id);
  }

  getAll(): T[] {
    return [...this.items];
  }
}

interface User extends Identifiable {
  name: string;
}

const userRepo = new Repository<User>();
userRepo.add({ id: 1, name: 'Akshay' });
userRepo.findById(1);  // User | undefined
```

---

## Default Type Parameters

```ts
interface PaginatedResponse<T, M = { page: number; total: number }> {
  data: T[];
  meta: M;
}

// Uses default meta type
const users: PaginatedResponse<User> = {
  data: [{ id: 1, name: 'Akshay' }],
  meta: { page: 1, total: 100 },
};

// Custom meta type
const posts: PaginatedResponse<Post, { cursor: string }> = {
  data: [{ id: 1, title: 'Hello' }],
  meta: { cursor: 'abc123' },
};
```

---

## Generic Utility Patterns

### Type-Safe Event Emitter

```ts
type EventMap = {
  login: { userId: number };
  logout: { reason: string };
  error: { code: number; message: string };
};

class TypedEmitter<T extends Record<string, any>> {
  private handlers = new Map<keyof T, Function[]>();

  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): void {
    const existing = this.handlers.get(event) || [];
    existing.push(handler);
    this.handlers.set(event, existing);
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach(h => h(data));
  }
}

const emitter = new TypedEmitter<EventMap>();

emitter.on('login', (data) => {
  console.log(data.userId);  // TypeScript knows data has userId
});

emitter.emit('login', { userId: 1 });    // OK
emitter.emit('login', { reason: 'x' });  // ERROR: reason doesn't exist on login
```

### Builder Pattern with Generics

```ts
class QueryBuilder<T> {
  private filters: Partial<T> = {};
  private sortField?: keyof T;
  private limitCount = 10;

  where<K extends keyof T>(field: K, value: T[K]): this {
    this.filters[field] = value;
    return this;
  }

  orderBy(field: keyof T): this {
    this.sortField = field;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }
}

interface Product {
  name: string;
  price: number;
  category: string;
}

new QueryBuilder<Product>()
  .where('category', 'electronics')  // type-safe
  .where('price', 100)               // type-safe
  .orderBy('name')                   // type-safe
  .limit(20);
```

---

## Variance and Covariance

```ts
// Covariant — Array<Dog> is assignable to Array<Animal>
interface Animal { name: string }
interface Dog extends Animal { breed: string }

const dogs: Dog[] = [{ name: 'Rex', breed: 'Lab' }];
const animals: readonly Animal[] = dogs; // OK (readonly = covariant)

// Functions are contravariant in parameter types
type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

const handleAnimal: AnimalHandler = (a) => console.log(a.name);
const handleDog: DogHandler = handleAnimal; // OK — more general handler works
```

---

## Summary

| Concept | Example |
|---|---|
| Generic function | `function fn<T>(x: T): T` |
| Multiple params | `function fn<A, B>(a: A, b: B)` |
| Constraint | `<T extends { length: number }>` |
| keyof constraint | `<K extends keyof T>` |
| Generic interface | `interface Box<T> { value: T }` |
| Generic class | `class Stack<T> { }` |
| Default type | `<T = string>` |
