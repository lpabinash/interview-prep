'use client'
import { useState, useEffect, useCallback } from 'react'

const LAST_VISITED_KEY = 'nj_last_visited'
const LAST_VISITED_MAP_KEY = 'nj_last_visited_map'
const BOOKMARK_KEY = 'nj_bookmark'
const COMPLETED_KEY = 'nj_completed'
const SCROLL_POS_KEY = 'nj_scroll_pos'

function dispatch(key: string) {
  window.dispatchEvent(new StorageEvent('storage', { key }))
}

interface LastVisitedEntry {
  slug: string
  course: string
  timestamp: number
  scrollY?: number
}

export function useLastVisited(slug: string, course?: string) {
  useEffect(() => {
    try {
      // Legacy single-slug key (for backward compat with ContinueReading)
      localStorage.setItem(LAST_VISITED_KEY, slug)
      dispatch(LAST_VISITED_KEY)

      // Per-course map
      if (course) {
        const raw = localStorage.getItem(LAST_VISITED_MAP_KEY)
        const map: Record<string, LastVisitedEntry> = raw ? JSON.parse(raw) : {}
        map[course] = { slug, course, timestamp: Date.now() }
        localStorage.setItem(LAST_VISITED_MAP_KEY, JSON.stringify(map))
        dispatch(LAST_VISITED_MAP_KEY)
      }
    } catch {}
  }, [slug, course])

  // Save scroll position on unmount / before navigation
  useEffect(() => {
    if (!course) return
    const c = course

    function saveScroll() {
      try {
        const raw = localStorage.getItem(LAST_VISITED_MAP_KEY)
        const map: Record<string, LastVisitedEntry> = raw ? JSON.parse(raw) : {}
        if (map[c] && map[c].slug === slug) {
          map[c].scrollY = window.scrollY
          localStorage.setItem(LAST_VISITED_MAP_KEY, JSON.stringify(map))
        }
      } catch {}
    }

    window.addEventListener('beforeunload', saveScroll)
    return () => {
      saveScroll()
      window.removeEventListener('beforeunload', saveScroll)
    }
  }, [slug, course])
}

/** Restore scroll position for a chapter if returning to it */
export function useRestoreScroll(slug: string, course?: string) {
  useEffect(() => {
    if (!course) return
    try {
      const raw = localStorage.getItem(LAST_VISITED_MAP_KEY)
      if (!raw) return
      const map: Record<string, LastVisitedEntry> = JSON.parse(raw)
      const entry = map[course]
      if (entry && entry.slug === slug && entry.scrollY && entry.scrollY > 0) {
        // Small delay to let content render
        const timer = setTimeout(() => window.scrollTo(0, entry.scrollY!), 100)
        return () => clearTimeout(timer)
      }
    } catch {}
  }, [slug, course])
}

export function useBookmark(slug: string) {
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    function sync(e?: StorageEvent) {
      if (e && e.key !== BOOKMARK_KEY) return
      try { setBookmarked(localStorage.getItem(BOOKMARK_KEY) === slug) } catch {}
    }
    sync()
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [slug])

  const toggle = useCallback(() => {
    try {
      const next = !bookmarked
      if (next) {
        localStorage.setItem(BOOKMARK_KEY, slug)
      } else {
        localStorage.removeItem(BOOKMARK_KEY)
      }
      setBookmarked(next)
      dispatch(BOOKMARK_KEY)
    } catch {}
  }, [bookmarked, slug])

  return { bookmarked, toggle }
}

export function useContinueReading() {
  const [state, setState] = useState<{ lastVisited: string | null; bookmark: string | null }>({
    lastVisited: null,
    bookmark: null,
  })

  useEffect(() => {
    function sync(e?: StorageEvent) {
      if (e && e.key !== BOOKMARK_KEY && e.key !== LAST_VISITED_KEY) return
      try {
        setState({
          lastVisited: localStorage.getItem(LAST_VISITED_KEY),
          bookmark: localStorage.getItem(BOOKMARK_KEY),
        })
      } catch {}
    }
    sync()
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  return state
}

/** Returns per-course last-visited entries */
export function useCourseLastVisited() {
  const [map, setMap] = useState<Record<string, LastVisitedEntry>>({})

  useEffect(() => {
    function sync(e?: StorageEvent) {
      if (e && e.key !== LAST_VISITED_MAP_KEY) return
      try {
        const raw = localStorage.getItem(LAST_VISITED_MAP_KEY)
        setMap(raw ? JSON.parse(raw) : {})
      } catch { setMap({}) }
    }
    sync()
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  /** Get the most recently visited entry across all courses */
  const getMostRecent = useCallback((): LastVisitedEntry | null => {
    const entries = Object.values(map)
    if (entries.length === 0) return null
    return entries.reduce((latest, e) => (e.timestamp > latest.timestamp ? e : latest))
  }, [map])

  /** Get last-visited for a specific course */
  const getForCourse = useCallback((course: string): LastVisitedEntry | null => {
    return map[course] ?? null
  }, [map])

  return { map, getMostRecent, getForCourse }
}

export function useCompletedChapters() {
  const [completed, setCompleted] = useState<string[]>([])

  useEffect(() => {
    function sync(e?: StorageEvent) {
      if (e && e.key !== COMPLETED_KEY) return
      try {
        const raw = localStorage.getItem(COMPLETED_KEY)
        setCompleted(raw ? JSON.parse(raw) : [])
      } catch { setCompleted([]) }
    }
    sync()
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const isCompleted = useCallback((slug: string) => completed.includes(slug), [completed])

  const toggle = useCallback((slug: string) => {
    const next = completed.includes(slug)
      ? completed.filter((s) => s !== slug)
      : [...completed, slug]
    setCompleted(next)
    try {
      localStorage.setItem(COMPLETED_KEY, JSON.stringify(next))
      dispatch(COMPLETED_KEY)
    } catch {}
  }, [completed])

  const reset = useCallback(() => {
    setCompleted([])
    try {
      localStorage.removeItem(COMPLETED_KEY)
      dispatch(COMPLETED_KEY)
    } catch {}
  }, [])

  return { completed, isCompleted, toggle, reset }
}
