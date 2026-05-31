import fs from 'fs'
import path from 'path'
import type { Chapter, ChapterMeta, TocHeading, Season } from '@/types/chapter'

const FSD_CONTENT_ROOT = path.join(process.cwd(), 'fsd-chapters')

// Ordered list of categories with display names
const FSD_CATEGORIES: { dir: string; title: string; season: 1 | 2 | 3; seasonLabel: string }[] = [
  { dir: 'Security', title: 'Security', season: 1, seasonLabel: 'Fundamentals' },
  { dir: 'Networking', title: 'Networking', season: 1, seasonLabel: 'Fundamentals' },
  { dir: 'Accessibility', title: 'Accessibility', season: 1, seasonLabel: 'Fundamentals' },
  { dir: 'Performance', title: 'Performance', season: 1, seasonLabel: 'Fundamentals' },
  { dir: 'testing', title: 'Testing', season: 1, seasonLabel: 'Fundamentals' },
  { dir: 'CommunicationTechniques', title: 'Communication Techniques', season: 2, seasonLabel: 'Infrastructure' },
  { dir: 'Databases&Caching', title: 'Databases & Caching', season: 2, seasonLabel: 'Infrastructure' },
  { dir: 'offline', title: 'Offline Support', season: 2, seasonLabel: 'Infrastructure' },
  { dir: 'HLD', title: 'High Level Design', season: 3, seasonLabel: 'Design' },
  { dir: 'LLD', title: 'Low Level Design', season: 3, seasonLabel: 'Design' },
]

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
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
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

function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

function buildCategoryContent(catDir: string): string {
  const fullPath = path.join(FSD_CONTENT_ROOT, catDir)
  if (!fs.existsSync(fullPath)) return ''

  const parts: string[] = []

  // Check for top-level README
  const topFiles = fs.readdirSync(fullPath)
  const topReadme = topFiles.find((f) => f.toLowerCase() === 'readme.md')
  if (topReadme) {
    const content = readFileContent(path.join(fullPath, topReadme))
    // Skip CRA boilerplate READMEs
    if (!content.includes('Create React App')) {
      parts.push(content)
    }
  }

  // Top-level HTML files (e.g., Accessibility examples)
  const topHtml = topFiles.filter((f) => f.endsWith('.html')).sort()
  for (const htmlFile of topHtml) {
    const code = readFileContent(path.join(fullPath, htmlFile))
    parts.push(`## ${htmlFile.replace('.html', '')}\n\n\`\`\`html\n${code}\n\`\`\``)
  }

  // Sub-topic directories
  const subEntries = fs
    .readdirSync(fullPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()

  for (const sub of subEntries) {
    const subPath = path.join(fullPath, sub)
    const subFiles = fs.readdirSync(subPath)

    const subParts: string[] = []

    // README first
    const readme = subFiles.find((f) => f.toLowerCase() === 'readme.md')
    if (readme) {
      const content = readFileContent(path.join(subPath, readme))
      if (!content.includes('Create React App')) {
        subParts.push(content)
      }
    }

    // Code files: .html, .js, .css
    const codeFiles = subFiles
      .filter((f) => /\.(html|js|css)$/.test(f) && f !== 'package-lock.json')
      .sort()

    for (const file of codeFiles) {
      const ext = path.extname(file).slice(1)
      const lang = ext === 'js' ? 'javascript' : ext
      const code = readFileContent(path.join(subPath, file))
      subParts.push(`### ${file}\n\n\`\`\`${lang}\n${code}\n\`\`\``)
    }

    if (subParts.length > 0) {
      parts.push(`\n---\n\n## ${titleCase(sub)}\n\n${subParts.join('\n\n')}`)
    }
  }

  return parts.join('\n\n')
}

export function getAllFsdChapters(): ChapterMeta[] {
  return FSD_CATEGORIES
    .filter((cat) => fs.existsSync(path.join(FSD_CONTENT_ROOT, cat.dir)))
    .map((cat, idx) => {
      const num = String(idx + 1).padStart(2, '0')
      let readTime = 1
      try {
        const content = buildCategoryContent(cat.dir)
        readTime = computeReadTime(content)
      } catch {}
      return {
        slug: slugify(cat.title),
        dirName: cat.dir,
        title: cat.title,
        number: `CH ${num}`,
        season: cat.season,
        seasonLabel: cat.seasonLabel,
        readTime,
      }
    })
}

export function getFsdChapterBySlug(slug: string): Chapter | null {
  const cat = FSD_CATEGORIES.find((c) => slugify(c.title) === slug)
  if (!cat) return null

  const content = buildCategoryContent(cat.dir)
  if (!content.trim()) return null

  const idx = FSD_CATEGORIES.indexOf(cat)
  const num = String(idx + 1).padStart(2, '0')

  return {
    slug,
    dirName: cat.dir,
    title: cat.title,
    number: `CH ${num}`,
    season: cat.season,
    seasonLabel: cat.seasonLabel,
    content,
    headings: extractHeadings(content),
    readTime: computeReadTime(content),
  }
}

export function getFsdSeasons(): Season[] {
  const allChapters = getAllFsdChapters()

  const seasonDescriptions: Record<number, string> = {
    1: 'Security, Networking, Accessibility, Performance & Testing fundamentals',
    2: 'Communication Techniques, Databases & Caching, Offline Support',
    3: 'High Level Design & Low Level Design patterns',
  }

  const grouped = new Map<number, ChapterMeta[]>()
  for (const ch of allChapters) {
    const existing = grouped.get(ch.season) || []
    existing.push(ch)
    grouped.set(ch.season, existing)
  }

  return ([1, 2, 3] as const)
    .filter((num) => (grouped.get(num) || []).length > 0)
    .map((num) => ({
      number: num,
      label: num === 1 ? 'Fundamentals' : num === 2 ? 'Infrastructure' : 'Design',
      description: seasonDescriptions[num],
      chapters: grouped.get(num) || [],
    }))
}
