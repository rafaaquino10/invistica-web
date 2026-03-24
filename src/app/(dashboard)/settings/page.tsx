'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { FontSizeToggle } from '@/components/layout/font-size-toggle'
import { Button, Input, Badge, DataCard } from '@/components/ui'
import { cn } from '@/lib/utils'
// Profile via Supabase auth, preferences via localStorage

type TabType = 'profile' | 'preferences' | 'notifications' | 'billing'

export default function SettingsPage() {
  const { user: authUser } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  const tabs: { id: TabType; label: string }[] = [
    { id: 'profile', label: 'Perfil' },
    { id: 'preferences', label: 'Preferências' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'billing', label: 'Assinatura' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Configurações</h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-px border-b border-[var(--border-1)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-[var(--text-body)] font-medium transition-colors relative',
              activeTab === tab.id
                ? 'text-[var(--text-1)]'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-1)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && <ProfileTab session={authUser ? { user: authUser } : null} />}
        {activeTab === 'preferences' && <PreferencesTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'billing' && <BillingTab />}
      </div>
    </div>
  )
}

// ===========================================
// Profile Tab
// ===========================================

function ProfileTab({ session }: { session: any }) {
  const { update, logout } = useAuth()
  const user = session?.user

  const [editName, setEditName] = useState(user?.name ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (user?.name) {
      setEditName(user.name)
    }
  }, [user?.name])

  const hasChanged = editName.trim() !== (user?.name ?? '') && editName.trim().length > 0

  const handleSave = useCallback(async () => {
    if (!hasChanged || isSaving) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      // Update via Supabase auth metadata
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.updateUser({ data: { full_name: editName.trim() } })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch {
      // Error is handled by tRPC mutation state
    } finally {
      setIsSaving(false)
    }
  }, [editName, hasChanged, isSaving, update, updateProfile])

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? 'U'

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Profile section */}
      <DataCard title="Perfil" subtitle="Informações da sua conta">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-[var(--radius)] bg-[var(--accent-1)]/10 text-[var(--accent-1)] flex items-center justify-center text-[var(--text-subheading)] font-bold font-display flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--text-small)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-1">Nome</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Seu nome"
                  className="h-8 text-[var(--text-body)] font-sans"
                />
              </div>
              <div>
                <label className="block text-[var(--text-small)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-1">Email</label>
                <Input defaultValue={user?.email ?? ''} disabled className="h-8 text-[var(--text-body)] font-sans" />
              </div>
            </div>
            {user?.createdAt && (
              <p className="text-[var(--text-caption)] text-[var(--text-3)]">
                Membro desde <span className="font-mono">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
              </p>
            )}
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                className="text-[var(--text-caption)]"
                disabled={!hasChanged || isSaving}
                onClick={handleSave}
              >
                {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </DataCard>

      {/* Logout section */}
      <DataCard title="Sessão">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--text-body)] font-sans font-medium">Sair da conta</p>
            <p className="text-[var(--text-caption)] text-[var(--text-2)]">Encerrar sessão atual</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => logout()}
            className="text-[var(--text-caption)] border border-[var(--neg)]/20 text-[var(--neg)] hover:bg-[var(--neg)]/10"
          >
            Sair
          </Button>
        </div>
      </DataCard>
    </div>
  )
}

// ===========================================
// Preferences Tab
// ===========================================

function PreferencesTab() {
  return (
    <div className="space-y-4 max-w-2xl">
      {/* Aparência com Preview de Tema */}
      <DataCard title="Aparência" noPadding>
        <div className="divide-y divide-[var(--border-1)]">
          {/* Theme Preview Cards */}
          <div className="px-4 py-3">
            <p className="text-[var(--text-body)] font-sans font-medium mb-2">Tema</p>
            <ThemePreview />
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[var(--text-body)] font-sans font-medium">Tamanho da Fonte</p>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Compacto, Normal ou Maior</p>
            </div>
            <FontSizeToggle />
          </div>
        </div>
      </DataCard>

      {/* Preferências de Investimento */}
      <InvestmentPreferences />
    </div>
  )
}

// ===========================================
// Notifications Tab
// ===========================================

