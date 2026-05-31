'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, ChevronDown, ChevronRight, Check } from 'lucide-react'
import type { Season } from '@/types/chapter'
import { ContinueReading } from './continue-reading'
import { useCompletedChapters } from '@/hooks/use-bookmark'

type Course = 'javascript' | 'react' | 'nodejs' | 'dsa' | 'fsd' | 'typescript' | 'nextjs'

interface SidebarClientProps {
  seasons: Season[]
  reactSeasons: Season[]
  nodeSeasons: Season[]
  dsaSeasons: Season[]
  fsdSeasons: Season[]
  tsSeasons: Season[]
  nextjsSeasons: Season[]
}

function detectCourse(pathname: string): Course {
  if (pathname.startsWith('/react')) return 'react'
  if (pathname.startsWith('/nodejs')) return 'nodejs'
  if (pathname.startsWith('/dsa')) return 'dsa'
  if (pathname.startsWith('/fsd')) return 'fsd'
  if (pathname.startsWith('/typescript')) return 'typescript'
  if (pathname.startsWith('/nextjs')) return 'nextjs'
  return 'javascript'
}

const courseConfig: Record<Course, { label: string; heroTitle: string; basePath: string; home: string }> = {
  javascript: { label: 'JS', heroTitle: 'JAVASCRIPT', basePath: '/chapters', home: '/' },
  react: { label: 'React', heroTitle: 'REACT', basePath: '/react/chapters', home: '/react' },
  nodejs: { label: 'Node', heroTitle: 'NODE.JS', basePath: '/nodejs/chapters', home: '/nodejs' },
  dsa: { label: 'DSA', heroTitle: 'DSA', basePath: '/dsa/chapters', home: '/dsa' },
  fsd: { label: 'FSD', heroTitle: 'FSD', basePath: '/fsd/chapters', home: '/fsd' },
  typescript: { label: 'TS', heroTitle: 'TYPESCRIPT', basePath: '/typescript/chapters', home: '/typescript' },
  nextjs: { label: 'Next', heroTitle: 'NEXT.JS', basePath: '/nextjs/chapters', home: '/nextjs' },
}

