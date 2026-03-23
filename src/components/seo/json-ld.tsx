import Script from 'next/script'

interface JsonLdProps {
  data: object
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="beforeInteractive"
    />
  )
}

// Organization structured data
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'aQ-Invest',
        url: 'https://aqinvest.com.br',
        logo: 'https://aqinvest.com.br/logo.png',
        description: 'Plataforma de análise fundamentalista de ações brasileiras para investidores',
        sameAs: [
          'https://twitter.com/aqinvest',
          'https://linkedin.com/company/aqinvest',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: 'contato@aqinvest.com.br',
        },
      }}
    />
  )
}

// Software Application structured data
export function SoftwareApplicationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'aQ-Invest',
        operatingSystem: 'Web',
        applicationCategory: 'FinanceApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'BRL',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '1250',
        },
      }}
    />
  )
}

// Financial Product (Asset) structured data
interface AssetJsonLdProps {
  ticker: string
  name: string
  type: string
  sector?: string | null
  price?: number | null
  priceChange?: number | null
  score?: number | null
}

export function AssetJsonLd({ ticker, name, type, sector, price, priceChange, score }: AssetJsonLdProps) {
  const priceSpec = price ? {
    '@type': 'UnitPriceSpecification',
    price: price,
    priceCurrency: 'BRL',
    priceType: 'https://schema.org/ListPrice',
  } : undefined

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FinancialProduct',
        name: `${ticker} - ${name}`,
        description: `Análise de ${ticker} (${name}). ${type === 'fii' ? 'Fundo Imobiliário' : 'Ação'} do setor ${sector ?? 'N/A'}.`,
        provider: {
          '@type': 'Organization',
          name: 'B3 - Brasil, Bolsa, Balcão',
        },
        ...(priceSpec && { offers: priceSpec }),
        additionalProperty: [
          {
            '@type': 'PropertyValue',
            name: 'Ticker',
            value: ticker,
          },
          {
            '@type': 'PropertyValue',
            name: 'Tipo',
            value: type === 'fii' ? 'Fundo Imobiliário' : type === 'stock' ? 'Ação' : type.toUpperCase(),
          },
          ...(sector ? [{
            '@type': 'PropertyValue',
            name: 'Setor',
            value: sector,
          }] : []),
          ...(score !== null ? [{
            '@type': 'PropertyValue',
            name: 'aQ Score',
            value: score,
          }] : []),
        ],
      }}
    />
  )
}

// Breadcrumb structured data
interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  )
}

// FAQ structured data
interface FAQItem {
  question: string
  answer: string
}

export function FAQJsonLd({ items }: { items: FAQItem[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }}
    />
  )
}
