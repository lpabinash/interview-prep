import fs from 'fs'
import path from 'path'
import type { Chapter, ChapterMeta, TocHeading, Season } from '@/types/chapter'

const DSA_CONTENT_ROOT = path.join(process.cwd(), 'dsa-chapters')

// Matches: "1-warm-up", "10-tree", etc.
const DSA_DIR_RE = /^(\d+)-(.+)$/

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

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
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

function findReadme(dir: string): string | null {
  try {
    const files = fs.readdirSync(dir)
    const readme = files.find((f) => f.toLowerCase() === 'readme.md')
    return readme ? path.join(dir, readme) : null
  } catch {
    return null
  }
}

function getAllDsaDirs(): string[] {
  if (!fs.existsSync(DSA_CONTENT_ROOT)) return []
  const entries = fs.readdirSync(DSA_CONTENT_ROOT, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory() && DSA_DIR_RE.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => {
      const ma = a.match(DSA_DIR_RE)
      const mb = b.match(DSA_DIR_RE)
      if (!ma || !mb) return a.localeCompare(b)
      return parseInt(ma[1]) - parseInt(mb[1])
    })
}

function parseDirName(dirName: string): { number: string; title: string } {
  const match = dirName.match(DSA_DIR_RE)
  if (!match) return { number: 'CH 00', title: dirName }
  const num = match[1].padStart(2, '0')
  const title = titleCase(match[2])
  return { number: `CH ${num}`, title }
}

function cleanDsaContent(md: string): string {
  return md
    // Remove relative code/solution links like [Code](./solution.js)
    .replace(/\[(?:Code|code|Solution|solution)\]\(\.\/.+?\)\s*/gi, '')
    // Remove author bylines like **By vikas singh**
    .replace(/\*\*By\s+.+?\*\*\s*/gi, '')
    // Remove practice platform links
    .replace(/\[Practice(?:-Platform)?\]\(https?:\/\/namastedev\.com\/[^)]*\)\s*/gi, '')
    // Remove broken relative links [anything](./anything)
    .replace(/\[([^\]]+)\]\(\.\/.+?\)/g, '$1')
    // Clean up leftover empty lines (3+ blank lines → 2)
    .replace(/\n{4,}/g, '\n\n\n')
}

function buildChapterContent(dirName: string): string {
  const topicDir = path.join(DSA_CONTENT_ROOT, dirName)
  const parts: string[] = []

  // Read topic-level README
  const topicReadme = findReadme(topicDir)
  if (topicReadme) {
    parts.push(cleanDsaContent(fs.readFileSync(topicReadme, 'utf-8')))
  }

  // Gather sub-problem READMEs
  const subDirs = fs
    .readdirSync(topicDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()

  for (const sub of subDirs) {
    const subDir = path.join(topicDir, sub)
    const subReadme = findReadme(subDir)
    if (subReadme) {
      const content = cleanDsaContent(fs.readFileSync(subReadme, 'utf-8'))
      parts.push(`\n---\n\n## ${titleCase(sub)}\n\n${content}`)
    } else {
      // Fall back to JS files
      const jsFiles = fs
        .readdirSync(subDir)
        .filter((f) => f.endsWith('.js'))
        .sort()
      if (jsFiles.length > 0) {
        const codeBlocks = jsFiles.map((f) => {
          const code = fs.readFileSync(path.join(subDir, f), 'utf-8')
          return `### ${f}\n\n\`\`\`javascript\n${code}\n\`\`\``
        })
        parts.push(`\n---\n\n## ${titleCase(sub)}\n\n${codeBlocks.join('\n\n')}`)
      }
    }
  }

  return parts.join('\n\n')
}

export function getAllDsaChapters(): ChapterMeta[] {
  const dirs = getAllDsaDirs()
  return dirs.map((dirName) => {
    const { number, title } = parseDirName(dirName)
    let readTime = 1
    try {
      const content = buildChapterContent(dirName)
      readTime = computeReadTime(content)
    } catch {}
    return {
      slug: slugify(dirName),
      dirName,
      title,
      number,
      season: 1 as 1 | 2 | 3,
      seasonLabel: 'DSA',
      readTime,
    }
  })
}

export function getDsaChapterBySlug(slug: string): Chapter | null {
  const dirs = getAllDsaDirs()
  const dirName = dirs.find((d) => slugify(d) === slug)
  if (!dirName) return null

  const content = buildChapterContent(dirName)
  if (!content.trim()) return null

  const { number, title } = parseDirName(dirName)

  return {
    slug,
    dirName,
    title,
    number,
    season: 1 as 1 | 2 | 3,
    seasonLabel: 'DSA',
    content,
    headings: extractHeadings(content),
    readTime: computeReadTime(content),
  }
}

export function getDsaSeasons(): Season[] {
  const allChapters = getAllDsaChapters()
  return [
    {
      number: 1,
      label: 'Data Structures & Algorithms',
      description:
        'From warm-up problems to trees — arrays, recursion, sorting, linked lists, strings, stacks, queues, binary search & two-pointer techniques.',
      chapters: allChapters,
    },
  ]
}
