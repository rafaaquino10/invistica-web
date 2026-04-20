import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ThemeProvider } from '@/lib/theme'
import { TRPCProvider } from '@/lib/trpc/provider'
import { AuthProvider } from '@/lib/auth/provider'
import { OrganizationJsonLd, SoftwareApplicationJsonLd } from '@/components/seo'
import './globals.css'

// Geist Sans (--font-geist-sans): fonte principal para UI, headings e body text.
// Geist Mono (--font-geist-mono): para números financeiros, tabelas, Invscore
//   e qualquer dado numérico — usar classe `font-mono` nos elementos.

export const metadata: Metadata = {
  title: {
    default: 'Invística | Inteligência que valoriza',
    template: '%s | Invística',
  },
  description:
    'Plataforma premium de analytics de investimentos com Invscore. Análise fundamentalista com motor proprietário, portfólio analytics e gestão de carteira numa única experiência.',
  keywords: [
    'investimentos',
    'ações',
    'análise fundamentalista',
    'Invscore',
    'portfolio',
    'ações brasileiras',
    'B3',
    'dividendos',
    'analytics',
    'bolsa de valores',
  ],
  authors: [{ name: 'Invística' }],
  creator: 'Invística',
  publisher: 'Invística',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://invistica.com.br'),
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
    url: 'https://invistica.com.br',
    siteName: 'Invística',
    title: 'Invística | Inteligência que valoriza',
    description:
      'Plataforma premium de analytics de investimentos com Invscore.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Invística - Inteligência que valoriza',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Invística',
    description: 'Inteligência que valoriza.',
    images: ['/og-image.png'],
    creator: '@invistica',
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
