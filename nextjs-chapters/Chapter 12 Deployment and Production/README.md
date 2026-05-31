# Chapter 12 — Deployment and Production

## Building for Production

```bash
npm run build
```

Build output shows rendering strategy per route:

```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB        89 kB
├ ○ /about                               1.1 kB        85 kB
├ ● /blog/[slug]                         2.3 kB        86 kB
├ λ /dashboard                           4.1 kB        88 kB
├ ○ /api/health                          0 B            0 B
└ λ /api/users                           0 B            0 B

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
λ  (Dynamic)  server-rendered on demand
```

### Running Production Locally

```bash
npm run build && npm start
```

---

## Deployment Platforms

### Vercel (Recommended)

Zero-config deployment — built by the Next.js team:

```bash
npm i -g vercel
vercel
```

Or connect your Git repository on [vercel.com](https://vercel.com):
1. Import project from GitHub/GitLab/Bitbucket
2. Vercel auto-detects Next.js
3. Every push to `main` triggers a production deploy
4. Every PR gets a preview deployment

### Self-Hosted (Node.js)

```bash
npm run build
npm start
# Runs on port 3000 by default
```

Use PM2 for process management:

```bash
npm install -g pm2
pm2 start npm --name "next-app" -- start
pm2 startup  # Auto-start on server reboot
pm2 save
```

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

Enable standalone output in config:

```ts
// next.config.ts
const nextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

```bash
docker build -t my-next-app .
docker run -p 3000:3000 my-next-app
```

### Static Export

For fully static sites (no server features):

```ts
// next.config.ts
const nextConfig = {
  output: 'export',
};
```

```bash
npm run build
# Output in /out — deploy to any static host (GitHub Pages, S3, Netlify)
```

**Limitations of static export:**
- No Server Components with dynamic data
- No Route Handlers
- No Middleware
- No ISR
- No Image Optimization (without external loader)

---

## Environment Variables

### Server-Side Only (Default)

```env
# .env.local
DATABASE_URL=postgresql://localhost:5432/mydb
JWT_SECRET=super-secret-key
API_KEY=sk-1234567890
```

```tsx
// Only accessible in Server Components, Route Handlers, Server Actions
const url = process.env.DATABASE_URL;
```

### Client-Side (Public)

Prefix with `NEXT_PUBLIC_`:

```env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GA_ID=G-XXXXX
```

```tsx
// Accessible anywhere (inlined at build time)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### Environment File Priority

```
.env                  # All environments
.env.local            # Local overrides (gitignored)
.env.development      # Development only
.env.production       # Production only
.env.test             # Test only
```

**Security rule:** NEVER put secrets in `NEXT_PUBLIC_` variables. They are **embedded in the client bundle**.

---

## Performance Optimization

### Bundle Analysis

```bash
npm install @next/bundle-analyzer

# next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer';

const config = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})({});

export default config;

# Run
ANALYZE=true npm run build
```

### Dynamic Imports (Code Splitting)

```tsx
import dynamic from 'next/dynamic';

// Only load when rendered
const HeavyChart = dynamic(() => import('@/components/Chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // Don't render on server
});

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart />
    </div>
  );
}
```

### Route-Level Code Splitting

Automatic — each route gets its own JS bundle.

### Tree Shaking

```tsx
// GOOD — only imports what's needed
import { Button } from '@/components/ui/button';

// BAD — imports entire library
import * as UI from '@/components/ui';
```

---

## Error Monitoring

### Error Boundary

```tsx
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Report to error monitoring service
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

### Instrumentation

```tsx
// instrumentation.ts (at project root)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize server-side monitoring (Sentry, DataDog, etc.)
  }
}
```

---

## Security Checklist

### Headers

```ts
// next.config.ts
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        },
      ],
    },
  ],
};
```

### Security Best Practices

1. **Never expose secrets** — use server-only environment variables
2. **Validate all input** — use Zod in Server Actions and Route Handlers
3. **Use CSRF protection** — Server Actions have built-in CSRF tokens
4. **Rate limit API routes** — use middleware or a library like `rate-limiter-flexible`
5. **Sanitize rendered content** — avoid `dangerouslySetInnerHTML`
6. **Set security headers** — CSP, HSTS, X-Frame-Options
7. **Keep dependencies updated** — `npm audit` regularly

---

## SEO

### Sitemap

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ['', '/about', '/blog', '/contact'].map(route => ({
    url: `https://myapp.com${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return staticPages;
}
```

### Robots.txt

```tsx
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/'],
    },
    sitemap: 'https://myapp.com/sitemap.xml',
  };
}
```

---

## Production Checklist

- [ ] `npm run build` succeeds with no errors
- [ ] All pages render correctly
- [ ] Environment variables set in production
- [ ] Error monitoring configured
- [ ] Security headers set
- [ ] Image optimization working
- [ ] Fonts loading without layout shift
- [ ] SEO metadata on all pages
- [ ] Sitemap and robots.txt configured
- [ ] Analytics tracking working
- [ ] Performance: Lighthouse score > 90
- [ ] Accessibility: No critical issues
- [ ] Mobile responsive
- [ ] 404 and error pages customized

---

## Summary

| Topic | Key Point |
|---|---|
| Build | `npm run build` shows static/dynamic routes |
| Vercel | Zero-config, auto-deploys from Git |
| Docker | Use `output: 'standalone'` + multi-stage build |
| Static export | `output: 'export'` — no server features |
| Env vars | `NEXT_PUBLIC_` for client, plain for server |
| Code splitting | Automatic per route + `dynamic()` for components |
| Security | Headers, input validation, CSRF (built-in) |
| SEO | `sitemap.ts`, `robots.ts`, metadata API |
