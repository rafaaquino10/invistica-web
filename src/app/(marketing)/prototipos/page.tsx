'use client'

import { useState } from 'react'

// ─── 3 Paletas para escolha visual ──────────────────────────

const PALETTES = [
  {
    id: 'teal',
    name: 'Teal Neon',
    description: 'Verde-água neon — positivo, sofisticado, destaque forte',
    bg: '#0B0E14',
    surface: '#111520',
    surface2: '#1A1F2E',
    border: '#232A3B',
    text1: '#E8EAF0',
    text2: '#8B93A5',
    text3: '#555D70',
    accent: '#00D4AA',
    accentBg: 'rgba(0, 212, 170, 0.08)',
    pos: '#00D4AA',
    neg: '#FF4757',
    warn: '#FFBE0B',
    score: { exceptional: '#00FFD1', healthy: '#00D4AA', attention: '#FFBE0B', critical: '#FF4757' },
  },
  {
    id: 'blue',
    name: 'Electric Blue',
    description: 'Azul elétrico — profissional, confiável, institucional',
    bg: '#0B0E14',
    surface: '#111520',
    surface2: '#1A1F2E',
    border: '#232A3B',
    text1: '#E8EAF0',
    text2: '#8B93A5',
    text3: '#555D70',
    accent: '#3B82F6',
    accentBg: 'rgba(59, 130, 246, 0.08)',
    pos: '#22C55E',
    neg: '#EF4444',
    warn: '#F59E0B',
    score: { exceptional: '#60A5FA', healthy: '#22C55E', attention: '#F59E0B', critical: '#EF4444' },
  },
  {
    id: 'gold',
    name: 'Amber Gold',
    description: 'Dourado premium — exclusivo, associação com riqueza',
    bg: '#0B0E14',
    surface: '#111520',
    surface2: '#1A1F2E',
    border: '#232A3B',
    text1: '#E8EAF0',
    text2: '#8B93A5',
    text3: '#555D70',
    accent: '#F59E0B',
    accentBg: 'rgba(245, 158, 11, 0.08)',
    pos: '#22C55E',
    neg: '#EF4444',
    warn: '#F59E0B',
    score: { exceptional: '#FCD34D', healthy: '#22C55E', attention: '#FB923C', critical: '#EF4444' },
  },
]

// ─── Dados mock para os protótipos ──────────────────────────

const MOCK_POSITIONS = [
  { ticker: 'WEGE3', name: 'WEG S.A.', score: 88, price: 52.30, change: 1.8, weight: 22, sector: 'Bens de Capital', dy: '1.2%', fairValue: 61.40, margin: 17.4 },
  { ticker: 'ITUB4', name: 'Itaú Unibanco', score: 82, price: 33.12, change: 0.5, weight: 18, sector: 'Financeiro', dy: '7.8%', fairValue: 42.80, margin: 29.2 },
  { ticker: 'TAEE11', name: 'Taesa', score: 79, price: 11.45, change: -0.3, weight: 15, sector: 'Utilities', dy: '9.2%', fairValue: 14.20, margin: 24.0 },
  { ticker: 'PETR4', name: 'Petrobras', score: 72, price: 38.90, change: -1.2, weight: 14, sector: 'Commodities', dy: '8.5%', fairValue: 45.00, margin: 15.7 },
  { ticker: 'PRIO3', name: 'PetroRio', score: 69, price: 46.10, change: 2.1, weight: 12, sector: 'Commodities', dy: '2.1%', fairValue: 52.30, margin: 13.4 },
  { ticker: 'BBSE3', name: 'BB Seguridade', score: 77, price: 35.90, change: 0.8, weight: 10, sector: 'Financeiro', dy: '6.5%', fairValue: 41.50, margin: 15.6 },
  { ticker: 'MGLU3', name: 'Magazine Luiza', score: 28, price: 8.45, change: -3.2, weight: 5, sector: 'Consumo', dy: '0%', fairValue: 5.20, margin: -38.5 },
  { ticker: 'RENT3', name: 'Localiza', score: 65, price: 42.80, change: 0.2, weight: 4, sector: 'Consumo', dy: '1.8%', fairValue: 48.00, margin: 12.1 },
]

