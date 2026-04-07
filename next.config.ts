import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_DEMO_MODE: process.env['NODE_ENV'] !== 'production' ? 'true' : (process.env['DATABASE_URL'] ? 'false' : 'true'),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'brapi.dev',
      },
      {
        protocol: 'https',
        hostname: '*.brapi.dev',
      },
      {
        protocol: 'https',
        hostname: 'icons.brapi.dev',
      },
    ],
  },
  experimental: {
    // typedRoutes disabled — causes excessive HMR rebuilds in dev mode
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

// Only wrap with Sentry if DSN is configured
const sentryConfig = {
  silent: true, // Suppress Sentry build logs
  disableServerWebpackPlugin: !process.env['SENTRY_DSN'],
  disableClientWebpackPlugin: !process.env['NEXT_PUBLIC_SENTRY_DSN'],
  hideSourceMaps: true,
  widenClientFileUpload: true,
}

export default withSentryConfig(nextConfig, sentryConfig)
