'use client'

import { useState } from 'react'
import Link from 'next/link'

const cookieCategories = [
  {
    id: 'essenciais',
    name: 'Essenciais',
    description: 'Necessários para o funcionamento básico do site. Não podem ser desativados.',
    dotClass: 'bg-teal',
    borderActiveClass: 'border-teal/30',
    codeClass: 'bg-teal/10 text-teal',
    required: true,
    cookies: [
      { name: 'iq-session', purpose: 'Manter sessão de login', duration: '7 dias' },
      { name: 'mp_session', purpose: 'Sessão de pagamento Mercado Pago', duration: '30 min' },
    ],
  },
  {
    id: 'preferencias',
    name: 'Preferências',
    description: 'Lembram suas escolhas e personalizam sua experiência.',
    dotClass: 'bg-[var(--accent-1)]',
    borderActiveClass: 'border-[var(--accent-1)]/30',
    codeClass: 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]',
    required: false,
    cookies: [
      { name: 'theme', purpose: 'Preferência de tema (claro/escuro)', duration: '1 ano' },
      { name: 'sidebar-collapsed', purpose: 'Estado da barra lateral', duration: '1 ano' },
      { name: 'cookie-consent', purpose: 'Suas preferências de cookies', duration: '1 ano' },
    ],
  },
  {
    id: 'analytics',
    name: 'Análise',
    description: 'Nos ajudam a entender como você usa o site para melhorarmos nossos serviços.',
    dotClass: 'bg-amber',
    borderActiveClass: 'border-amber/30',
    codeClass: 'bg-amber/10 text-amber',
    required: false,
    cookies: [
      { name: '_ga', purpose: 'Google Analytics - identificação', duration: '2 anos' },
      { name: '_gid', purpose: 'Google Analytics - sessão', duration: '24 horas' },
      { name: '_gat', purpose: 'Google Analytics - limite de requisições', duration: '1 minuto' },
    ],
  },
]