const MOCK_SIGNALS = [
  { action: 'buy', ticker: 'ITUB4', reason: 'IQ 82 + Margem 29% + DY 7.8%', score: 82 },
  { action: 'buy', ticker: 'BBSE3', reason: 'Valuation atrativo + DY sustentável', score: 77 },
  { action: 'hold', ticker: 'WEGE3', reason: 'Qualidade excepcional, valuation esticado', score: 88 },
  { action: 'sell', ticker: 'MGLU3', reason: 'IQ 28 + Margem -38% + Risco alto', score: 28 },
  { action: 'rotate', ticker: 'PETR4', reason: 'Regime RISK_OFF desfavorece commodities', score: 72 },
]

// ─── Componente de Protótipo ────────────────────────────────

function DashboardPrototype({ p }: { p: typeof PALETTES[0] }) {
  const scoreColor = (s: number) => s >= 80 ? p.score.exceptional : s >= 60 ? p.score.healthy : s >= 40 ? p.score.attention : p.score.critical
  const actionColor = (a: string) => a === 'buy' ? p.pos : a === 'sell' ? p.neg : a === 'rotate' ? p.warn : p.text3
  const actionLabel = (a: string) => a === 'buy' ? 'COMPRA' : a === 'sell' ? 'VENDA' : a === 'rotate' ? 'ROTAÇÃO' : 'HOLD'

  return (
    <div style={{ background: p.bg, color: p.text1, fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', borderRadius: 12, overflow: 'hidden', border: `1px solid ${p.border}` }}>

      {/* Header bar */}
      <div style={{ background: p.surface, borderBottom: `1px solid ${p.border}`, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: p.bg }}>IQ</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.5 }}>InvestIQ</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: p.text3 }}>
          <span>SELIC <span style={{ color: p.text1, fontFamily: 'monospace', fontWeight: 700 }}>14.25%</span></span>
          <span>IPCA <span style={{ color: p.text1, fontFamily: 'monospace', fontWeight: 700 }}>4.21%</span></span>
          <span>USD <span style={{ color: p.text1, fontFamily: 'monospace', fontWeight: 700 }}>R$5.68</span></span>
          <span style={{ padding: '2px 8px', borderRadius: 4, background: `${p.pos}15`, color: p.pos, fontWeight: 700 }}>RISK_ON</span>
        </div>
      </div>

      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: 16 }}>

        {/* KPI Strip */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
          {[
            { label: 'Patrimônio', value: 'R$ 127.450', color: p.text1 },
            { label: 'Resultado', value: '+R$ 18.230', sub: '+18.7%', color: p.pos },
            { label: 'IQ Médio', value: '76', color: p.accent },
            { label: 'Posições', value: '8', color: p.text1 },
            { label: 'DY Carteira', value: '5.8%', color: p.pos },
          ].map(k => (
            <div key={k.label} style={{ flex: 1, background: p.surface, borderRadius: 8, padding: '12px 16px', border: `1px solid ${p.border}` }}>
              <div style={{ fontSize: 10, color: p.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: k.color, lineHeight: 1 }}>{k.value}</div>
              {k.sub && <div style={{ fontSize: 11, fontFamily: 'monospace', color: k.color, marginTop: 2 }}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* Positions table */}
        <div style={{ gridColumn: '1 / 3', background: p.surface, borderRadius: 8, border: `1px solid ${p.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${p.border}`, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: p.text3 }}>Posições</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${p.border}`, color: p.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 600 }}>Ativo</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Preço</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Dia</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600 }}>IQ Score</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Fair Value</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Margem</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>DY</th>
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 600 }}>Peso</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_POSITIONS.map(pos => (
                <tr key={pos.ticker} style={{ borderBottom: `1px solid ${p.border}20` }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{pos.ticker}</div>
                    <div style={{ fontSize: 10, color: p.text3 }}>{pos.name}</div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600 }}>R${pos.price.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600, color: pos.change >= 0 ? p.pos : p.neg }}>{pos.change >= 0 ? '+' : ''}{pos.change.toFixed(1)}%</td>
                  <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: scoreColor(pos.score) }}>{pos.score}</span>
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', fontFamily: 'monospace', color: p.text2 }}>R${pos.fairValue.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600, color: pos.margin > 0 ? p.pos : p.neg }}>{pos.margin > 0 ? '+' : ''}{pos.margin.toFixed(1)}%</td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', fontFamily: 'monospace', color: p.text2 }}>{pos.dy}</td>
                  <td style={{ textAlign: 'right', padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: p.surface2, overflow: 'hidden' }}>
                        <div style={{ width: `${pos.weight}%`, height: '100%', background: p.accent, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: p.text2, width: 28, textAlign: 'right' }}>{pos.weight}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signal Card */}
        <div style={{ background: p.surface, borderRadius: 8, border: `1px solid ${p.border}`, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: p.text3, marginBottom: 12 }}>Motor Estratégico</div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: p.pos }} />
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>2</span>
              <span style={{ fontSize: 10, color: p.text3 }}>compra</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: p.neg }} />
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>1</span>
              <span style={{ fontSize: 10, color: p.text3 }}>venda</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: p.warn }} />
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>1</span>
              <span style={{ fontSize: 10, color: p.text3 }}>rotação</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, padding: '10px 0', borderTop: `1px solid ${p.border}`, borderBottom: `1px solid ${p.border}`, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: p.text3, textTransform: 'uppercase' }}>Confiança</div>
              <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 800, color: p.pos }}>78%</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: p.text3, textTransform: 'uppercase' }}>Vol Stress</div>
              <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 800, color: p.text1 }}>0.94x</div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MOCK_SIGNALS.map(s => (
              <div key={s.ticker} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: `${actionColor(s.action)}15`, color: actionColor(s.action) }}>
                  {actionLabel(s.action)}
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{s.ticker}</span>
                <span style={{ fontSize: 10, color: p.text3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página de Protótipos ───────────────────────────────────

export default function PrototiposPage() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div style={{ background: '#050508', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          InvestIQ — Protótipos de Paleta Dark Premium
        </h1>
        <p style={{ color: '#8B93A5', fontSize: 14, marginBottom: 40 }}>
          3 variações de accent color. Mesmo layout, mesmos dados. Escolha a que mais combina com a identidade do InvestIQ.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {PALETTES.map(p => (
            <div key={p.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: p.accent }} />
                <div>
                  <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>{p.name}</h2>
                  <p style={{ color: '#8B93A5', fontSize: 12, margin: 0 }}>{p.description} — Accent: {p.accent}</p>
                </div>
                <button
                  onClick={() => setSelected(p.id)}
                  style={{
                    marginLeft: 'auto',
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: selected === p.id ? `2px solid ${p.accent}` : '2px solid #333',
                    background: selected === p.id ? `${p.accent}20` : 'transparent',
                    color: selected === p.id ? p.accent : '#8B93A5',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {selected === p.id ? 'Selecionado' : 'Selecionar'}
                </button>
              </div>
              <DashboardPrototype p={p} />
            </div>
          ))}
        </div>

        {selected && (
          <div style={{ marginTop: 48, padding: 24, background: '#111520', borderRadius: 12, border: '1px solid #232A3B', textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>
              Paleta selecionada: {PALETTES.find(p => p.id === selected)?.name}
            </p>
            <p style={{ color: '#8B93A5', fontSize: 13, marginTop: 4 }}>
              Accent: {PALETTES.find(p => p.id === selected)?.accent}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
