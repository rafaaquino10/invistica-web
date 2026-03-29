import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme'
import { QueryProvider } from '@/lib/api/query-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'InvestIQ | Inteligência Quantamental',
    template: '%s | InvestIQ',
  },
  description:
    'Plataforma de inteligência quantamental para ações brasileiras. Motor IQ-Cognit com IQ-Score proprietário, valuation DCF/Gordon, screener avançado e gestão de carteira.',
  keywords: [
    'investimentos',
    'ações',
    'análise fundamentalista',
    'IQ-Score',
    'portfolio',
    'ações brasileiras',
    'B3',
    'dividendos',
    'analytics',
    'bolsa de valores',
  ],
  authors: [{ name: 'InvestIQ' }],
  creator: 'InvestIQ',
  publisher: 'InvestIQ',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://investiq.com.br'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://investiq.com.br',
    siteName: 'InvestIQ',
    title: 'InvestIQ | Inteligência Quantamental',
    description:
      'Motor IQ-Cognit com IQ-Score proprietário para ações brasileiras.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'InvestIQ - Inteligência Quantamental',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InvestIQ',
    description: 'Inteligência Quantamental.',
    images: ['/og-image.png'],
    creator: '@investiq',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0F19' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