const browsers = [
  { name: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647', iconPath: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { name: 'Mozilla Firefox', url: 'https://support.mozilla.org/pt-BR/kb/cookies-informacoes-sites-armazenam-no-computador', iconPath: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' },
  { name: 'Safari', url: 'https://support.apple.com/pt-br/guide/safari/sfri11471/mac', iconPath: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z' },
  { name: 'Microsoft Edge', url: 'https://support.microsoft.com/pt-br/microsoft-edge/excluir-cookies-no-microsoft-edge', iconPath: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4l3 3' },
]

export default function CookiesPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('essenciais')

  return (
    <div className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber/10 text-amber text-sm font-medium mb-6">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
              <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
            </svg>
            Transparência
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Política de Cookies</h1>
          <p className="text-[var(--text-2)] max-w-2xl mx-auto">
            Entenda como utilizamos cookies e tecnologias similares para melhorar sua experiência.
          </p>
          <p className="text-sm text-[var(--text-2)] mt-4">
            Última atualização: 10 de fevereiro de 2026
          </p>
        </div>

        {/* What are cookies */}
        <div className="mb-12 p-6 md:p-8 rounded-[var(--radius)] bg-gradient-to-br from-amber/5 via-transparent to-[var(--accent-1)]/5 border border-amber/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-[var(--radius)] bg-amber/10 text-amber">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">O que são Cookies?</h2>
              <p className="text-[var(--text-2)] leading-relaxed">
                Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site.
                Eles são amplamente utilizados para fazer sites funcionarem de forma mais eficiente, manter você
                logado e lembrar suas preferências.
              </p>
            </div>
          </div>
        </div>

        {/* Cookie Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Cookies que Utilizamos</h2>
          <div className="space-y-4">
            {cookieCategories.map((category) => (
              <div
                key={category.id}
                className={`rounded-[var(--radius)] border transition-all ${
                  expandedCategory === category.id
                    ? `${category.borderActiveClass} bg-[var(--surface-1)]`
                    : 'border-[var(--border-1)] bg-[var(--surface-1)] hover:border-[var(--text-2)]/30'
                }`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${category.dotClass}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{category.name}</h3>
                        {category.required && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--surface-2)] text-[var(--text-2)]">
                            Obrigatório
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-2)] mt-0.5">{category.description}</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-[var(--text-2)] transition-transform ${
                      expandedCategory === category.id ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Cookie Table */}
                {expandedCategory === category.id && (
                  <div className="px-5 pb-5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border-1)]">
                            <th className="text-left py-3 font-medium text-[var(--text-2)]">Cookie</th>
                            <th className="text-left py-3 font-medium text-[var(--text-2)]">Finalidade</th>
                            <th className="text-left py-3 font-medium text-[var(--text-2)]">Duração</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.cookies.map((cookie, i) => (
                            <tr key={i} className="border-b border-[var(--border-1)] last:border-0">
                              <td className="py-3">
                                <code className={`px-2 py-1 rounded text-xs ${category.codeClass}`}>
                                  {cookie.name}
                                </code>
                              </td>
                              <td className="py-3 text-[var(--text-2)]">{cookie.purpose}</td>
                              <td className="py-3 text-[var(--text-2)] font-mono text-xs">{cookie.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Third Party Cookies */}
        <div className="mb-12 p-6 md:p-8 rounded-[var(--radius)] bg-[var(--surface-1)] border border-[var(--border-1)]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-[var(--radius)] bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-3">Cookies de Terceiros</h2>
              <p className="text-[var(--text-2)] leading-relaxed mb-4">
                Alguns cookies são definidos por serviços de terceiros que usamos:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="https://www.mercadopago.com.br/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-[var(--radius)] bg-[var(--surface-2)] hover:bg-[var(--accent-1)]/5 border border-[var(--border-1)] hover:border-[var(--accent-1)]/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-[var(--text-2)] group-hover:text-[var(--accent-1)] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <span className="font-medium group-hover:text-[var(--accent-1)] transition-colors">Mercado Pago</span>
                  </div>
                  <p className="text-sm text-[var(--text-2)]">
                    Processamento seguro de pagamentos
                  </p>
                </a>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-[var(--radius)] bg-[var(--surface-2)] hover:bg-[var(--accent-1)]/5 border border-[var(--border-1)] hover:border-[var(--accent-1)]/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-[var(--text-2)] group-hover:text-[var(--accent-1)] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 20V10M12 20V4M6 20v-6" />
                    </svg>
                    <span className="font-medium group-hover:text-[var(--accent-1)] transition-colors">Google Analytics</span>
                  </div>
                  <p className="text-sm text-[var(--text-2)]">
                    Análise de uso (pode ser desativado)
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* How to Manage */}
        <div className="mb-12 p-6 md:p-8 rounded-[var(--radius)] bg-[var(--surface-1)] border border-[var(--border-1)]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-[var(--radius)] bg-teal/10 text-teal">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-3">Como Gerenciar Cookies</h2>
              <p className="text-[var(--text-2)] leading-relaxed mb-6">
                Você pode controlar e/ou excluir cookies nas configurações do seu navegador:
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                {browsers.map((browser) => (
                  <a
                    key={browser.name}
                    href={browser.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-[var(--radius)] bg-[var(--surface-2)] hover:bg-teal/5 border border-[var(--border-1)] hover:border-teal/30 transition-colors text-center group"
                  >
                    <svg className="w-6 h-6 text-[var(--text-2)] group-hover:text-teal transition-colors mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={browser.iconPath} />
                    </svg>
                    <span className="text-sm font-medium group-hover:text-teal transition-colors">{browser.name}</span>
                  </a>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-[var(--radius)] bg-amber/5 border border-amber/20">
                <p className="text-sm text-[var(--text-2)]">
                  <strong className="text-amber">Atenção:</strong> Bloquear cookies pode afetar o funcionamento do site.
                  Você pode precisar fazer login novamente e suas preferências não serão salvas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Opt-out Analytics */}
        <div className="mb-12 p-6 md:p-8 rounded-[var(--radius)] bg-[var(--surface-1)] border border-[var(--border-1)]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-[var(--radius)] bg-red/10 text-red">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Desativar Google Analytics</h2>
              <p className="text-[var(--text-2)] leading-relaxed mb-4">
                Para desativar o Google Analytics em todos os sites, instale o complemento oficial:
              </p>
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-red/10 text-red hover:bg-red/20 transition-colors font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Baixar complemento de opt-out
              </a>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 p-8 rounded-[var(--radius)] bg-gradient-to-br from-amber/10 via-transparent to-teal/10 border border-amber/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 rounded-[var(--radius)] bg-amber/10">
              <svg className="w-8 h-8 text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold mb-1">Dúvidas sobre cookies?</h3>
              <p className="text-[var(--text-2)]">
                Entre em contato conosco pelo e-mail{' '}
                <a href="mailto:privacidade@invistica.com.br" className="text-amber hover:underline font-medium">
                  privacidade@invistica.com.br
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
              href="/termos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--surface-2)] hover:bg-amber/10 hover:text-amber transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Termos de Uso
            </Link>
            <Link
              href="/privacidade"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--surface-2)] hover:bg-amber/10 hover:text-amber transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