function NotificationsTab() {
  const isLoading = false
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('investiq-email-notifications')
    if (stored !== null) setEmailEnabled(stored === 'true')
  }, [])

  const handleToggle = async () => {
    const newValue = !emailEnabled
    setEmailEnabled(newValue)
    try {
      localStorage.setItem('investiq-email-notifications', String(newValue))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setEmailEnabled(!newValue) // Reverter
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl">
        <div className="panel panel-body animate-pulse space-y-3">
          <div className="h-4 w-40 bg-[var(--surface-2)] rounded" />
          <div className="h-3 w-64 bg-[var(--surface-2)] rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <DataCard title="Relatório Semanal" subtitle="Receba um resumo semanal da sua carteira e do mercado por email">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-body)] font-sans font-medium">Relatório por email</p>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">
                Enviado toda sexta-feira com análise da carteira, alertas e insights
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={updateNotifications.isPending}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-1)]',
                emailEnabled ? 'bg-[var(--accent-1)]' : 'bg-[var(--surface-3)]'
              )}
              role="switch"
              aria-checked={emailEnabled}
              aria-label="Ativar relatório semanal por email"
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                  emailEnabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {saved && (
            <p className="text-[var(--text-caption)] text-[var(--pos)] font-medium">
              Preferência salva com sucesso!
            </p>
          )}

          {emailEnabled && (
            <div className="px-3 py-2 rounded-lg bg-[var(--surface-2)]">
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">
                O relatório inclui: patrimônio da carteira, rentabilidade, alertas de saída, score movers e insights de mercado.
                Todos os dados são reais e atualizados no momento do envio.
              </p>
            </div>
          )}

          {!prefs?.hasEmail && (
            <div className="px-3 py-2 rounded-lg bg-[var(--warn)]/10 border border-[var(--warn)]/20">
              <p className="text-[var(--text-caption)] text-[var(--warn)]">
                Cadastre um email na sua conta para receber relatórios.
              </p>
            </div>
          )}
        </div>
      </DataCard>

      <DataCard title="Alertas" subtitle="Notificações sobre mudanças importantes">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[var(--text-body)] font-sans font-medium">Alertas de score</p>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Quando o score de um ativo da carteira cai mais de 10 pontos</p>
            </div>
            <Badge variant="outline" size="sm">Em breve</Badge>
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[var(--text-body)] font-sans font-medium">Fatos relevantes</p>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Quando a CVM publica fato relevante de um ativo na carteira</p>
            </div>
            <Badge variant="outline" size="sm">Em breve</Badge>
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[var(--text-body)] font-sans font-medium">Kill switch ativado</p>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Quando o motor detecta risco crítico em ativo da carteira</p>
            </div>
            <Badge variant="outline" size="sm">Em breve</Badge>
          </div>
        </div>
      </DataCard>

      <div className="text-[var(--text-caption)] text-[var(--text-3)] px-1">
        Todos os emails incluem link para cancelar inscrição. Você pode desativar a qualquer momento.
      </div>
    </div>
  )
}

// ===========================================
// Billing Tab
// ===========================================

function BillingTab() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [cancelling, setCancelling] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/mercadopago/manage')
      .then((res) => res.json())
      .then((data) => {
        setSubscriptionStatus(data.status ?? 'none')
        setUserPlan(data.plan ?? 'free')
      })
      .catch(() => {
        setSubscriptionStatus('none')
        setError('Erro ao carregar dados da assinatura')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) return
    setCancelling(true)
    try {
      const res = await fetch('/api/mercadopago/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (res.ok) {
        setUserPlan('free')
        setSubscriptionStatus('cancelled')
      }
    } catch {
      setError('Erro ao cancelar assinatura. Tente novamente.')
    } finally {
      setCancelling(false)
    }
  }

  const isPaid = userPlan === 'pro' || userPlan === 'elite'
  const planLabel = userPlan === 'elite' ? 'Premium' : userPlan === 'pro' ? 'Pro' : 'Gratuito'

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="panel panel-body">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 bg-[var(--surface-2)] rounded" />
            <div className="h-3 w-48 bg-[var(--surface-2)] rounded" />
            <div className="h-12 bg-[var(--surface-2)] rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {error && (
        <div className="px-3 py-2 rounded-lg bg-[var(--neg)]/10 border border-[var(--neg)]/20 text-[var(--neg)] text-[var(--text-body)]">
          {error}
        </div>
      )}

      {/* Current Plan */}
      <DataCard
        title="Plano Atual"
        action={
          !isPaid ? (
            <Link href="/pricing">
              <Button variant="primary" size="sm" className="text-[var(--text-caption)]">Fazer Upgrade</Button>
            </Link>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
              className="text-[var(--text-caption)]"
            >
              {cancelling ? 'Cancelando...' : 'Cancelar'}
            </Button>
          )
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-body)] font-sans font-semibold">Plano {planLabel}</span>
            <Badge variant={isPaid ? 'primary' : 'outline'} size="sm">
              {userPlan === 'free' ? 'Free' : userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
            </Badge>
          </div>
          <p className="text-[var(--text-caption)] text-[var(--text-2)]">
            {isPaid ? 'Assinatura ativa' : 'Acesso limitado aos recursos básicos'}
          </p>
          <div className="px-3 py-2 rounded-lg bg-[var(--surface-2)]">
            <p className="text-[var(--text-caption)] font-medium text-[var(--text-2)] mb-1.5">Recursos incluídos:</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {(isPaid
                ? ['Explorer completo', 'IQ-Score ilimitado', 'Todas as funcionalidades']
                : ['Até 3 portfólios', 'Explorer básico', 'Até 5 alertas']
              ).map((f) => (
                <span key={f} className="flex items-center gap-1.5 text-[var(--text-caption)] text-[var(--text-2)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--pos)] flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DataCard>

      {/* Manage Externally */}
      {isPaid && (
        <DataCard title="Pagamento">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-body)] font-sans font-medium">Gerenciar pagamento</p>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">
                Acesse o Mercado Pago para alterar método de pagamento
              </p>
            </div>
            <a href="https://www.mercadopago.com.br/subscriptions" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" className="text-[var(--text-caption)]">Mercado Pago</Button>
            </a>
          </div>
        </DataCard>
      )}

      {/* Payment History */}
      <DataCard title="Histórico de Pagamentos">
        <PaymentHistory />
      </DataCard>
    </div>
  )
}

