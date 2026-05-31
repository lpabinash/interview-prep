import fs from 'fs'
import path from 'path'
import type { Chapter, ChapterMeta, TocHeading, Season } from '@/types/chapter'

const NODE_CONTENT_ROOT = path.join(process.cwd(), '..', 'nodejs-chapters')

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

function getSortKey(dirName: string): { season: number; num: number } {
  const match = dirName.match(/^Chapter\s+(S(\d)\s+)?(\d+)/)
  if (!match) return { season: 1, num: 0 }
  const season = match[2] ? parseInt(match[2]) : 1
  const num = parseInt(match[3])
  return { season, num }
}

function parseDirName(dirName: string): {
  season: 1 | 2 | 3
  number: string
  title: string
} {
  // Pattern with dash separator: "Chapter (S2 )?(\d+) - Title"
  const match = dirName.match(/^Chapter\s+(S(\d)\s+)?(\d+)\s*[-–]\s*(.+)$/)
  if (match) {
    const season = (match[2] ? parseInt(match[2]) : 1) as 1 | 2 | 3
    const num = match[3].padStart(2, '0')
    const number = season === 1 ? `EP ${num}` : `S${season} EP ${num}`
    const title = match[4].trim()
    return { season, number, title }
  }

  // Fallback for dirs without dash separator like "Chapter S2 01 Microservices..."
  const fallback = dirName.match(/^Chapter\s+(S(\d)\s+)?(\d+)\s+(.+)$/)
  if (fallback) {
    const season = (fallback[2] ? parseInt(fallback[2]) : 1) as 1 | 2 | 3
    const num = fallback[3].padStart(2, '0')
    const number = season === 1 ? `EP ${num}` : `S${season} EP ${num}`
    const title = fallback[4].trim()
    return { season, number, title }
  }

  return { season: 1, number: 'EP 00', title: dirName }
}

function dirNameToSlug(dirName: string): string {
  const { season, number, title } = parseDirName(dirName)
  const numOnly = number.replace(/\D+/g, '-').replace(/^-|-$/g, '')
  const prefix = season === 1 ? `s1-ep${numOnly.padStart(2, '0')}` : `s${season}-ep${numOnly.replace(`${season}-`, '').padStart(2, '0')}`
  return `${prefix}-${slugify(title)}`
}

function getAllNodeChapterDirs(): string[] {
  if (!fs.existsSync(NODE_CONTENT_ROOT)) return []
  const entries = fs.readdirSync(NODE_CONTENT_ROOT, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory() && e.name.startsWith('Chapter'))
    .map((e) => e.name)
    .sort((a, b) => {
      const ak = getSortKey(a)
      const bk = getSortKey(b)
      if (ak.season !== bk.season) return ak.season - bk.season
      return ak.num - bk.num
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

function getSeasonLabel(season: 1 | 2 | 3): string {
  return `Season ${season}`
}

export function getAllNodeChapters(): ChapterMeta[] {
  const dirs = getAllNodeChapterDirs()
  return dirs.map((dirName) => {
    const { season, number, title } = parseDirName(dirName)
    let readTime = 1
    try {
      const readmePath = path.join(NODE_CONTENT_ROOT, dirName, 'README.md')
      const content = fs.readFileSync(readmePath, 'utf-8')
      readTime = computeReadTime(content)
    } catch {}
    return {
      slug: dirNameToSlug(dirName),
      dirName,
      title,
      number,
      season,
      seasonLabel: getSeasonLabel(season),
      readTime,
    }
  })
}

export function getNodeChapterBySlug(slug: string): Chapter | null {
  const dirs = getAllNodeChapterDirs()
  const dirName = dirs.find((d) => dirNameToSlug(d) === slug)
  if (!dirName) return null

  const readmePath = path.join(NODE_CONTENT_ROOT, dirName, 'README.md')
  if (!fs.existsSync(readmePath)) return null

  const content = fs.readFileSync(readmePath, 'utf-8')
  const { season, number, title } = parseDirName(dirName)

  return {
    slug,
    dirName,
    title,
    number,
    season,
    seasonLabel: getSeasonLabel(season),
    content,
    headings: extractHeadings(content),
    readTime: computeReadTime(content),
  }
}

export function getNodeSearchIndex() {
  return getAllNodeChapters().map((ch) => ({
    slug: ch.slug,
    title: ch.title,
    number: ch.number,
    seasonLabel: ch.seasonLabel,
  }))
}

export function getNodeSeasons(): Season[] {
  const allChapters = getAllNodeChapters()

  const seasonDescriptions: Record<number, string> = {
    1: 'Foundations of Node.js — Runtime, V8 Engine, libuv, Event Loop, Servers & Databases',
    2: 'Building DevTinder — Full-stack application with Express, MongoDB, Authentication & React UI',
    3: 'Deployment & DevOps — AWS, Nginx, Custom Domains',
  }

  const grouped = new Map<number, ChapterMeta[]>()
  for (const ch of allChapters) {
    const existing = grouped.get(ch.season) || []
    existing.push(ch)
    grouped.set(ch.season, existing)
  }

  return ([1, 2, 3] as const).map((num) => ({
    number: num,
    label: `Season ${num}`,
    description: seasonDescriptions[num],
    chapters: grouped.get(num) || [],
  }))
}
