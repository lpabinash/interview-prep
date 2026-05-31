import fs from 'fs'
import path from 'path'
import type { Chapter, ChapterMeta, TocHeading, Season } from '@/types/chapter'

const REACT_CONTENT_ROOT = path.join(process.cwd(), '..', 'react-chapters')

// Regex to parse React chapter directory names
// Matches: "Chapter 01 Title" (no dash, variable whitespace)
const REACT_CHAPTER_DIR_RE = /^Chapter\s+(\d+)\s+(.+)$/

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
  const match = dirName.match(REACT_CHAPTER_DIR_RE)
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

function getAllReactChapterDirs(): string[] {
  if (!fs.existsSync(REACT_CONTENT_ROOT)) return []
  const entries = fs.readdirSync(REACT_CONTENT_ROOT, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory() && REACT_CHAPTER_DIR_RE.test(e.name))
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

function isPlaceholder(content: string): boolean {
  const stripped = content.replace(/^#.*$/gm, '').replace(/[-–—]/g, '').trim()
  return stripped.length < 50
}

function getReadmeContent(dirName: string): string | null {
  const candidates = [
    path.join(REACT_CONTENT_ROOT, dirName, 'Theory', 'README.md'),
    path.join(REACT_CONTENT_ROOT, dirName, 'Theory', 'Assignment.md'),
    path.join(REACT_CONTENT_ROOT, dirName, 'README.md'),
  ]

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue
    const content = fs.readFileSync(filePath, 'utf-8')
    if (!isPlaceholder(content)) return content
  }

  return null
}

export function getAllReactChapters(): ChapterMeta[] {
  const chapterDirs = getAllReactChapterDirs()

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
      seasonLabel: 'React',
      readTime,
    }
  })
}

export function getReactChapterBySlug(slug: string): Chapter | null {
  const chapterDirs = getAllReactChapterDirs()
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
    seasonLabel: 'React',
    content,
    headings: extractHeadings(content),
    readTime: computeReadTime(content),
  }
}

export function getReactSearchIndex() {
  return getAllReactChapters().map((ch) => ({
    slug: ch.slug,
    title: ch.title,
    number: ch.number,
    seasonLabel: ch.seasonLabel,
  }))
}

export function getReactSeasons(): Season[] {
  const allChapters = getAllReactChapters()

  const fundamentals = allChapters.filter((ch) => {
    const num = parseInt(ch.number.replace(/\D/g, ''))
    return num <= 13
  })
  const advanced = allChapters.filter((ch) => {
    const num = parseInt(ch.number.replace(/\D/g, ''))
    return num >= 14
  })

  const seasons: Season[] = [
    {
      number: 1,
      label: 'Fundamentals',
      description:
        'React from scratch — Components, JSX, Hooks, Routing, State Management, Redux & Testing',
      chapters: fundamentals,
    },
  ]

  if (advanced.length > 0) {
    seasons.push({
      number: 2,
      label: 'Advanced React',
      description:
        'Deep dive into hooks, custom hooks, performance optimization, Suspense, Server Components, React 19 & machine coding practice',
      chapters: advanced,
    })
  }

  return seasons
}
