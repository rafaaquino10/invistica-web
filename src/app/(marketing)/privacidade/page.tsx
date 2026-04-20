import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de privacidade e proteção de dados da plataforma Invística.',
}

const sections = [
  {
    id: 'introducao',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    title: 'Introdução',
    content: `O Invística está comprometido em proteger sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).`,
  },
  {
    id: 'dados-coletados',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: 'Dados que Coletamos',
    subsections: [
      {
        subtitle: 'Dados fornecidos por você',
        items: [
          { label: 'Dados de cadastro', desc: 'nome, e-mail, senha (criptografada)' },
          { label: 'Dados de perfil', desc: 'preferências de investimento, metas financeiras' },
          { label: 'Dados de carteira', desc: 'ativos, quantidades, preços de compra (inseridos por você)' },
          { label: 'Dados de pagamento', desc: 'processados diretamente pelo Mercado Pago, não armazenamos dados de cartão' },
        ],
      },
      {
        subtitle: 'Dados coletados automaticamente',
        items: [
          { label: 'Dados de uso', desc: 'páginas visitadas, funcionalidades utilizadas, tempo de sessão' },
          { label: 'Dados técnicos', desc: 'endereço IP, tipo de navegador, sistema operacional, dispositivo' },
          { label: 'Cookies', desc: 'conforme descrito em nossa Política de Cookies' },
        ],
      },
    ],
  },
  {
    id: 'uso-dados',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Como Usamos seus Dados',
    content: 'Utilizamos seus dados para:',
    list: [
      'Fornecer e melhorar nossos serviços',
      'Personalizar sua experiência na plataforma',
      'Calcular análises e métricas da sua carteira',
      'Enviar alertas e notificações configurados por você',
      'Processar pagamentos de assinaturas',
      'Comunicar atualizações importantes do serviço',
      'Prevenir fraudes e garantir a segurança',
      'Cumprir obrigações legais',
    ],
  },
  {
    id: 'base-legal',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: 'Base Legal para Processamento',
    content: 'Processamos seus dados com base em:',
    cards: [
      { title: 'Execução de contrato', desc: 'Para fornecer os serviços contratados', bgClass: 'bg-[var(--accent-1)]/5 border-[var(--accent-1)]/20', titleClass: 'text-[var(--accent-1)]' },
      { title: 'Consentimento', desc: 'Para comunicações de marketing (pode retirar a qualquer momento)', bgClass: 'bg-teal/5 border-teal/20', titleClass: 'text-teal' },
      { title: 'Interesse legítimo', desc: 'Para melhorar nossos serviços e prevenir fraudes', bgClass: 'bg-amber/5 border-amber/20', titleClass: 'text-amber' },
      { title: 'Obrigação legal', desc: 'Para cumprir requisitos regulatórios', bgClass: 'bg-red/5 border-red/20', titleClass: 'text-red' },
    ],
  },
  {
    id: 'compartilhamento',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
    title: 'Compartilhamento de Dados',
    highlight: true,
    content: 'Não vendemos seus dados. Compartilhamos informações apenas com:',
    list: [
      { bold: 'Mercado Pago:', text: 'para processamento seguro de pagamentos' },
      { bold: 'Provedores de infraestrutura:', text: 'servidores e banco de dados (com contratos de proteção de dados)' },
      { bold: 'Autoridades:', text: 'quando exigido por lei ou ordem judicial' },
    ],
  },
  {
    id: 'seguranca',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: 'Segurança dos Dados',
    content: 'Implementamos medidas técnicas e organizacionais para proteger seus dados:',
    grid: [
      { text: 'Criptografia HTTPS/TLS', iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
      { text: 'Senhas com bcrypt', iconPath: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4' },
      { text: 'Autenticação JWT', iconPath: 'M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3M8 12h8' },
      { text: 'Monitoramento contínuo', iconPath: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
      { text: 'Backups criptografados', iconPath: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
      { text: 'Acesso restrito', iconPath: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM4.93 4.93l14.14 14.14' },
    ],
  },
  {
    id: 'retencao',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Retenção de Dados',
    content: 'Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento:',
    timeline: [
      { period: '30 dias', desc: 'Dados da conta são excluídos' },
      { period: '5 anos', desc: 'Dados de transações financeiras (obrigação legal)' },
      { period: '1 ano', desc: 'Logs de segurança' },
      { period: '∞', desc: 'Dados anonimizados para estatísticas' },
    ],
  },
  {
    id: 'direitos',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    ),
    title: 'Seus Direitos (LGPD)',
    content: 'Você tem direito a:',
    rights: [
      { title: 'Confirmação e acesso', desc: 'Saber se tratamos seus dados e acessá-los' },
      { title: 'Correção', desc: 'Corrigir dados incompletos, inexatos ou desatualizados' },
      { title: 'Anonimização ou eliminação', desc: 'Solicitar exclusão de dados desnecessários' },
      { title: 'Portabilidade', desc: 'Receber seus dados em formato estruturado' },
      { title: 'Revogação', desc: 'Retirar consentimento a qualquer momento' },
      { title: 'Informação', desc: 'Saber com quem compartilhamos seus dados' },
    ],
  },
]

export default function PrivacidadePage() {
  return (
    <div className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal/10 text-teal text-sm font-medium mb-6">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            LGPD Compliant
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-[var(--text-2)] max-w-2xl mx-auto">
            Sua privacidade é importante para nós. Saiba como coletamos, usamos e protegemos suas informações.
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
                className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface-2)] hover:bg-teal/10 hover:text-teal transition-colors"
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
                  ? 'bg-gradient-to-br from-teal/5 via-transparent to-[var(--accent-1)]/5 border-teal/30'
                  : 'bg-[var(--surface-1)] border-[var(--border-1)] hover:border-teal/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-[var(--radius)] ${
                  section.highlight
                    ? 'bg-teal/10 text-teal'
                    : 'bg-teal/10 text-teal'
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

                  {section.content && (
                    <p className={`leading-relaxed ${
                      section.highlight
                        ? 'text-[var(--text-1)] font-medium'
                        : 'text-[var(--text-2)]'
                    }`}>
                      {section.content}
                    </p>
                  )}

                  {/* Subsections for data collection */}
                  {section.subsections && (
                    <div className="mt-6 grid md:grid-cols-2 gap-4">
                      {section.subsections.map((sub, i) => (
                        <div key={i} className="p-4 rounded-[var(--radius)] bg-[var(--surface-2)]">
                          <h3 className="font-medium mb-3 text-sm">{sub.subtitle}</h3>
                          <ul className="space-y-2">
                            {sub.items.map((item, j) => (
                              <li key={j} className="text-sm">
                                <span className="font-medium text-[var(--text-1)]">{item.label}:</span>{' '}
                                <span className="text-[var(--text-2)]">{item.desc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Simple list */}
                  {section.list && !section.highlight && (
                    <ul className="mt-4 grid md:grid-cols-2 gap-2">
                      {section.list.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[var(--text-2)]">
                          <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{typeof item === 'string' ? item : <><strong className="text-[var(--text-1)]">{(item as any).bold}</strong> {(item as any).text}</>}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Highlighted list with bold labels */}
                  {section.list && section.highlight && (
                    <ul className="mt-4 space-y-3">
                      {section.list.map((item: any, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-[var(--text-2)]">
                            <strong className="text-[var(--text-1)]">{item.bold}</strong> {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Cards for legal basis */}
                  {section.cards && (
                    <div className="mt-6 grid sm:grid-cols-2 gap-3">
                      {section.cards.map((card: any, i: number) => (
                        <div key={i} className={`p-4 rounded-[var(--radius)] border ${card.bgClass}`}>
                          <h3 className={`font-medium mb-1 ${card.titleClass}`}>{card.title}</h3>
                          <p className="text-sm text-[var(--text-2)]">{card.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Security grid */}
                  {section.grid && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {section.grid.map((item: any, i: number) => (
                        <div key={i} className="p-4 rounded-[var(--radius)] bg-[var(--surface-2)] flex items-center gap-3">
                          <svg className="w-5 h-5 text-teal flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d={item.iconPath} />
                          </svg>
                          <span className="text-sm text-[var(--text-2)]">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timeline for retention */}
                  {section.timeline && (
                    <div className="mt-6 space-y-3">
                      {section.timeline.map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-20 text-right">
                            <span className="font-mono font-bold text-teal">{item.period}</span>
                          </div>
                          <div className="w-3 h-3 rounded-full bg-teal flex-shrink-0" />
                          <span className="text-[var(--text-2)]">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rights grid */}
                  {section.rights && (
                    <div className="mt-6 grid sm:grid-cols-2 gap-3">
                      {section.rights.map((right, i) => (
                        <div key={i} className="p-4 rounded-[var(--radius)] bg-[var(--surface-2)] border border-[var(--border-1)]">
                          <h3 className="font-medium text-teal mb-1">{right.title}</h3>
                          <p className="text-sm text-[var(--text-2)]">{right.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 p-8 rounded-[var(--radius)] bg-gradient-to-br from-teal/10 via-transparent to-[var(--accent-1)]/10 border border-teal/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 rounded-[var(--radius)] bg-teal/10">
              <svg className="w-8 h-8 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold mb-1">Encarregado de Dados (DPO)</h3>
              <p className="text-[var(--text-2)]">
                Para exercer seus direitos ou tirar dúvidas sobre privacidade:{' '}
                <a href="mailto:privacidade@invistica.com.br" className="text-teal hover:underline font-medium">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--surface-2)] hover:bg-teal/10 hover:text-teal transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Termos de Uso
            </Link>
            <Link
              href="/cookies"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--surface-2)] hover:bg-teal/10 hover:text-teal transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              Política de Cookies
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
