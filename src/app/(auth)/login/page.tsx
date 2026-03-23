import Link from 'next/link'
import { Button } from '@/components/ui'
import { SocialLoginButtons } from './social-buttons'

export const metadata = {
  title: 'Entrar',
  description: 'Faça login na sua conta aQ-Invest',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const params = await searchParams
  const callbackUrl = params?.callbackUrl || '/dashboard'
  const error = params?.error

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
        <p className="text-[var(--text-2)] mt-2">
          Entre na sua conta para continuar
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red/10 border border-red/20 text-red text-sm">
          {error === 'OAuthAccountNotLinked'
            ? 'Este email já está vinculado a outro método de login. Tente outro provedor.'
            : error === 'OAuthCallbackError'
            ? 'Erro ao processar login social. Tente novamente.'
            : error === 'OAuthConfigError'
            ? 'Provedor de login não configurado.'
            : 'Ocorreu um erro ao fazer login. Tente novamente.'}
        </div>
      )}

      {/* Social Login */}
      <SocialLoginButtons callbackUrl={callbackUrl} />

      {/* Demo Login */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-1)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--bg)] text-[var(--text-2)]">
            ou experimente sem cadastro
          </span>
        </div>
      </div>

      <div className="p-4 rounded-[var(--radius)] bg-gradient-to-r from-[var(--accent-1)]/10 to-teal/10 border border-[var(--accent-1)]/20">
        <a href={`/api/auth/demo?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          <Button
            variant="secondary"
            className="w-full"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Entrar como Demo
          </Button>
        </a>
        <p className="text-xs text-center text-[var(--text-2)] mt-2">
          Acesso completo sem cadastro para testar a plataforma
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--text-2)]">
        Não tem uma conta?{' '}
        <Link href="/register" className="text-[var(--accent-1)] hover:underline font-medium">
          Criar conta grátis
        </Link>
      </p>
    </div>
  )
}
