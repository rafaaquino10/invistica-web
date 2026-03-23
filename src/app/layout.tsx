import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ThemeProvider } from '@/lib/theme'
import { TRPCProvider } from '@/lib/trpc/provider'
import { AuthProvider } from '@/lib/auth/provider'
import { OrganizationJsonLd, SoftwareApplicationJsonLd } from '@/components/seo'
import './globals.css'

// Geist Sans (--font-geist-sans): fonte principal para UI, headings e body text.
// Geist Mono (--font-geist-mono): para números financeiros, tabelas, aQ Score
//   e qualquer dado numérico — usar classe `font-mono` nos elementos.

export const metadata: Metadata = {
  title: {
    default: 'aQ-Invest | Inteligência que valoriza',
    template: '%s | aQ-Invest',
  },
  description:
    'Plataforma premium de analytics de investimentos com aQ Intelligence™. Análise fundamentalista com motor proprietário, portfólio analytics e gestão de carteira numa única experiência.',
  keywords: [
    'investimentos',
    'ações',
    'análise fundamentalista',
    'aQ Score',
    'portfolio',
    'ações brasileiras',
    'B3',
    'dividendos',
    'analytics',
    'bolsa de valores',
  ],
  authors: [{ name: 'aQ-Invest' }],
  creator: 'aQ-Invest',
  publisher: 'aQ-Invest',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://aqinvest.com.br'),
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
    url: 'https://aqinvest.com.br',
    siteName: 'aQ-Invest',
    title: 'aQ-Invest | Inteligência que valoriza',
    description:
      'Plataforma premium de analytics de investimentos com aQ Intelligence™.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'aQ-Invest - Inteligência que valoriza',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'aQ-Invest',
    description: 'Inteligência que valoriza.',
    images: ['/og-image.png'],
    creator: '@aqinvest',
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
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        <OrganizationJsonLd />
        <SoftwareApplicationJsonLd />
        <AuthProvider>
          <TRPCProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </TRPCProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
