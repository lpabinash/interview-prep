'use client'
import Link from 'next/link'
import { ArrowRight, Bookmark } from 'lucide-react'
import { useContinueReading, useCourseLastVisited } from '@/hooks/use-bookmark'

const courseBasePaths: Record<string, string> = {
  javascript: '/chapters',
  react: '/react/chapters',
  nodejs: '/nodejs/chapters',
  dsa: '/dsa/chapters',
  fsd: '/fsd/chapters',
  typescript: '/typescript/chapters',
  nextjs: '/nextjs/chapters',
}

const courseLabels: Record<string, string> = {
  javascript: 'JS',
  react: 'React',
  nodejs: 'Node',
  dsa: 'DSA',
  fsd: 'FSD',
  typescript: 'TS',
  nextjs: 'Next',
}

interface ContinueReadingProps {
  chapters: Array<{ slug: string; title: string; number: string }>
  chapterBasePath?: string
  activeCourse?: string
}

export function ContinueReading({ chapters, chapterBasePath = '/chapters', activeCourse }: ContinueReadingProps) {
  const { lastVisited, bookmark } = useContinueReading()
  const { getForCourse, getMostRecent } = useCourseLastVisited()

  // 1. Try bookmark first (legacy behavior)
  if (bookmark) {
    const chapter = chapters.find((c) => c.slug === bookmark)
    if (chapter) {
      return (
        <ContinueReadingLink
          href={`${chapterBasePath}/${chapter.slug}`}
          label="Bookmarked"
          icon
          number={chapter.number}
          title={chapter.title}
        />
      )
    }
  }

  // 2. Try per-course last visited for the active course
  if (activeCourse) {
    const entry = getForCourse(activeCourse)
    if (entry) {
      const chapter = chapters.find((c) => c.slug === entry.slug)
      if (chapter) {
        return (
          <ContinueReadingLink
            href={`${chapterBasePath}/${chapter.slug}`}
            label="Continue Reading"
            number={chapter.number}
            title={chapter.title}
          />
        )
      }
    }
  }

  // 3. Fallback: most recently visited from any course
  const recent = getMostRecent()
  if (recent) {
    const basePath = courseBasePaths[recent.course]
    if (basePath) {
      const courseLabel = courseLabels[recent.course] || recent.course
      return (
        <ContinueReadingLink
          href={`${basePath}/${recent.slug}`}
          label={`Continue · ${courseLabel}`}
          number=""
          title={recent.slug.replace(/^(s\d-ep|ch)\d+-/, '').replace(/-/g, ' ')}
        />
      )
    }
  }

  // 4. Legacy fallback
  if (lastVisited) {
    const chapter = chapters.find((c) => c.slug === lastVisited)
    if (chapter) {
      return (
        <ContinueReadingLink
          href={`${chapterBasePath}/${chapter.slug}`}
          label="Continue Reading"
          number={chapter.number}
          title={chapter.title}
        />
      )
    }
  }

  return null
}

function ContinueReadingLink({
  href,
  label,
  icon,
  number,
  title,
}: {
  href: string
  label: string
  icon?: boolean
  number: string
  title: string
}) {
  return (
    <div className="px-6 py-3 border-b border-foreground dark:border-[#2A2A2A]">
      <Link href={href} className="flex items-center justify-between gap-2 group">
        <div className="min-w-0">
          <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase text-muted-foreground dark:text-[#A3A3A3] mb-0.5">
            {icon ? <Bookmark size={8} fill="currentColor" /> : null}
            {label}
          </span>
          <span className="block font-body text-xs leading-snug truncate group-hover:underline">
            {number ? `${number} — ` : ''}{title}
          </span>
        </div>
        <ArrowRight size={12} strokeWidth={1.5} className="shrink-0 text-muted-foreground dark:text-[#A3A3A3]" />
      </Link>
    </div>
  )
}
