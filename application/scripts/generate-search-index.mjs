// @ts-check
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const JS_CONTENT_ROOT = path.join(__dirname, '..', 'javascript-chapters')
const CONTENT_ROOT = JS_CONTENT_ROOT

const CHAPTER_DIR_RE = /^Chapter\s+(S(\d)\s+)?(\d+)\s*[-–]\s*(.+)$/
const CONCEPT_TITLE_MAP = { Debouncing: 'Debouncing', Throtling: 'Throttling' }

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseDirName(dirName) {
  const match = dirName.match(CHAPTER_DIR_RE)
  if (!match) return null
  return {
    season: match[2] ? parseInt(match[2]) : 1,
    number: match[3],
    title: match[4].trim(),
  }
}

const entries = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })
const chapterDirs = entries
  .filter((e) => e.isDirectory() && CHAPTER_DIR_RE.test(e.name))
  .map((e) => e.name)
  .sort((a, b) => {
    const pa = parseDirName(a)
    const pb = parseDirName(b)
    if (!pa || !pb) return a.localeCompare(b)
    if (pa.season !== pb.season) return pa.season - pb.season
    return parseInt(pa.number) - parseInt(pb.number)
  })

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')          // fenced code blocks
    .replace(/`[^`]+`/g, '')                 // inline code
    .replace(/^#{1,6}\s+/gm, '')             // heading markers
    .replace(/!\[.*?\]\(.*?\)/g, '')          // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → keep text
    .replace(/https?:\/\/\S+/g, '')          // bare URLs
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // bold/italic
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')   // underscore bold/italic
    .replace(/^>\s*/gm, '')                  // blockquotes
    .replace(/^---+$/gm, '')                 // horizontal rules
    .replace(/^[-*+]\s+/gm, '')              // list bullets
    .replace(/^\d+\.\s+/gm, '')              // numbered lists
    .replace(/\s+/g, ' ')                    // collapse whitespace
    .trim()
}

const index = []

for (const dirName of chapterDirs) {
  const parsed = parseDirName(dirName)
  if (!parsed) continue
  const num = parsed.number.padStart(2, '0')
  const prefix = parsed.season === 1 ? `s1-ep${num}` : `s2-ep${num}`
  const slug = `${prefix}-${slugify(parsed.title)}`
  const number = parsed.season === 1 ? `EP ${num}` : `S2 EP ${num}`
  let content = ''
  try {
    const raw = fs.readFileSync(path.join(CONTENT_ROOT, dirName, 'README.md'), 'utf-8')
    content = stripMarkdown(raw)
  } catch {}
  index.push({
    slug,
    title: parsed.title,
    number,
    seasonLabel: parsed.season === 1 ? 'Season 1' : 'Season 2',
    course: 'javascript',
    content,
  })
}

// Concepts
const conceptsDir = path.join(CONTENT_ROOT, 'Concepts')
if (fs.existsSync(conceptsDir)) {
  const conceptEntries = fs.readdirSync(conceptsDir, { withFileTypes: true })
  for (const e of conceptEntries) {
    if (!e.isDirectory()) continue
    const displayTitle = CONCEPT_TITLE_MAP[e.name] ?? e.name
    let content = ''
    try {
      const raw = fs.readFileSync(path.join(conceptsDir, e.name, 'README.md'), 'utf-8')
      content = stripMarkdown(raw)
    } catch {}
    index.push({
      slug: `concepts-${e.name.toLowerCase()}`,
      title: displayTitle,
      number: 'Concept',
      seasonLabel: 'Concepts',
      course: 'javascript',
      content,
    })
  }
}

const outPath = path.join(__dirname, '..', 'public', 'search-index.json')

// ----- React chapters -----
const REACT_CONTENT_ROOT = path.join(__dirname, '..', 'react-chapters')
const REACT_CHAPTER_DIR_RE = /^Chapter\s+(\d+)\s+(.+)$/

if (fs.existsSync(REACT_CONTENT_ROOT)) {
  const reactEntries = fs.readdirSync(REACT_CONTENT_ROOT, { withFileTypes: true })
  const reactDirs = reactEntries
    .filter((e) => e.isDirectory() && REACT_CHAPTER_DIR_RE.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => {
      const ma = a.match(REACT_CHAPTER_DIR_RE)
      const mb = b.match(REACT_CHAPTER_DIR_RE)
      if (!ma || !mb) return a.localeCompare(b)
      return parseInt(ma[1]) - parseInt(mb[1])
    })

  for (const dirName of reactDirs) {
    const match = dirName.match(REACT_CHAPTER_DIR_RE)
    if (!match) continue
    const num = match[1].padStart(2, '0')
    const title = match[2].trim()
    const slug = `ch${num}-${slugify(title)}`
    const number = `CH ${num}`
    let content = ''
    // React chapters: try Theory/README.md → Theory/Assignment.md → root README.md
    // Skip placeholder files (< 50 chars of real content)
    const candidates = [
      path.join(REACT_CONTENT_ROOT, dirName, 'Theory', 'README.md'),
      path.join(REACT_CONTENT_ROOT, dirName, 'Theory', 'Assignment.md'),
      path.join(REACT_CONTENT_ROOT, dirName, 'README.md'),
    ]
    for (const filePath of candidates) {
      try {
        if (!fs.existsSync(filePath)) continue
        const raw = fs.readFileSync(filePath, 'utf-8')
        const stripped = raw.replace(/^#.*$/gm, '').replace(/[-–—]/g, '').trim()
        if (stripped.length < 50) continue
        content = stripMarkdown(raw)
        break
      } catch {}
    }
    index.push({
      slug,
      title,
      number,
      seasonLabel: 'React',
      course: 'react',
      content,
    })
  }
}

// ----- Node.js chapters -----
const NODE_CONTENT_ROOT = path.join(__dirname, '..', 'nodejs-chapters')
const NODE_CHAPTER_DIR_RE = /^Chapter\s+(S(\d)\s+)?(\d+)/

if (fs.existsSync(NODE_CONTENT_ROOT)) {
  const nodeEntries = fs.readdirSync(NODE_CONTENT_ROOT, { withFileTypes: true })
  const nodeDirs = nodeEntries
    .filter((e) => e.isDirectory() && e.name.startsWith('Chapter'))
    .map((e) => e.name)
    .sort((a, b) => {
      const ma = a.match(NODE_CHAPTER_DIR_RE)
      const mb = b.match(NODE_CHAPTER_DIR_RE)
      if (!ma || !mb) return a.localeCompare(b)
      const sa = ma[2] ? parseInt(ma[2]) : 1
      const sb = mb[2] ? parseInt(mb[2]) : 1
      if (sa !== sb) return sa - sb
      return parseInt(ma[3]) - parseInt(mb[3])
    })

  for (const dirName of nodeDirs) {
    // Parse: "Chapter (S2 )?(\d+) [-–] Title" or "Chapter (S2 )?(\d+) Title"
    let season = 1, epNum = '00', title = dirName
    const dashMatch = dirName.match(/^Chapter\s+(S(\d)\s+)?(\d+)\s*[-–]\s*(.+)$/)
    const spaceMatch = dirName.match(/^Chapter\s+(S(\d)\s+)?(\d+)\s+(.+)$/)
    const m = dashMatch || spaceMatch
    if (m) {
      season = m[2] ? parseInt(m[2]) : 1
      epNum = m[3].padStart(2, '0')
      title = m[4].trim()
    }
    const slug = `s${season}-ep${epNum}-${slugify(title)}`
    const number = season === 1 ? `EP ${epNum}` : `S${season} EP ${epNum}`
    const seasonLabel = `Season ${season}`
    let content = ''
    try {
      const raw = fs.readFileSync(path.join(NODE_CONTENT_ROOT, dirName, 'README.md'), 'utf-8')
      content = stripMarkdown(raw)
    } catch {}
    index.push({
      slug,
      title,
      number,
      seasonLabel,
      course: 'nodejs',
      content,
    })
  }
}

// ----- DSA chapters -----
const DSA_CONTENT_ROOT = path.join(__dirname, '..', 'dsa-chapters')
const DSA_DIR_RE = /^(\d+)-(.+)$/

function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function findReadme(dir) {
  try {
    const files = fs.readdirSync(dir)
    const readme = files.find((f) => f.toLowerCase() === 'readme.md')
    return readme ? path.join(dir, readme) : null
  } catch {
    return null
  }
}

if (fs.existsSync(DSA_CONTENT_ROOT)) {
  const dsaEntries = fs.readdirSync(DSA_CONTENT_ROOT, { withFileTypes: true })
  const dsaDirs = dsaEntries
    .filter((e) => e.isDirectory() && DSA_DIR_RE.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => {
      const ma = a.match(DSA_DIR_RE)
      const mb = b.match(DSA_DIR_RE)
      if (!ma || !mb) return a.localeCompare(b)
      return parseInt(ma[1]) - parseInt(mb[1])
    })

  for (const dirName of dsaDirs) {
    const match = dirName.match(DSA_DIR_RE)
    if (!match) continue
    const num = match[1].padStart(2, '0')
    const title = titleCase(match[2])
    const slug = slugify(dirName)
    const number = `CH ${num}`

    // Build content from topic README + sub-problem READMEs
    let contentParts = []
    const topicReadme = findReadme(path.join(DSA_CONTENT_ROOT, dirName))
    if (topicReadme) {
      try { contentParts.push(stripMarkdown(fs.readFileSync(topicReadme, 'utf-8'))) } catch {}
    }
    const subDirs = fs.readdirSync(path.join(DSA_CONTENT_ROOT, dirName), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
    for (const sub of subDirs) {
      const subReadme = findReadme(path.join(DSA_CONTENT_ROOT, dirName, sub))
      if (subReadme) {
        try { contentParts.push(stripMarkdown(fs.readFileSync(subReadme, 'utf-8'))) } catch {}
      }
    }

    index.push({
      slug,
      title,
      number,
      seasonLabel: 'DSA',
      course: 'dsa',
      content: contentParts.join(' '),
    })
  }
}

// ----- FSD chapters -----
const FSD_CONTENT_ROOT = path.join(__dirname, '..', 'fsd-chapters')
const FSD_CATEGORIES = [
  { dir: 'Security', title: 'Security' },
  { dir: 'Networking', title: 'Networking' },
  { dir: 'Accessibility', title: 'Accessibility' },
  { dir: 'Performance', title: 'Performance' },
  { dir: 'testing', title: 'Testing' },
  { dir: 'CommunicationTechniques', title: 'Communication Techniques' },
  { dir: 'Databases&Caching', title: 'Databases & Caching' },
  { dir: 'offline', title: 'Offline Support' },
  { dir: 'HLD', title: 'High Level Design' },
  { dir: 'LLD', title: 'Low Level Design' },
]

const FSD_SEASON_MAP = {
  Security: 'Fundamentals', Networking: 'Fundamentals', Accessibility: 'Fundamentals',
  Performance: 'Fundamentals', testing: 'Fundamentals',
  CommunicationTechniques: 'Infrastructure', 'Databases&Caching': 'Infrastructure', offline: 'Infrastructure',
  HLD: 'Design', LLD: 'Design',
}

if (fs.existsSync(FSD_CONTENT_ROOT)) {
  FSD_CATEGORIES.forEach((cat, idx) => {
    const catPath = path.join(FSD_CONTENT_ROOT, cat.dir)
    if (!fs.existsSync(catPath)) return

    const num = String(idx + 1).padStart(2, '0')
    const slug = slugify(cat.title)
    const number = `CH ${num}`
    const seasonLabel = FSD_SEASON_MAP[cat.dir] || 'FSD'

    // Aggregate content from sub-topics
    let contentParts = []
    const topReadme = findReadme(catPath)
    if (topReadme) {
      try {
        const raw = fs.readFileSync(topReadme, 'utf-8')
        if (!raw.includes('Create React App')) {
          contentParts.push(stripMarkdown(raw))
        }
      } catch {}
    }
    try {
      const subDirs = fs.readdirSync(catPath, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
      for (const sub of subDirs) {
        const subReadme = findReadme(path.join(catPath, sub))
        if (subReadme) {
          try {
            const raw = fs.readFileSync(subReadme, 'utf-8')
            if (!raw.includes('Create React App')) {
              contentParts.push(stripMarkdown(raw))
            }
          } catch {}
        }
      }
    } catch {}

    index.push({
      slug,
      title: cat.title,
      number,
      seasonLabel,
      course: 'fsd',
      content: contentParts.join(' '),
    })
  })
}

// --- TypeScript chapters ---
const TS_CONTENT_ROOT = path.join(__dirname, '..', 'typescript-chapters')
const TS_DIR_RE = /^Chapter\s+(\d+)\s+(.+)$/

if (fs.existsSync(TS_CONTENT_ROOT)) {
  const tsDirs = fs.readdirSync(TS_CONTENT_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && TS_DIR_RE.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => {
      const ma = a.match(TS_DIR_RE)
      const mb = b.match(TS_DIR_RE)
      return (ma ? parseInt(ma[1]) : 0) - (mb ? parseInt(mb[1]) : 0)
    })

  for (const dir of tsDirs) {
    const m = dir.match(TS_DIR_RE)
    if (!m) continue
    const num = m[1].padStart(2, '0')
    const title = m[2].trim()
    const slug = `ch${num}-${slugify(title)}`
    const chNum = parseInt(m[1])
    const seasonLabel = chNum <= 5 ? 'Fundamentals' : chNum <= 9 ? 'Intermediate' : 'Advanced'

    const readme = findReadme(path.join(TS_CONTENT_ROOT, dir))
    let content = ''
    if (readme) {
      try { content = stripMarkdown(fs.readFileSync(readme, 'utf-8')) } catch {}
    }

    index.push({ slug, title, number: `CH ${num}`, seasonLabel, course: 'typescript', content })
  }
}

// --- Next.js chapters ---
const NEXTJS_CONTENT_ROOT = path.join(__dirname, '..', 'nextjs-chapters')

if (fs.existsSync(NEXTJS_CONTENT_ROOT)) {
  const nextDirs = fs.readdirSync(NEXTJS_CONTENT_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && TS_DIR_RE.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => {
      const ma = a.match(TS_DIR_RE)
      const mb = b.match(TS_DIR_RE)
      return (ma ? parseInt(ma[1]) : 0) - (mb ? parseInt(mb[1]) : 0)
    })

  for (const dir of nextDirs) {
    const m = dir.match(TS_DIR_RE)
    if (!m) continue
    const num = m[1].padStart(2, '0')
    const title = m[2].trim()
    const slug = `ch${num}-${slugify(title)}`
    const chNum = parseInt(m[1])
    const seasonLabel = chNum <= 4 ? 'Foundations' : chNum <= 8 ? 'Core Concepts' : 'Production'

    const readme = findReadme(path.join(NEXTJS_CONTENT_ROOT, dir))
    let content = ''
    if (readme) {
      try { content = stripMarkdown(fs.readFileSync(readme, 'utf-8')) } catch {}
    }

    index.push({ slug, title, number: `CH ${num}`, seasonLabel, course: 'nextjs', content })
  }
}

fs.writeFileSync(outPath, JSON.stringify(index, null, 2))
console.log(`✓ search-index.json written (${index.length} entries)`)
