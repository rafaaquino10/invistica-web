'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0F19',
        color: '#F1F5F9',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{
            width: '96px',
            height: '96px',
            margin: '0 auto 2rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Erro crítico
          </h1>

          <p style={{ color: '#94A3B8', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Ocorreu um erro crítico na aplicação. Por favor, tente recarregar a página.
          </p>

          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
              Código: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              backgroundColor: '#1A73E8',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            Tentar novamente
          </button>

          <button
            onClick={() => window.location.href = '/'}
            style={{
              backgroundColor: 'transparent',
              color: '#F1F5F9',
              border: '1px solid #334155',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Ir para Home
          </button>
        </div>
      </body>
    </html>
  )
}