// ===========================================
// Theme Preview
// ===========================================

function ThemePreview() {
  const [currentTheme, setCurrentTheme] = useState<string>('system')

  useEffect(() => {
    const stored = localStorage.getItem('theme') ?? 'system'
    setCurrentTheme(stored)
  }, [])

  const applyTheme = (theme: string) => {
    setCurrentTheme(theme)
    localStorage.setItem('theme', theme)
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }

  const themes = [
    { id: 'light', label: 'Claro', bg: '#FAFAFA', text: '#1a1a2e', accent: '#0D9488', surface: '#FFFFFF' },
    { id: 'dark', label: 'Escuro', bg: '#0a0a1a', text: '#e4e4f0', accent: '#0D9488', surface: '#12122a' },
    { id: 'system', label: 'Sistema', bg: 'linear-gradient(135deg, #FAFAFA 50%, #0a0a1a 50%)', text: '#888', accent: '#0D9488', surface: '' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map(t => (
        <button
          key={t.id}
          onClick={() => applyTheme(t.id)}
          className={cn(
            'rounded-lg border-2 p-3 transition-all text-left',
            currentTheme === t.id
              ? 'border-[var(--accent-1)] ring-1 ring-[var(--accent-1)]/20'
              : 'border-[var(--border-1)] hover:border-[var(--border-1)]'
          )}
        >
          {/* Mini preview */}
          <div
            className="rounded-md h-16 mb-2 flex flex-col justify-end p-2 overflow-hidden"
            style={{ background: t.bg }}
          >
            {t.id !== 'system' && (
              <>
                <div className="h-1.5 w-8 rounded-full mb-1" style={{ backgroundColor: t.accent }} />
                <div className="h-1 w-12 rounded-full" style={{ backgroundColor: t.text, opacity: 0.3 }} />
                <div className="h-1 w-6 rounded-full mt-0.5" style={{ backgroundColor: t.text, opacity: 0.2 }} />
              </>
            )}
            {t.id === 'system' && (
              <p className="text-[10px] font-mono text-center" style={{ color: '#888' }}>Auto</p>
            )}
          </div>
          <p className="text-[var(--text-small)] font-medium">{t.label}</p>
        </button>
      ))}
    </div>
  )
}

// ===========================================
// Investment Preferences
// ===========================================

const PROFILES = [
  { id: 'conservador', label: 'Conservador', desc: 'Prioriza segurança e dividendos' },
  { id: 'moderado', label: 'Moderado', desc: 'Equilíbrio entre risco e retorno' },
  { id: 'agressivo', label: 'Agressivo', desc: 'Busca alto crescimento' },
]

const MODES = [
  { id: 'dividendos', label: 'Dividendos' },
  { id: 'valor', label: 'Value' },
  { id: 'crescimento', label: 'Growth' },
  { id: 'defensivo', label: 'Defensivo' },
  { id: 'momento', label: 'Momento' },
]

