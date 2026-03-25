import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'https://investiq.com.br'

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

  // Dynamic asset pages fetched at build time from API
  try {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'https://investiqbackend-production.up.railway.app'
    const resp = await fetch(`${apiUrl}/tickers/search?q=&limit=500`, { next: { revalidate: 86400 } })
    if (resp.ok) {
      const data = await resp.json()
      const tickers: Array<{ ticker: string }> = data.results ?? []
      const assetPages: MetadataRoute.Sitemap = tickers.map((t) => ({
        url: `${baseUrl}/ativo/${t.ticker}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
      return [...staticPages, ...assetPages]
    }
  } catch {
    // API unavailable at build time — return static pages only
  }

  return staticPages
}
