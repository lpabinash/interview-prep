import type { MetadataRoute } from 'next'
import { getAllChapters } from '@/lib/chapters'
import { getAllReactChapters } from '@/lib/react-chapters'
import { getAllNodeChapters } from '@/lib/node-chapters'
import { getAllDsaChapters } from '@/lib/dsa-chapters'
import { getAllFsdChapters } from '@/lib/fsd-chapters'
import { getAllTsChapters } from '@/lib/typescript-chapters'
import { getAllNextjsChapters } from '@/lib/nextjs-chapters'

const siteUrl = 'https://namaste-javascript.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const chapters = getAllChapters()
  const reactChapters = getAllReactChapters()
  const nodeChapters = getAllNodeChapters()
  const dsaChapters = getAllDsaChapters()
  const fsdChapters = getAllFsdChapters()
  const tsChapters = getAllTsChapters()
  const nextjsChapters = getAllNextjsChapters()

  const chapterUrls = chapters.map((ch) => ({
    url: `${siteUrl}/chapters/${ch.slug}`,
    lastModified: new Date(),
  }))

  const reactUrls = reactChapters.map((ch) => ({
    url: `${siteUrl}/react/chapters/${ch.slug}`,
    lastModified: new Date(),
  }))

  const nodeUrls = nodeChapters.map((ch) => ({
    url: `${siteUrl}/nodejs/chapters/${ch.slug}`,
    lastModified: new Date(),
  }))

  const dsaUrls = dsaChapters.map((ch) => ({
    url: `${siteUrl}/dsa/chapters/${ch.slug}`,
    lastModified: new Date(),
  }))

  const fsdUrls = fsdChapters.map((ch) => ({
    url: `${siteUrl}/fsd/chapters/${ch.slug}`,
    lastModified: new Date(),
  }))

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/react`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/nodejs`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/dsa`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/fsd`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/typescript`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/nextjs`,
      lastModified: new Date(),
    },
    ...chapterUrls,
    ...reactUrls,
    ...nodeUrls,
    ...dsaUrls,
    ...fsdUrls,
    ...tsChapters.map((ch) => ({
      url: `${siteUrl}/typescript/chapters/${ch.slug}`,
      lastModified: new Date(),
    })),
    ...nextjsChapters.map((ch) => ({
      url: `${siteUrl}/nextjs/chapters/${ch.slug}`,
      lastModified: new Date(),
    })),
  ]
}