const SECTORS = [
  'Bancos', 'Tecnologia da Informação', 'Energia Elétrica', 'Petróleo',
  'Mineração', 'Varejo', 'Saúde', 'Construção Civil', 'Saneamento',
  'Alimentos e Bebidas', 'Telecomunicações', 'Transporte',
]

function InvestmentPreferences() {
  const [profile, setProfile] = useState(() => localStorage.getItem('pref_profile') ?? 'moderado')
  const [mode, setMode] = useState(() => localStorage.getItem('pref_mode') ?? 'valor')
  const [selectedSectors, setSelectedSectors] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pref_sectors') ?? '[]') } catch { return [] }
  })
  const [saved, setSaved] = useState(false)

  const toggleSector = (s: string) => {
    setSelectedSectors(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const handleSave = () => {
    localStorage.setItem('pref_profile', profile)
    localStorage.setItem('pref_mode', mode)
    localStorage.setItem('pref_sectors', JSON.stringify(selectedSectors))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <DataCard title="Preferências de Investimento" subtitle="Alimentam o Motor Recomenda">
      <div className="space-y-4">
        {/* Perfil de risco */}
        <div>
          <label className="block text-[var(--text-small)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-2">Perfil de Risco</label>
          <div className="grid grid-cols-3 gap-2">
            {PROFILES.map(p => (
              <button
                key={p.id}
                onClick={() => setProfile(p.id)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition-all',
                  profile === p.id
                    ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/10'
                    : 'border-[var(--border-1)] hover:border-[var(--border-1)]'
                )}
              >
                <p className="text-[var(--text-small)] font-medium">{p.label}</p>
                <p className="text-[var(--text-caption)] text-[var(--text-2)]">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Modo preferido */}
        <div>
          <label className="block text-[var(--text-small)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-2">Modo Preferido</label>
          <div className="flex flex-wrap gap-2">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[var(--text-small)] font-medium transition-all',
                  mode === m.id
                    ? 'bg-[var(--accent-1)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-1)]'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Setores de interesse */}
        <div>
          <label className="block text-[var(--text-small)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-2">Setores de Interesse</label>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map(s => (
              <button
                key={s}
                onClick={() => toggleSector(s)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[var(--text-caption)] font-medium transition-all',
                  selectedSectors.includes(s)
                    ? 'bg-[var(--accent-1)]/15 text-[var(--accent-1)] border border-[var(--accent-1)]/30'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] border border-transparent hover:border-[var(--border-1)]'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" size="sm" className="text-[var(--text-caption)]" onClick={handleSave}>
            {saved ? 'Salvo!' : 'Salvar Preferências'}
          </Button>
        </div>
      </div>
    </DataCard>
  )
}

// ===========================================
// Payment History
// ===========================================

function PaymentHistory() {
  const [payments, setPayments] = useState<Array<{ date: string; plan: string; amount: number; status: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Buscar histórico de pagamentos (WebhookEvent ou fallback vazio)
    fetch('/api/mercadopago/manage?history=true')
      .then(res => res.json())
      .then(data => {
        if (data.payments && Array.isArray(data.payments)) {
          setPayments(data.payments)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="py-4 flex justify-center">
        <div className="w-5 h-5 border-2 border-[var(--accent-1)]/30 border-t-[var(--accent-1)] rounded-full animate-spin" />
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-4 text-[var(--text-2)]">
        <p className="text-[var(--text-body)] font-sans">Nenhum pagamento registrado</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[var(--text-small)]">
        <thead>
          <tr className="border-b border-[var(--border-1)]">
            <th className="text-left py-2.5 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Data</th>
            <th className="text-left py-2.5 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Plano</th>
            <th className="text-right py-2.5 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Valor</th>
            <th className="text-right py-2.5 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-1)]/50">
          {payments.map((p, i) => (
            <tr key={i}>
              <td className="py-3 font-mono">{new Date(p.date).toLocaleDateString('pt-BR')}</td>
              <td className="py-3">{p.plan}</td>
              <td className="py-3 text-right font-mono">R$ {p.amount.toFixed(2)}</td>
              <td className="py-3 text-right">
                <span className={cn(
                  'px-2 py-0.5 rounded text-[var(--text-caption)] font-medium',
                  p.status === 'paid' ? 'bg-green-500/15 text-green-500' : 'bg-amber-500/15 text-amber-500'
                )}>
                  {p.status === 'paid' ? 'Pago' : p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
