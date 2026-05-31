import fs from 'fs'
import path from 'path'
import type { Chapter, ChapterMeta, TocHeading, Season } from '@/types/chapter'

const NEXTJS_CONTENT_ROOT = path.join(process.cwd(), 'nextjs-chapters')

const NEXTJS_CHAPTER_DIR_RE = /^Chapter\s+(\d+)\s+(.+)$/

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseDirName(dirName: string): { number: string; title: string } | null {
  const match = dirName.match(NEXTJS_CHAPTER_DIR_RE)
  if (!match) return null
  return {
    number: match[1],
    title: match[2].trim(),
  }
}

function dirNameToSlug(dirName: string): string {
  const parsed = parseDirName(dirName)
  if (!parsed) return slugify(dirName)
  const num = parsed.number.padStart(2, '0')
  return `ch${num}-${slugify(parsed.title)}`
}

function dirNameToNumber(dirName: string): string {
  const parsed = parseDirName(dirName)
  if (!parsed) return ''
  return `CH ${parsed.number.padStart(2, '0')}`
}

function getAllNextjsChapterDirs(): string[] {
  if (!fs.existsSync(NEXTJS_CONTENT_ROOT)) return []
  const entries = fs.readdirSync(NEXTJS_CONTENT_ROOT, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory() && NEXTJS_CHAPTER_DIR_RE.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => {
      const pa = parseDirName(a)
      const pb = parseDirName(b)
      if (!pa || !pb) return a.localeCompare(b)
      return parseInt(pa.number) - parseInt(pb.number)
    })
}

function computeReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function extractHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = []
  const lines = markdown.split('\n')
  const slugCount = new Map<string, number>()

  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+?)\s*$/)
    if (!match) continue

    const level = match[1].length
    const text = match[2]
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)?/g, '$1')
      .trim()

    const base = slugify(text)
    const count = slugCount.get(base) ?? 0
    slugCount.set(base, count + 1)
    const slug = count === 0 ? base : `${base}-${count}`

    headings.push({ text, slug, level })
  }

  return headings
}

function getReadmeContent(dirName: string): string | null {
  const filePath = path.join(NEXTJS_CONTENT_ROOT, dirName, 'README.md')
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath, 'utf-8')
  const stripped = content.replace(/^#.*$/gm, '').replace(/[-–—]/g, '').trim()
  if (stripped.length < 50) return null
  return content
}

export function getAllNextjsChapters(): ChapterMeta[] {
  const chapterDirs = getAllNextjsChapterDirs()

  return chapterDirs.map((dirName) => {
    const parsed = parseDirName(dirName)!
    let readTime = 1
    const content = getReadmeContent(dirName)
    if (content) {
      readTime = computeReadTime(content)
    }
    return {
      slug: dirNameToSlug(dirName),
      dirName,
      title: parsed.title,
      number: dirNameToNumber(dirName),
      season: 1 as const,
      seasonLabel: 'Next.js',
      readTime,
    }
  })
}

export function getNextjsChapterBySlug(slug: string): Chapter | null {
  const chapterDirs = getAllNextjsChapterDirs()
  const dirName = chapterDirs.find((d) => dirNameToSlug(d) === slug)
  if (!dirName) return null

  const content = getReadmeContent(dirName)
  if (!content) return null

  const parsed = parseDirName(dirName)!

  return {
    slug,
    dirName,
    title: parsed.title,
    number: dirNameToNumber(dirName),
    season: 1,
    seasonLabel: 'Next.js',
    content,
    headings: extractHeadings(content),
    readTime: computeReadTime(content),
  }
}

export function getNextjsSeasons(): Season[] {
  const allChapters = getAllNextjsChapters()

  const basics = allChapters.filter((ch) => {
    const num = parseInt(ch.number.replace(/\D/g, ''))
    return num <= 5
  })
  const intermediate = allChapters.filter((ch) => {
    const num = parseInt(ch.number.replace(/\D/g, ''))
    return num >= 6 && num <= 9
  })
  const advanced = allChapters.filter((ch) => {
    const num = parseInt(ch.number.replace(/\D/g, ''))
    return num >= 10
  })

  const seasons: Season[] = []

  if (basics.length > 0) {
    seasons.push({
      number: 1,
      label: 'Foundations',
      description: 'Next.js fundamentals — App Router, routing, layouts, data fetching, and Server Actions',
      chapters: basics,
    })
  }

  if (intermediate.length > 0) {
    seasons.push({
      number: 2,
      label: 'Core Concepts',
      description: 'Middleware, authentication, rendering strategies, API routes, and styling',
      chapters: intermediate,
    })
  }

  if (advanced.length > 0) {
    seasons.push({
      number: 3,
      label: 'Production',
      description: 'Image optimization, caching, streaming, deployment, and production best practices',
      chapters: advanced,
    })
  }

  return seasons
}
