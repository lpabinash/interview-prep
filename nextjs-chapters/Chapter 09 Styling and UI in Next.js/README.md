# Chapter 09 — Styling and UI in Next.js

## Styling Options

Next.js supports multiple styling approaches out of the box:

| Approach | CSS Scope | Runtime Cost | Setup |
|---|---|---|---|
| CSS Modules | Component-scoped | None | Built-in |
| Tailwind CSS | Utility classes | None | Built-in |
| Global CSS | Global | None | Built-in |
| CSS-in-JS | Component-scoped | Runtime | Library needed |

---

## CSS Modules

Locally scoped CSS — class names are auto-generated to avoid conflicts:

```css
/* app/components/Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 600;
  cursor: pointer;
}

.primary {
  background-color: #3b82f6;
  color: white;
}

.secondary {
  background-color: #e5e7eb;
  color: #374151;
}
```

```tsx
// app/components/Button.tsx
import styles from './Button.module.css';

export function Button({
  variant = 'primary',
  children,
}: {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

### Composing CSS Modules

```css
/* base.module.css */
.text {
  font-size: 1rem;
  line-height: 1.5;
}

/* heading.module.css */
.heading {
  composes: text from './base.module.css';
  font-weight: bold;
  font-size: 2rem;
}
```

---

## Tailwind CSS

Recommended approach for most Next.js projects. Built-in with `create-next-app`.

```tsx
export default function Card({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-gray-600">{description}</p>
      <button className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        Learn More
      </button>
    </div>
  );
}
```

### Responsive Design

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

### Dark Mode

```tsx
// tailwind.config.ts
const config = {
  darkMode: 'class', // or 'media' for system preference
};

// Component
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  <h1 className="text-gray-900 dark:text-gray-100">Hello</h1>
</div>
```

### cn() Helper for Conditional Classes

```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<button className={cn(
  'px-4 py-2 rounded font-medium',
  variant === 'primary' && 'bg-blue-500 text-white',
  variant === 'outline' && 'border border-gray-300 text-gray-700',
  disabled && 'opacity-50 cursor-not-allowed',
)}>
  {children}
</button>
```

---

## Global CSS

Import in the root layout:

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #3b82f6;
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, sans-serif;
}
```

```tsx
// app/layout.tsx
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

## Component Libraries

### shadcn/ui

The most popular component library for Next.js. It copies components into your project (not a dependency):

```bash
npx shadcn@latest init
npx shadcn@latest add button card input
```

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Click me</Button>
        <Button variant="outline">Secondary</Button>
        <Button variant="destructive">Delete</Button>
      </CardContent>
    </Card>
  );
}
```

---

## Fonts

### next/font — Zero Layout Shift

```tsx
// app/layout.tsx
import { Inter, Fira_Code } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-code',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

```css
/* In CSS/Tailwind */
code {
  font-family: var(--font-code);
}
```

### Local Fonts

```tsx
import localFont from 'next/font/local';

const myFont = localFont({
  src: './fonts/MyFont.woff2',
  display: 'swap',
});
```

---

## Icons

```tsx
// Using lucide-react (popular with shadcn/ui)
import { Search, Menu, X, ChevronRight } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center gap-4">
      <button><Menu className="h-6 w-6" /></button>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input className="pl-10 pr-4 py-2 border rounded" placeholder="Search..." />
      </div>
    </header>
  );
}
```

---

## Animations

### CSS Transitions

```tsx
<button className="transform transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95">
  Click me
</button>
```

### Framer Motion

```tsx
'use client';

import { motion } from 'framer-motion';

export default function AnimatedCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 rounded-lg border"
    >
      <h2>Animated Card</h2>
    </motion.div>
  );
}
```

---

## Summary

| Approach | Best For |
|---|---|
| CSS Modules | Component-scoped styles without utility classes |
| Tailwind CSS | Rapid development, consistency |
| Global CSS | Base styles, CSS variables |
| shadcn/ui | Production-ready accessible components |
| next/font | Optimized font loading |
| Framer Motion | Complex animations |
