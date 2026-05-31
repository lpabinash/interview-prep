import { getSeasons } from '@/lib/chapters'
import { getReactSeasons } from '@/lib/react-chapters'
import { getNodeSeasons } from '@/lib/node-chapters'
import { getDsaSeasons } from '@/lib/dsa-chapters'
import { getFsdSeasons } from '@/lib/fsd-chapters'
import { getTsSeasons } from '@/lib/typescript-chapters'
import { getNextjsSeasons } from '@/lib/nextjs-chapters'
import { SidebarClient } from './sidebar-client'

export function Sidebar() {
  const seasons = getSeasons()
  const reactSeasons = getReactSeasons()
  const nodeSeasons = getNodeSeasons()
  const dsaSeasons = getDsaSeasons()
  const fsdSeasons = getFsdSeasons()
  const tsSeasons = getTsSeasons()
  const nextjsSeasons = getNextjsSeasons()
  return (
    <SidebarClient
      seasons={seasons}
      reactSeasons={reactSeasons}
      nodeSeasons={nodeSeasons}
      dsaSeasons={dsaSeasons}
      fsdSeasons={fsdSeasons}
      tsSeasons={tsSeasons}
      nextjsSeasons={nextjsSeasons}
    />
  )
}
