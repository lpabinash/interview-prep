# Chapter 11 — TypeScript with DOM

## Typing DOM Elements

TypeScript provides built-in types for all DOM elements:

```ts
// querySelector returns Element | null
const div = document.querySelector('div');          // HTMLDivElement | null
const button = document.querySelector('button');    // HTMLButtonElement | null
const input = document.querySelector('input');      // HTMLInputElement | null
const canvas = document.querySelector('canvas');    // HTMLCanvasElement | null

// Specific selectors — TypeScript can't infer the element type
const el = document.querySelector('.my-class');     // Element | null
const el2 = document.querySelector('#my-id');       // Element | null

// Use type assertion when TypeScript can't infer
const form = document.querySelector('#login-form') as HTMLFormElement;
const nameInput = document.querySelector('#name') as HTMLInputElement;
```

### Non-Null Assertion

```ts
// When you KNOW the element exists
const app = document.getElementById('app')!;  // HTMLElement (not null)

// Safer approach — check first
const app2 = document.getElementById('app');
if (app2) {
  app2.textContent = 'Hello';
}
```

---

## Event Handling

```ts
// Event type is inferred from addEventListener
const button = document.querySelector('button')!;

button.addEventListener('click', (event) => {
  // event is MouseEvent — automatically inferred!
  console.log(event.clientX, event.clientY);
  console.log(event.target);                // EventTarget | null
  console.log(event.currentTarget);         // HTMLButtonElement
});

// Input events
const input = document.querySelector('input')!;

input.addEventListener('input', (event) => {
  // event is Event, need to narrow target
  const target = event.target as HTMLInputElement;
  console.log(target.value);
});

// Keyboard events
document.addEventListener('keydown', (event: KeyboardEvent) => {
  console.log(event.key);     // 'Enter', 'Escape', etc.
  console.log(event.code);    // 'KeyA', 'Space', etc.
  console.log(event.ctrlKey); // boolean
});

// Form submission
const form = document.querySelector('form')!;

form.addEventListener('submit', (event: SubmitEvent) => {
  event.preventDefault();
  const formData = new FormData(form);
  const name = formData.get('name') as string;
});
```

### Custom Event Handler Types

```ts
// Explicit event handler type
type ClickHandler = (event: MouseEvent) => void;

const handleClick: ClickHandler = (event) => {
  console.log(event.clientX);
};

// React-style event handler type reference
type InputHandler = (event: Event & { target: HTMLInputElement }) => void;
```

---

## DOM Manipulation

### Creating Elements

```ts
const div = document.createElement('div');      // HTMLDivElement
const img = document.createElement('img');      // HTMLImageElement
const a = document.createElement('a');          // HTMLAnchorElement

// Set attributes with full type safety
img.src = '/photo.jpg';
img.alt = 'A photo';
img.width = 200;

a.href = 'https://example.com';
a.target = '_blank';
a.textContent = 'Click me';

// Style is fully typed
div.style.backgroundColor = 'red';
div.style.display = 'flex';
div.style.gap = '1rem';
```

### ClassList

```ts
const el = document.querySelector('.card')!;

el.classList.add('active', 'visible');
el.classList.remove('hidden');
el.classList.toggle('expanded');
el.classList.contains('active');    // boolean
el.classList.replace('old', 'new'); // boolean
```

### Dataset

```ts
const el = document.querySelector('[data-user-id]')!;

// dataset values are always string | undefined
const userId: string | undefined = (el as HTMLElement).dataset.userId;
const role: string | undefined = (el as HTMLElement).dataset.role;
```

---

## Fetch API

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

// Type the response
async function getUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data: User = await response.json();
  return data;
}

// With proper error handling
async function fetchUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as User[];
  } catch (error) {
    if (error instanceof TypeError) {
      console.error('Network error:', error.message);
    }
    throw error;
  }
}

// POST with typed body
async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  return response.json() as Promise<User>;
}
```

---

## Local Storage

```ts
// localStorage values are always string | null
const raw = localStorage.getItem('user');  // string | null

// Type-safe wrapper
function getItem<T>(key: string): T | null {
  const value = localStorage.getItem(key);
  if (value === null) return null;
  return JSON.parse(value) as T;
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Usage
interface Settings {
  theme: 'light' | 'dark';
  fontSize: number;
}

setItem<Settings>('settings', { theme: 'dark', fontSize: 16 });
const settings = getItem<Settings>('settings');
// settings is Settings | null
```

---

## Intersection Observer

```ts
const observer = new IntersectionObserver(
  (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement;
        target.src = target.dataset.src!;
        observer.unobserve(target);
      }
    });
  },
  {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
  }
);

document.querySelectorAll('img[data-src]').forEach((img) => {
  observer.observe(img);
});
```

---

## Web APIs

### AbortController

```ts
const controller = new AbortController();

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}
```

### MutationObserver

```ts
const observer = new MutationObserver((mutations: MutationRecord[]) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          console.log('Added:', node.tagName);
        }
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
```

---

## Working with Canvas

```ts
const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d');

if (ctx) {
  // ctx is CanvasRenderingContext2D
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(10, 10, 100, 100);

  ctx.font = '24px sans-serif';
  ctx.fillText('Hello', 50, 50);

  ctx.beginPath();
  ctx.arc(200, 200, 50, 0, Math.PI * 2);
  ctx.stroke();
}

// WebGL
const gl = canvas.getContext('webgl');
if (gl) {
  // gl is WebGLRenderingContext
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}
```

---

## Summary

| Topic | Key Type |
|---|---|
| querySelector | Returns `Element \| null` |
| getElementById | Returns `HTMLElement \| null` |
| Event listener | Event type inferred from event name |
| Event target | Needs assertion to specific element |
| createElement | Returns specific HTML element type |
| fetch response | Use `as T` or type guard on `.json()` |
| localStorage | Always `string \| null` |
| dataset | Always `string \| undefined` |
| Canvas 2D | `CanvasRenderingContext2D \| null` |
