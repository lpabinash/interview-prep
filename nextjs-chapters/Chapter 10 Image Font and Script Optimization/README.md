# Chapter 10 — Image, Font, and Script Optimization

## next/image

The `<Image>` component provides automatic image optimization:

- **Lazy loading** — images load when they enter the viewport
- **Responsive sizing** — serves the right size for each device
- **Format conversion** — automatically serves WebP/AVIF
- **Prevents layout shift** — reserves space with width/height

### Basic Usage

```tsx
import Image from 'next/image';

export default function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero banner"
      width={1200}
      height={600}
      priority  // Load immediately (above the fold)
    />
  );
}
```

### Responsive Images

```tsx
// Fill the parent container
<div className="relative w-full h-64">
  <Image
    src="/photo.jpg"
    alt="Photo"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
</div>
```

### Remote Images

```tsx
// next.config.ts — must whitelist external domains
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
    ],
  },
};

// Component
<Image
  src="https://images.unsplash.com/photo-xxx"
  alt="Remote image"
  width={800}
  height={600}
/>
```

### Image Properties

| Prop | Purpose |
|---|---|
| `src` | Image source (local path or URL) |
| `alt` | Alt text (required for accessibility) |
| `width/height` | Dimensions in pixels |
| `fill` | Fill parent container (use with `sizes`) |
| `sizes` | Responsive breakpoints for serving correct size |
| `priority` | Load eagerly (use for LCP image) |
| `quality` | Image quality (1-100, default 75) |
| `placeholder` | `'blur'` for blur-up effect with local images |
| `loading` | `'lazy'` (default) or `'eager'` |

### Placeholder Blur

```tsx
import heroImage from '@/public/hero.jpg'; // Static import

<Image
  src={heroImage}
  alt="Hero"
  placeholder="blur"  // Automatic blur-up from static import
/>
```

For remote images, provide `blurDataURL`:

```tsx
<Image
  src="https://example.com/photo.jpg"
  alt="Remote photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQ..."  // Base64 tiny image
/>
```

---

## next/font

Load fonts with **zero layout shift** and **no external requests**:

### Google Fonts

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### Tailwind Integration

```ts
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      },
    },
  },
};
```

```tsx
<p className="font-sans">Body text in Inter</p>
<code className="font-mono">Code in Roboto Mono</code>
```

### Local Fonts

```tsx
import localFont from 'next/font/local';

const myFont = localFont({
  src: [
    { path: './fonts/MyFont-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/MyFont-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/MyFont-Italic.woff2', weight: '400', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-my-font',
});
```

### How next/font Works

1. Downloads Google Fonts at **build time**
2. Self-hosts them with your deployment
3. No requests to `fonts.googleapis.com` at runtime
4. Uses CSS `size-adjust` to prevent layout shift
5. Files are served from your own domain (privacy + speed)

---

## next/script

Control when and how third-party scripts load:

### Loading Strategies

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* Load after page is interactive */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"
          strategy="afterInteractive"
        />

        {/* Load during browser idle time */}
        <Script
          src="https://cdn.example.com/analytics.js"
          strategy="lazyOnload"
        />

        {/* Load before page hydration (blocking) */}
        <Script
          src="https://cdn.example.com/polyfill.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
```

### Script Strategies

| Strategy | When to Use |
|---|---|
| `beforeInteractive` | Critical scripts that must load before hydration (polyfills) |
| `afterInteractive` | Scripts needed soon after page load (analytics, tag managers) |
| `lazyOnload` | Low-priority scripts (chat widgets, social embeds) |
| `worker` | Experimental — load in a web worker |

### Inline Scripts

```tsx
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXX');
  `}
</Script>
```

### Event Handlers

```tsx
<Script
  src="https://cdn.example.com/widget.js"
  strategy="lazyOnload"
  onLoad={() => {
    console.log('Widget loaded');
  }}
  onError={(e) => {
    console.error('Widget failed to load', e);
  }}
/>
```

---

## Metadata Optimization

### Static Metadata

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'My App',
    template: '%s | My App',  // Child pages: "About | My App"
  },
  description: 'A Next.js application',
  keywords: ['Next.js', 'React', 'TypeScript'],
  authors: [{ name: 'Akshay' }],
  openGraph: {
    title: 'My App',
    description: 'A Next.js application',
    url: 'https://myapp.com',
    siteName: 'My App',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My App',
    description: 'A Next.js application',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### Dynamic Metadata

```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}
```

---

## Performance Best Practices

1. **Use `priority` on LCP images** — the largest contentful paint image
2. **Always provide `sizes`** for responsive images
3. **Use `placeholder="blur"`** for better perceived performance
4. **Self-host fonts** with `next/font` (no external requests)
5. **Use `afterInteractive`** or `lazyOnload`** for analytics
6. **Set proper `width` and `height`** to prevent layout shift
7. **Use WebP/AVIF** (automatic with next/image)

---

## Summary

| Feature | Component | Key Benefit |
|---|---|---|
| Image optimization | `next/image` | Auto format, resize, lazy load |
| Font optimization | `next/font` | Zero layout shift, self-hosted |
| Script optimization | `next/script` | Controlled loading strategies |
| Metadata | `export metadata` | SEO and social sharing |
