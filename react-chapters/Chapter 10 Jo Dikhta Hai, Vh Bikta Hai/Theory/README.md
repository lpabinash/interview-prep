# Chapter 10 — Styling in React

## Ways of Writing CSS in React

### 1. Inline Styles

Pass a JavaScript object to the `style` prop. Property names use **camelCase**.

```jsx
function Badge({ color }) {
  return (
    <span style={{
      backgroundColor: color,
      padding: '4px 12px',
      borderRadius: '9999px',
      color: '#fff',
      fontSize: '0.875rem',
    }}>
      Active
    </span>
  );
}
```

**Pros:** Scoped by default, dynamic values easy.
**Cons:** No pseudo-classes (:hover), no media queries, no keyframe animations, poor performance at scale.

---

### 2. Plain CSS (External Stylesheets)

Import a `.css` file. Class names are **global** by default.

```css
/* Button.css */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-primary {
  background: #1976d2;
  color: #fff;
}
```

```jsx
import './Button.css';

function Button({ children }) {
  return <button className="btn btn-primary">{children}</button>;
}
```

**Cons:** Global scope — class name collisions across components.

---

### 3. CSS Modules

CSS Modules **scope class names locally** by appending a unique hash. File must end with `.module.css`.

```css
/* Card.module.css */
.card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
}
.title {
  font-size: 1.25rem;
  font-weight: 600;
}
```

```jsx
import styles from './Card.module.css';

function Card({ title, children }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      {children}
    </div>
  );
}
```

At build time, `.card` becomes something like `.Card_card_x7k2a` — no collisions.

**Composing styles:**
```css
.base {
  padding: 8px 16px;
}
.primary {
  composes: base;
  background: #1976d2;
  color: #fff;
}
```

---

### 4. Styled Components (CSS-in-JS)

Write actual CSS inside JavaScript using tagged template literals.

```bash
npm install styled-components
```

```jsx
import styled from 'styled-components';

const Card = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: ${(props) => props.$dark ? '#1a1a1a' : '#fff'};
  color: ${(props) => props.$dark ? '#fff' : '#333'};
`;

const Title = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 8px;
`;

function ProductCard({ name, dark }) {
  return (
    <Card $dark={dark}>
      <Title>{name}</Title>
    </Card>
  );
}
```

**Pros:** Scoped, dynamic, supports pseudo-classes and media queries, theming.
**Cons:** Runtime cost, bundle size, learning curve.

**Theming:**
```jsx
import { ThemeProvider } from 'styled-components';

const theme = {
  colors: { primary: '#1976d2', text: '#333' },
  spacing: { sm: '8px', md: '16px' },
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <MyComponent />
    </ThemeProvider>
  );
}

const Button = styled.button`
  background: ${(props) => props.theme.colors.primary};
  padding: ${(props) => props.theme.spacing.md};
`;
```

---

### 5. Tailwind CSS

A **utility-first** CSS framework. You compose styles by applying pre-existing utility classes.

```bash
npm install -D tailwindcss @tailwindcss/postcss postcss
```

**tailwind.config.js:**
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'], // which files to scan for classes
  theme: {
    extend: {
      colors: {
        brand: '#1976d2', // custom colors
      },
    },
  },
  plugins: [],
};
```

| Key | Purpose |
|---|---|
| `content` | Files Tailwind scans for class usage (tree-shaking) |
| `theme` | Default design tokens (colors, spacing, fonts) |
| `extend` | Add to defaults without overriding |
| `plugins` | Add third-party plugins (forms, typography) |

**Usage:**
```jsx
function Card({ title, children }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="text-gray-600">{children}</div>
    </div>
  );
}
```

**Responsive design:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

**Dark mode:**
```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <h1 className="text-2xl font-bold">Hello</h1>
</div>
```

**Pros:** No context-switching, tiny production CSS (tree-shaken), consistent design tokens.
**Cons:** Verbose className strings, learning curve for utility names.

---

### 6. SASS/SCSS

CSS preprocessor with variables, nesting, mixins, and partials.

```bash
npm install -D sass
```

```scss
// variables.scss
$primary: #1976d2;
$radius: 8px;

// Card.scss
@import './variables';

.card {
  border-radius: $radius;
  padding: 16px;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__title {
    font-size: 1.25rem;
    color: $primary;
  }
}
```

---

## PostCSS and `.postcssrc`

PostCSS is a tool that transforms CSS with JavaScript plugins. The `.postcssrc` file configures which PostCSS plugins to apply:

```json
{
  "plugins": {
    "tailwindcss": {},
    "autoprefixer": {}
  }
}
```

- **autoprefixer**: Adds vendor prefixes (`-webkit-`, `-moz-`) automatically.
- **tailwindcss**: Processes Tailwind utility classes.
- **cssnano**: Minifies CSS for production.

---

## Comparison Table

| Approach | Scoped? | Dynamic? | Pseudo/Media? | Bundle Impact |
|---|---|---|---|---|
| Inline Styles | Yes | Yes | No | None |
| Plain CSS | No | No | Yes | Small |
| CSS Modules | Yes | No | Yes | Small |
| Styled Components | Yes | Yes | Yes | Runtime JS |
| Tailwind CSS | Yes* | Via classes | Yes | Small (tree-shaken) |
| SASS/SCSS | No | Via variables | Yes | Small |

*Tailwind: scoped by utility; no class collision risk.

---

## Interview Questions

**Q: Which CSS approach would you choose for a large-scale React app?**
A: CSS Modules or Tailwind CSS. CSS Modules give scoped styles with zero runtime cost. Tailwind provides a design system with utility-first approach and tiny production bundles. Styled-components work well but add runtime overhead.

**Q: What are CSS Modules and how do they prevent conflicts?**
A: CSS Modules are CSS files where class names are locally scoped. The build tool (Webpack/Vite) generates unique class names by appending a hash, making collisions impossible.

**Q: How does Tailwind CSS tree-shake unused styles?**
A: Tailwind scans files listed in `content` config for class names used in JSX. Any utility class not found in those files is removed from the final CSS bundle.
            