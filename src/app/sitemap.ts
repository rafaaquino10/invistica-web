import { MetadataRoute } from 'next'
import { prisma, isDemoMode } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'https://investiq.com.br'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explorer`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/comparar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/termos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacidade`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Dynamic asset pages (only when DB is available)
  if (!isDemoMode && prisma) {
    try {
      const assets = await prisma.asset.findMany({
        where: { isActive: true },
        select: {
          ticker: true,
          updatedAt: true,
        },
      })

      const assetPages: MetadataRoute.Sitemap = assets.map((asset) => ({
        url: `${baseUrl}/ativo/${asset.ticker}`,
        lastModified: asset.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))

      return [...staticPages, ...assetPages]
    } catch {
      // DB unavailable at build time — return static pages only
    }
  }

  return staticPages
}