export function SidebarClient({ seasons, reactSeasons, nodeSeasons, dsaSeasons, fsdSeasons, tsSeasons, nextjsSeasons }: SidebarClientProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [activeCourse, setActiveCourse] = useState<Course>(detectCourse(pathname))
  const [expandedSeasons, setExpandedSeasons] = useState<number[]>([1, 2, 3])
  const { isCompleted, reset } = useCompletedChapters()

  const seasonMap: Record<Course, Season[]> = {
    javascript: seasons,
    react: reactSeasons,
    nodejs: nodeSeasons,
    dsa: dsaSeasons,
    fsd: fsdSeasons,
    typescript: tsSeasons,
    nextjs: nextjsSeasons,
  }
  const currentSeasons = seasonMap[activeCourse]
  const { basePath: chapterBasePath, home: homeHref } = courseConfig[activeCourse]

  const allChapters = currentSeasons.flatMap((s) =>
    s.chapters.map((c) => ({ slug: c.slug, title: c.title, number: c.number }))
  )
  const totalChapters = allChapters.length
  const completedCount = allChapters.filter((ch) => isCompleted(ch.slug)).length
  const progressPct = totalChapters > 0 ? (completedCount / totalChapters) * 100 : 0

  function toggleSeason(num: number) {
    setExpandedSeasons((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    )
  }

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Logo / Title */}
      <div className="p-6 border-b border-foreground dark:border-[#2A2A2A]">
        <Link
          href={homeHref}
          className="block group"
          onClick={() => setIsOpen(false)}
        >
          <h2 className="font-heading text-xl font-black tracking-tight leading-tight group-hover:opacity-70 transition-opacity duration-100">
            NAMASTE
            <br />
            {courseConfig[activeCourse].heroTitle}
          </h2>
        </Link>
      </div>

      {/* Course switcher */}
      <div className="grid grid-cols-4 border-b border-foreground dark:border-[#2A2A2A]">
        {(['javascript', 'react', 'nodejs', 'dsa', 'fsd', 'typescript', 'nextjs'] as Course[]).map((course) => (
          <button
            key={course}
            onClick={() => setActiveCourse(course)}
            className={`py-2.5 font-mono text-[10px] tracking-widest uppercase transition-colors duration-100 border-b border-r border-foreground dark:border-[#2A2A2A] last:border-r-0 ${
              activeCourse === course
                ? 'bg-foreground text-background dark:bg-[#FAFAFA] dark:text-[#0A0A0A]'
                : 'hover:bg-foreground hover:text-background dark:hover:bg-[#FAFAFA] dark:hover:text-[#0A0A0A]'
            }`}
          >
            {courseConfig[course].label}
          </button>
        ))}
      </div>

      {/* Progress bar — only shown once at least 1 chapter completed */}
      {completedCount > 0 && (
        <div className="px-6 py-3 border-b border-foreground dark:border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground dark:text-[#A3A3A3]">
              Progress
            </span>
            <span className="font-mono text-[10px] font-bold">
              {completedCount} / {totalChapters}
            </span>
          </div>
          <div className="h-1 bg-muted dark:bg-[#2A2A2A] w-full">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <button
            onClick={reset}
            className="mt-2 font-mono text-[9px] tracking-widest uppercase text-muted-foreground dark:text-[#A3A3A3] hover:text-foreground dark:hover:text-[#FAFAFA] transition-colors duration-100"
          >
            Reset progress
          </button>
        </div>
      )}

      <ContinueReading chapters={allChapters} chapterBasePath={chapterBasePath} activeCourse={activeCourse} />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {currentSeasons.map((season) => (
          <div key={season.number} className="mb-2">
            {/* Season header */}
            <button
              onClick={() => toggleSeason(season.number)}
              className="w-full flex items-center justify-between px-6 py-3 text-left font-mono text-xs tracking-widest uppercase hover:bg-foreground hover:text-background dark:hover:bg-[#FAFAFA] dark:hover:text-[#0A0A0A] transition-colors duration-100"
            >
              <span>{season.label}</span>
              {expandedSeasons.includes(season.number) ? (
                <ChevronDown size={14} strokeWidth={1.5} />
              ) : (
                <ChevronRight size={14} strokeWidth={1.5} />
              )}
            </button>

            {/* Chapter links */}
            {expandedSeasons.includes(season.number) && (
              <ul>
                {season.chapters.map((ch) => {
                  const href = `${chapterBasePath}/${ch.slug}`
                  const isActive = pathname === href
                  const done = isCompleted(ch.slug)

                  return (
                    <li key={ch.slug}>
                      <Link
                        href={href}
                        onClick={() => setIsOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center justify-between px-6 py-2 text-sm font-body transition-colors duration-100 ${
                          isActive
                            ? 'bg-foreground text-background dark:bg-[#FAFAFA] dark:text-[#0A0A0A] border-l-4 border-accent'
                            : 'border-l-2 border-transparent hover:bg-foreground hover:text-background dark:hover:bg-[#FAFAFA] dark:hover:text-[#0A0A0A] hover:border-accent'
                        }`}
                      >
                        <span className="flex-1 min-w-0">
                          <span className="font-mono text-[10px] text-muted-foreground dark:text-[#A3A3A3] block">
                            {isActive ? (
                              <span className="text-background dark:text-[#0A0A0A]">{ch.number}</span>
                            ) : (
                              ch.number
                            )}
                          </span>
                          <span className="block leading-snug">{ch.title}</span>
                        </span>
                        {done && (
                          <Check
                            size={12}
                            strokeWidth={2.5}
                            className={`shrink-0 ml-2 ${isActive ? 'text-background dark:text-[#0A0A0A] opacity-70' : 'text-accent'}`}
                          />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>

    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-4 z-50 md:hidden p-2 bg-background dark:bg-[#0A0A0A] border border-foreground dark:border-[#FAFAFA] hover:bg-foreground hover:text-background dark:hover:bg-[#FAFAFA] dark:hover:text-[#0A0A0A] transition-colors duration-100"
        aria-label="Open navigation"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-72 shrink-0 border-r border-foreground dark:border-[#2A2A2A] bg-background dark:bg-[#0A0A0A] sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-foreground/50 dark:bg-[#FAFAFA]/20"
            onClick={() => setIsOpen(false)}
          />
          {/* Panel */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-background dark:bg-[#0A0A0A] border-r border-foreground dark:border-[#2A2A2A] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-foreground hover:text-background dark:hover:bg-[#FAFAFA] dark:hover:text-[#0A0A0A] transition-colors duration-100"
              aria-label="Close navigation"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
