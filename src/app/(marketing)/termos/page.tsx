import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos e condições de uso da plataforma aQ-Invest.',
}

const sections = [
  {
    id: 'aceitacao',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    title: 'Aceitação dos Termos',
    content: `Ao acessar ou usar a plataforma aQ-Invest ("Serviço"), você concorda em estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte dos termos, não poderá acessar o Serviço.`,
  },
  {
    id: 'servico',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    title: 'Descrição do Serviço',
    content: `O aQ-Invest é uma plataforma de análise de investimentos que fornece:`,
    list: [
      'Análise fundamentalista de ações listadas na B3',
      'Sistema proprietário de análise (aQ Intelligence™)',
      'Ferramentas de gestão de carteira',
      'Projeções e simulações de dividendos',
      'Alertas e notificações personalizadas',
    ],
  },
  {
    id: 'isencao',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    title: 'Isenção de Responsabilidade',
    highlight: true,
    content: `O aQ-Invest NÃO é uma casa de análise, consultoria de investimentos ou instituição financeira. As informações fornecidas são meramente educacionais e informativas.`,
    extraContent: `O aQ Intelligence™ e todas as análises apresentadas:`,
    list: [
      'NÃO constituem recomendação de compra ou venda de ativos',
      'NÃO garantem rentabilidade futura',
      'NÃO substituem a análise de um profissional certificado',
      'São baseados em dados públicos que podem conter erros ou atrasos',
    ],
    footer: `Investimentos em renda variável envolvem riscos. Você pode perder parte ou todo o capital investido. Sempre consulte um profissional certificado antes de tomar decisões de investimento.`,
  },
  {
    id: 'conta',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: 'Cadastro e Conta',
    content: `Para utilizar certos recursos do Serviço, você deve criar uma conta fornecendo informações precisas e completas. Você é responsável por:`,
    list: [
      'Manter a confidencialidade da sua senha',
      'Todas as atividades realizadas em sua conta',
      'Notificar imediatamente qualquer uso não autorizado',
    ],
  },
  {
    id: 'pagamentos',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    title: 'Planos e Pagamentos',
    content: `O aQ-Invest oferece planos gratuitos e pagos. Para planos pagos:`,
    list: [
      'Os pagamentos são processados de forma segura via Mercado Pago',
      'As assinaturas são renovadas automaticamente',
      'Você pode cancelar a qualquer momento, mantendo o acesso até o fim do período pago',
      'Não há reembolsos para períodos parciais',
    ],
  },
  {
    id: 'propriedade',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Propriedade Intelectual',
    content: `Todo o conteúdo do aQ-Invest, incluindo mas não limitado a textos, gráficos, logos, ícones, imagens, código-fonte e o sistema aQ Intelligence™, são propriedade exclusiva do aQ-Invest e protegidos por leis de propriedade intelectual.`,
  },
  {
    id: 'uso',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
    title: 'Uso Aceitável',
    content: `Você concorda em NÃO:`,
    list: [
      'Usar o Serviço para fins ilegais',
      'Tentar acessar áreas restritas do sistema',
      'Fazer scraping ou coleta automatizada de dados',
      'Redistribuir ou revender o conteúdo do Serviço',
      'Compartilhar sua conta com terceiros',
    ],
  },
  {
    id: 'limitacao',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
    title: 'Limitação de Responsabilidade',
    content: `Em nenhuma circunstância o aQ-Invest será responsável por quaisquer danos diretos, indiretos, incidentais, especiais ou consequentes resultantes do uso ou da incapacidade de usar o Serviço, incluindo perdas financeiras decorrentes de decisões de investimento.`,
  },
  {
    id: 'lei',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: 'Lei Aplicável',
    content: `Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca de São Paulo, SP.`,
  },
]

export default function TermosPage() {
  return (
    <div className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)] text-sm font-medium mb-6">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Documento Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Termos de Uso</h1>
          <p className="text-[var(--text-2)] max-w-2xl mx-auto">
            Leia atentamente os termos e condições que regem o uso da plataforma aQ-Invest.
          </p>
          <p className="text-sm text-[var(--text-2)] mt-4">
            Última atualização: 10 de fevereiro de 2026
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="mb-12 p-6 rounded-[var(--radius)] bg-[var(--surface-1)] border border-[var(--border-1)]">
          <h2 className="text-sm font-semibold text-[var(--text-2)] uppercase tracking-wider mb-4">
            Navegação Rápida
          </h2>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface-2)] hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)] transition-colors"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className={`p-6 md:p-8 rounded-[var(--radius)] border transition-all scroll-mt-24 ${
                section.highlight
                  ? 'bg-gradient-to-br from-amber/5 via-transparent to-red/5 border-amber/30'
                  : 'bg-[var(--surface-1)] border-[var(--border-1)] hover:border-[var(--accent-1)]/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-[var(--radius)] ${
                  section.highlight
                    ? 'bg-amber/10 text-amber'
                    : 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
                }`}>
                  {section.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono text-[var(--text-2)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                  </div>

                  <p className={`leading-relaxed ${
                    section.highlight
                      ? 'text-[var(--text-1)] font-medium'
                      : 'text-[var(--text-2)]'
                  }`}>
                    {section.content}
                  </p>

                  {section.extraContent && (
                    <p className="text-[var(--text-2)] leading-relaxed mt-4">
                      {section.extraContent}
                    </p>
                  )}

                  {section.list && (
                    <ul className="mt-4 space-y-2">
                      {section.list.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            section.highlight ? 'text-amber' : 'text-teal'
                          }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                          </svg>
                          <span className="text-[var(--text-2)]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.footer && (
                    <p className="mt-4 p-4 rounded-[var(--radius)] bg-[var(--surface-2)] text-sm text-[var(--text-2)] border-l-4 border-amber">
                      {section.footer}
                    </p>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 p-8 rounded-[var(--radius)] bg-gradient-to-br from-[var(--accent-1)]/10 via-transparent to-teal/10 border border-[var(--accent-1)]/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 rounded-[var(--radius)] bg-[var(--accent-1)]/10">
              <svg className="w-8 h-8 text-[var(--accent-1)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold mb-1">Dúvidas sobre os termos?</h3>
              <p className="text-[var(--text-2)]">
                Entre em contato conosco pelo e-mail{' '}
                <a href="mailto:contato@aqinvest.com.br" className="text-[var(--accent-1)] hover:underline font-medium">
                  contato@aqinvest.com.br
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-12 pt-8 border-t border-[var(--border-1)]">
          <p className="text-sm text-[var(--text-2)] mb-4">Documentos relacionados:</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/privacidade"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--surface-2)] hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Política de Privacidade
            </Link>
            <Link
              href="/cookies"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--surface-2)] hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
              </svg>
              Política de Cookies
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
