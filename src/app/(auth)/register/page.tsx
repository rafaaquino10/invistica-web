import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from './register-form'
import { SocialLoginButtons } from '../login/social-buttons'
import { Button } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Criar Conta',
  description: 'Crie sua conta gratuita na Invística',
}

export default function RegisterPage() {
  return (
    <div>
      <div className="text-center mb-5">
        <h1 className="text-2xl font-bold">Crie sua conta</h1>
        <p className="text-[var(--text-2)] mt-2">
          Comece grátis - Sem cartão de crédito
        </p>
      </div>

      {/* Social Login */}
      <SocialLoginButtons callbackUrl="/onboarding" />

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-1)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--bg)] text-[var(--text-2)]">
            ou crie com email
          </span>
        </div>
      </div>

      {/* Email Form */}
      <RegisterForm />

      {/* Demo */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-1)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--bg)] text-[var(--text-2)]">
            ou experimente sem cadastro
          </span>
        </div>
      </div>

      <a href="/api/auth/demo?callbackUrl=%2Fdashboard">
        <Button variant="secondary" className="w-full" type="button">
          Entrar como Demo
        </Button>
      </a>

      <p className="mt-4 text-center text-xs text-[var(--text-2)]">
        Ao criar uma conta, você concorda com nossos{' '}
        <Link href="/termos" className="text-[var(--accent-1)] hover:underline">
          Termos de Uso
        </Link>{' '}
        e{' '}
        <Link href="/privacidade" className="text-[var(--accent-1)] hover:underline">
          Política de Privacidade
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-[var(--text-2)]">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-[var(--accent-1)] hover:underline font-medium">
          Entrar
        </Link>
      </p>
    </div>
  )
}
