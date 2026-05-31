# Chapter 09 — Advanced Types

## Conditional Types

Types that act like **if/else** for types using `extends`:

```ts
type IsString<T> = T extends string ? 'yes' : 'no';

type A = IsString<string>;  // 'yes'
type B = IsString<number>;  // 'no'

// Practical — extract array element type
type ElementType<T> = T extends (infer E)[] ? E : T;

type X = ElementType<string[]>;  // string
type Y = ElementType<number>;    // number
```

### `infer` Keyword

Extract types from within other types:

```ts
// Extract return type (how ReturnType works internally)
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type A = MyReturnType<() => string>;         // string
type B = MyReturnType<(x: number) => void>;  // void

// Extract Promise value type
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type C = UnwrapPromise<Promise<string>>;  // string
type D = UnwrapPromise<number>;           // number

// Extract function first parameter
type FirstParam<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;

type E = FirstParam<(name: string, age: number) => void>;  // string
```

### Distributive Conditional Types

When `T` is a union, conditional types distribute over each member:

```ts
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>;
// string[] | number[]  (NOT (string | number)[])

// Prevent distribution with wrapping
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type Result2 = ToArrayNonDist<string | number>;
// (string | number)[]
```

---

## Mapped Types

Create new types by transforming each property of an existing type:

```ts
// Make all properties optional (how Partial works internally)
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// Make all properties readonly
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Make all properties nullable
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

interface User {
  name: string;
  age: number;
}

type NullableUser = Nullable<User>;
// { name: string | null; age: number | null }
```

### Key Remapping with `as`

```ts
// Add a "get" prefix to all property names
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }

// Filter out specific properties
type RemoveKind<T> = {
  [K in keyof T as Exclude<K, 'kind'>]: T[K];
};
```

### Modifiers: `+` and `-`

```ts
// Remove readonly
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

// Remove optional
type Concrete<T> = {
  [K in keyof T]-?: T[K];
};
```

---

## Template Literal Types

Build string types programmatically:

```ts
// CSS class generation
type Size = 'sm' | 'md' | 'lg';
type Color = 'red' | 'blue' | 'green';
type ClassName = `${Size}-${Color}`;
// 'sm-red' | 'sm-blue' | 'sm-green' | 'md-red' | 'md-blue' | ...

// Event handler names
type EventName = 'click' | 'focus' | 'blur';
type Handler = `on${Capitalize<EventName>}`;
// 'onClick' | 'onFocus' | 'onBlur'

// String manipulation types
type Uppercase2 = Uppercase<'hello'>;      // 'HELLO'
type Lowercase2 = Lowercase<'HELLO'>;      // 'hello'
type Capitalize2 = Capitalize<'hello'>;    // 'Hello'
type Uncapitalize2 = Uncapitalize<'Hello'>; // 'hello'
```

### Parsing String Types

```ts
// Extract route params from a path string
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : T extends `${string}:${infer Param}`
    ? Param
    : never;

type Params = ExtractParams<'/users/:id/posts/:postId'>;
// 'id' | 'postId'
```

---

## Index Types and Indexed Access

### `keyof` — Get Keys

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

type UserKeys = keyof User; // 'id' | 'name' | 'email'
```

### Indexed Access Types — Get Value Types

```ts
type UserId = User['id'];           // number
type UserName = User['name'];       // string
type AllValues = User[keyof User];  // number | string

// Array element access
const roles = ['admin', 'editor', 'viewer'] as const;
type Role = (typeof roles)[number]; // 'admin' | 'editor' | 'viewer'
```

---

## Recursive Types

Types that reference themselves:

```ts
// JSON type
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// Tree node
type TreeNode<T> = {
  value: T;
  children: TreeNode<T>[];
};

// Deep readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// Deep partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
```

---

## Type-Level Programming Patterns

### Builder with Accumulator

```ts
type FormBuilder<T extends Record<string, any> = {}> = {
  addField<K extends string, V>(
    name: K,
    defaultValue: V
  ): FormBuilder<T & Record<K, V>>;
  build(): T;
};

// Usage creates a progressively narrower type
declare const form: FormBuilder;
const result = form
  .addField('name', '')        // FormBuilder<{ name: string }>
  .addField('age', 0)          // FormBuilder<{ name: string; age: number }>
  .addField('active', true)    // FormBuilder<{ name: string; age: number; active: boolean }>
  .build();                     // { name: string; age: number; active: boolean }
```

### Branded Types

Prevent mixing values that share the same underlying type:

```ts
type Brand<T, B extends string> = T & { __brand: B };

type USD = Brand<number, 'USD'>;
type EUR = Brand<number, 'EUR'>;
type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;

function createUSD(amount: number): USD {
  return amount as USD;
}

function createEUR(amount: number): EUR {
  return amount as EUR;
}

function addUSD(a: USD, b: USD): USD {
  return (a + b) as USD;
}

const dollars = createUSD(100);
const euros = createEUR(50);

addUSD(dollars, dollars);  // OK
addUSD(dollars, euros);    // ERROR: EUR is not assignable to USD

function getUser(id: UserId): User { /* ... */ }
function getPost(id: PostId): Post { /* ... */ }

const userId = 'user-1' as UserId;
getUser(userId);     // OK
getPost(userId);     // ERROR: UserId not assignable to PostId
```

---

## `unknown` vs `any` vs `never`

```ts
// any — disables type checking (avoid)
let a: any = 42;
a.nonExistentMethod(); // No error — dangerous!

// unknown — type-safe alternative to any
let b: unknown = 42;
b.toFixed();            // ERROR: Object is of type 'unknown'
if (typeof b === 'number') {
  b.toFixed();          // OK after narrowing
}

// never — represents impossible values
function throwError(msg: string): never {
  throw new Error(msg);
}

// never is the empty set — nothing is assignable to it
type Check = string & number; // never — no value can be both
```

---

## Summary

| Concept | Syntax | Purpose |
|---|---|---|
| Conditional type | `T extends U ? X : Y` | Type-level if/else |
| `infer` | `T extends (...) => infer R ? R : never` | Extract inner types |
| Mapped type | `{ [K in keyof T]: ... }` | Transform all properties |
| Key remapping | `[K in keyof T as ...]` | Rename/filter keys |
| Template literal | `` `${A}-${B}` `` | Build string types |
| Indexed access | `T['key']` | Get property type |
| Recursive type | Type referencing itself | Trees, deep utilities |
| Branded type | `T & { __brand: B }` | Nominal type safety |
