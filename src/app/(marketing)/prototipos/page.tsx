'use client'

import { useState } from 'react'

// ─── 3 Temas visuais completos ──────────────────────────────

interface Theme {
  id: string
  name: string
  tagline: string
  // Colors
  bg: string; surface: string; surface2: string; border: string
  text1: string; text2: string; text3: string
  accent: string; accentSoft: string
  pos: string; neg: string; warn: string
  scoreHigh: string; scoreMid: string; scoreLow: string
  // Typography
  fontBody: string; fontMono: string
  headingWeight: number; headingTracking: string
  bodySize: number; captionSize: number; monoSize: number
  // Shape
  radius: number; radiusSm: number; radiusLg: number
  borderWidth: number; borderStyle: string
  cardPadding: number; cardGap: number
  // Effects
  glowAccent: string; glowPos: string
  shadowCard: string
  // KPI style
  kpiValueSize: number; kpiLabelSize: number
  // Table
  rowHeight: number; cellPadding: string
  headerBg: string; headerBorder: string
  rowHover: string
  // Score display
  scoreFontSize: number; scoreStyle: 'pill' | 'bar' | 'dot'
}

const THEMES: Theme[] = [
  // ═══ TEMA 1: TERMINAL ═══════════════════════════════════════
  // Bloomberg-inspired. Ultra denso, borders definidas, monospace dominante.
  {
    id: 'terminal',
    name: 'Terminal',
    tagline: 'Bloomberg meets fintech — densidade máxima, dados no comando',
    bg: '#0A0C10', surface: '#0F1218', surface2: '#161B24', border: '#1E2533',
    text1: '#D4D8E0', text2: '#7A8294', text3: '#4A5168',
    accent: '#00D4AA', accentSoft: 'rgba(0,212,170,0.06)',
    pos: '#00E5B8', neg: '#FF3B5C', warn: '#FFB020',
    scoreHigh: '#00FFD1', scoreMid: '#FFB020', scoreLow: '#FF3B5C',
    fontBody: "'Geist Sans', system-ui, sans-serif", fontMono: "'Geist Mono', 'SF Mono', monospace",
    headingWeight: 800, headingTracking: '-0.03em',
    bodySize: 12, captionSize: 10, monoSize: 12,
    radius: 4, radiusSm: 2, radiusLg: 6,
    borderWidth: 1, borderStyle: 'solid',
    cardPadding: 12, cardGap: 8,
    glowAccent: '0 0 20px rgba(0,212,170,0.08)', glowPos: '0 0 12px rgba(0,229,184,0.1)',
    shadowCard: 'none',
    kpiValueSize: 22, kpiLabelSize: 9,
    rowHeight: 36, cellPadding: '8px 12px',
    headerBg: '#0D1017', headerBorder: '#1E2533',
    rowHover: 'rgba(0,212,170,0.03)',
    scoreFontSize: 15, scoreStyle: 'bar',
  },
  // ═══ TEMA 2: VAULT ══════════════════════════════════════════
  // Premium banking. Bordas suaves, dourado sutil, tipografia elegante.
  {
    id: 'vault',
    name: 'Vault',
    tagline: 'Private banking digital — exclusividade e sofisticação',
    bg: '#09090B', surface: '#111113', surface2: '#1A1A1E', border: '#27272A',
    text1: '#FAFAFA', text2: '#A1A1AA', text3: '#52525B',
    accent: '#D4A853', accentSoft: 'rgba(212,168,83,0.06)',
    pos: '#4ADE80', neg: '#F87171', warn: '#FBBF24',
    scoreHigh: '#D4A853', scoreMid: '#FBBF24', scoreLow: '#F87171',
    fontBody: "'Geist Sans', system-ui, sans-serif", fontMono: "'Geist Mono', 'SF Mono', monospace",
    headingWeight: 600, headingTracking: '-0.01em',
    bodySize: 13, captionSize: 10, monoSize: 12,
    radius: 10, radiusSm: 6, radiusLg: 14,
    borderWidth: 1, borderStyle: 'solid',
    cardPadding: 20, cardGap: 12,
    glowAccent: '0 0 30px rgba(212,168,83,0.06)', glowPos: 'none',
    shadowCard: '0 2px 12px rgba(0,0,0,0.3)',
    kpiValueSize: 24, kpiLabelSize: 10,
    rowHeight: 44, cellPadding: '12px 16px',
    headerBg: '#0E0E10', headerBorder: '#27272A',
    rowHover: 'rgba(212,168,83,0.03)',
    scoreFontSize: 16, scoreStyle: 'pill',
  },
  // ═══ TEMA 3: NEON ═══════════════════════════════════════════
  // Arrojado, tech-forward. Bordas glow, gradientes sutis, visual impactante.
  {
    id: 'neon',
    name: 'Neon',
    tagline: 'Tech-forward — arrojado, impactante, inovador',
    bg: '#06070A', surface: '#0C0E14', surface2: '#13161F', border: '#1C2030',
    text1: '#E8ECF4', text2: '#8892A8', text3: '#505870',
    accent: '#6366F1', accentSoft: 'rgba(99,102,241,0.06)',
    pos: '#34D399', neg: '#FB7185', warn: '#FBBF24',
    scoreHigh: '#818CF8', scoreMid: '#FBBF24', scoreLow: '#FB7185',
    fontBody: "'Geist Sans', system-ui, sans-serif", fontMono: "'Geist Mono', 'SF Mono', monospace",
    headingWeight: 700, headingTracking: '-0.02em',
    bodySize: 12, captionSize: 10, monoSize: 12,
    radius: 8, radiusSm: 4, radiusLg: 12,
    borderWidth: 1, borderStyle: 'solid',
    cardPadding: 16, cardGap: 10,
    glowAccent: '0 0 24px rgba(99,102,241,0.12)', glowPos: '0 0 16px rgba(52,211,153,0.08)',
    shadowCard: '0 4px 24px rgba(0,0,0,0.4)',
    kpiValueSize: 22, kpiLabelSize: 9,
    rowHeight: 40, cellPadding: '10px 14px',
    headerBg: '#090B10', headerBorder: '#1C2030',
    rowHover: 'rgba(99,102,241,0.04)',
    scoreFontSize: 15, scoreStyle: 'dot',
  },
]

// ─── Mock data ──────────────────────────────────────────────

const POSITIONS = [
  { ticker: 'WEGE3', name: 'WEG', score: 88, price: 52.30, change: 1.8, weight: 22, dy: '1.2%', fv: 61.40, margin: 17.4 },
  { ticker: 'ITUB4', name: 'Itaú', score: 82, price: 33.12, change: 0.5, weight: 18, dy: '7.8%', fv: 42.80, margin: 29.2 },
  { ticker: 'TAEE11', name: 'Taesa', score: 79, price: 11.45, change: -0.3, weight: 15, dy: '9.2%', fv: 14.20, margin: 24.0 },
  { ticker: 'PETR4', name: 'Petrobras', score: 72, price: 38.90, change: -1.2, weight: 14, dy: '8.5%', fv: 45.00, margin: 15.7 },
  { ticker: 'BBSE3', name: 'BB Seg', score: 77, price: 35.90, change: 0.8, weight: 12, dy: '6.5%', fv: 41.50, margin: 15.6 },
  { ticker: 'PRIO3', name: 'PetroRio', score: 69, price: 46.10, change: 2.1, weight: 10, dy: '2.1%', fv: 52.30, margin: 13.4 },
  { ticker: 'MGLU3', name: 'Magalu', score: 28, price: 8.45, change: -3.2, weight: 5, dy: '0%', fv: 5.20, margin: -38.5 },
  { ticker: 'RENT3', name: 'Localiza', score: 65, price: 42.80, change: 0.2, weight: 4, dy: '1.8%', fv: 48.00, margin: 12.1 },
]

const SIGNALS = [
  { action: 'buy', ticker: 'ITUB4', reason: 'Margem 29% + DY 7.8%', score: 82 },
  { action: 'buy', ticker: 'BBSE3', reason: 'Valuation atrativo', score: 77 },
  { action: 'hold', ticker: 'WEGE3', reason: 'Qualidade excepcional', score: 88 },
  { action: 'sell', ticker: 'MGLU3', reason: 'IQ 28 + Risco alto', score: 28 },
  { action: 'rotate', ticker: 'PETR4', reason: 'Regime desfavorece', score: 72 },
]

// ─── Score component per theme style ────────────────────────

function ScoreDisplay({ score, t }: { score: number; t: Theme }) {
  const color = score >= 75 ? t.scoreHigh : score >= 45 ? t.scoreMid : t.scoreLow

  if (t.scoreStyle === 'pill') {
    return (
      <span style={{ fontFamily: t.fontMono, fontWeight: 800, fontSize: t.scoreFontSize, color, background: `${color}12`, padding: '3px 10px', borderRadius: t.radiusSm, border: `1px solid ${color}20` }}>
        {score}
      </span>
    )
  }

  if (t.scoreStyle === 'dot') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}60` }} />
        <span style={{ fontFamily: t.fontMono, fontWeight: 800, fontSize: t.scoreFontSize, color }}>{score}</span>
      </span>
    )
  }

  // bar (terminal)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 70 }}>
      <span style={{ fontFamily: t.fontMono, fontWeight: 800, fontSize: t.scoreFontSize, color, width: 26, textAlign: 'right' }}>{score}</span>
      <span style={{ flex: 1, height: 3, background: t.surface2, borderRadius: 1, overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${score}%`, background: color, borderRadius: 1 }} />
      </span>
    </span>
  )
}

// ─── Full dashboard per theme ───────────────────────────────

function FullDashboard({ t }: { t: Theme }) {
  const actionColor = (a: string) => a === 'buy' ? t.pos : a === 'sell' ? t.neg : a === 'rotate' ? t.warn : t.text3
  const actionLabel = (a: string) => a === 'buy' ? 'COMPRA' : a === 'sell' ? 'VENDA' : a === 'rotate' ? 'ROTAÇÃO' : 'HOLD'

  return (
    <div style={{ background: t.bg, color: t.text1, fontFamily: t.fontBody, fontSize: t.bodySize, borderRadius: t.radiusLg, overflow: 'hidden', border: `${t.borderWidth}px ${t.borderStyle} ${t.border}`, boxShadow: t.shadowCard }}>

      {/* ── Header ── */}
      <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: `10px ${t.cardPadding + 4}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: t.radiusSm + 2, background: `linear-gradient(135deg, ${t.accent}, ${t.pos})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: t.bg, fontFamily: t.fontMono }}>IQ</div>
          <span style={{ fontWeight: t.headingWeight, fontSize: 15, letterSpacing: t.headingTracking }}>InvestIQ</span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: t.captionSize, color: t.text3 }}>
          <span>SELIC <span style={{ color: t.text1, fontFamily: t.fontMono, fontWeight: 700 }}>14.25%</span></span>
          <span>IPCA <span style={{ color: t.text1, fontFamily: t.fontMono, fontWeight: 700 }}>4.21%</span></span>
          <span>USD <span style={{ color: t.text1, fontFamily: t.fontMono, fontWeight: 700 }}>R$5.68</span></span>
          <span style={{ padding: '2px 8px', borderRadius: t.radiusSm, background: `${t.pos}12`, color: t.pos, fontWeight: 800, fontSize: 9, letterSpacing: 0.5 }}>RISK_ON</span>
        </div>
      </div>

      <div style={{ padding: t.cardPadding + 4, display: 'grid', gridTemplateColumns: '1fr 300px', gap: t.cardGap + 4 }}>

        {/* ── KPI Strip ── */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: t.cardGap }}>
          {[
            { label: 'PATRIMÔNIO', value: 'R$ 127.450', color: t.text1 },
            { label: 'RESULTADO', value: '+R$ 18.230', sub: '+18.7%', color: t.pos },
            { label: 'IQ MÉDIO', value: '76', color: t.accent },
            { label: 'POSIÇÕES', value: '8', color: t.text1 },
            { label: 'DY CARTEIRA', value: '5.8%', color: t.pos },
          ].map(k => (
            <div key={k.label} style={{ background: t.surface, borderRadius: t.radius, padding: `${t.cardPadding}px`, border: `${t.borderWidth}px ${t.borderStyle} ${t.border}`, boxShadow: t.glowAccent !== 'none' && k.label === 'IQ MÉDIO' ? t.glowAccent : 'none' }}>
              <div style={{ fontSize: t.kpiLabelSize, color: t.text3, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: t.kpiValueSize, fontWeight: 800, fontFamily: t.fontMono, color: k.color, lineHeight: 1, letterSpacing: t.headingTracking }}>{k.value}</div>
              {k.sub && <div style={{ fontSize: 11, fontFamily: t.fontMono, color: k.color, marginTop: 3 }}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── Positions ── */}
        <div style={{ background: t.surface, borderRadius: t.radius, border: `${t.borderWidth}px ${t.borderStyle} ${t.border}`, overflow: 'hidden' }}>
          <div style={{ padding: `10px ${t.cardPadding}px`, borderBottom: `1px solid ${t.border}`, background: t.headerBg }}>
            <span style={{ fontSize: t.kpiLabelSize, fontWeight: 700, letterSpacing: 1.2, color: t.text3 }}>POSIÇÕES</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.headerBorder}`, background: t.headerBg }}>
                  {['ATIVO', 'PREÇO', 'DIA', 'IQ', 'FAIR VALUE', 'MARGEM', 'DY', 'PESO'].map((h, i) => (
                    <th key={h} style={{ padding: t.cellPadding, fontSize: t.captionSize, fontWeight: 700, color: t.text3, letterSpacing: 0.8, textAlign: i === 0 ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {POSITIONS.map(p => (
                  <tr key={p.ticker} style={{ borderBottom: `1px solid ${t.border}15`, height: t.rowHeight }} onMouseOver={e => (e.currentTarget.style.background = t.rowHover)} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: t.cellPadding, whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: t.fontMono, fontWeight: 700, fontSize: t.monoSize + 1 }}>{p.ticker}</span>
                      <span style={{ marginLeft: 8, fontSize: t.captionSize, color: t.text3 }}>{p.name}</span>
                    </td>
                    <td style={{ padding: t.cellPadding, textAlign: 'right', fontFamily: t.fontMono, fontWeight: 600 }}>R${p.price.toFixed(2)}</td>
                    <td style={{ padding: t.cellPadding, textAlign: 'right', fontFamily: t.fontMono, fontWeight: 700, color: p.change >= 0 ? t.pos : t.neg }}>
                      {p.change >= 0 ? '+' : ''}{p.change.toFixed(1)}%
                    </td>
                    <td style={{ padding: t.cellPadding, textAlign: 'right' }}>
                      <ScoreDisplay score={p.score} t={t} />
                    </td>
                    <td style={{ padding: t.cellPadding, textAlign: 'right', fontFamily: t.fontMono, color: t.text2 }}>R${p.fv.toFixed(2)}</td>
                    <td style={{ padding: t.cellPadding, textAlign: 'right', fontFamily: t.fontMono, fontWeight: 700, color: p.margin > 0 ? t.pos : t.neg }}>
                      {p.margin > 0 ? '+' : ''}{p.margin.toFixed(1)}%
                    </td>
                    <td style={{ padding: t.cellPadding, textAlign: 'right', fontFamily: t.fontMono, color: t.text2 }}>{p.dy}</td>
                    <td style={{ padding: t.cellPadding, textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 36, height: 3, borderRadius: 1, background: t.surface2, overflow: 'hidden' }}>
                          <div style={{ width: `${p.weight}%`, height: '100%', background: t.accent, borderRadius: 1 }} />
                        </div>
                        <span style={{ fontFamily: t.fontMono, fontSize: t.captionSize, color: t.text3 }}>{p.weight}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Signal Card ── */}
        <div style={{ background: t.surface, borderRadius: t.radius, border: `${t.borderWidth}px ${t.borderStyle} ${t.border}`, padding: t.cardPadding, display: 'flex', flexDirection: 'column', boxShadow: t.shadowCard }}>
          <div style={{ fontSize: t.kpiLabelSize, fontWeight: 700, letterSpacing: 1.2, color: t.text3, marginBottom: 14 }}>MOTOR ESTRATÉGICO</div>

          {/* Confidence block */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${t.border}` }}>
            <div>
              <div style={{ fontSize: 8, color: t.text3, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>CONFIANÇA</div>
              <div style={{ fontSize: 28, fontFamily: t.fontMono, fontWeight: 800, color: t.pos, lineHeight: 1, letterSpacing: t.headingTracking }}>78<span style={{ fontSize: 14, color: t.text3 }}>%</span></div>
            </div>
            <div>
              <div style={{ fontSize: 8, color: t.text3, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>VOL STRESS</div>
              <div style={{ fontSize: 28, fontFamily: t.fontMono, fontWeight: 800, color: t.text1, lineHeight: 1, letterSpacing: t.headingTracking }}>0.94<span style={{ fontSize: 14, color: t.text3 }}>x</span></div>
            </div>
          </div>

          {/* Counters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {[
              { n: 2, label: 'compra', color: t.pos },
              { n: 1, label: 'venda', color: t.neg },
              { n: 1, label: 'rotação', color: t.warn },
              { n: 1, label: 'hold', color: t.text3 },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.color }} />
                <span style={{ fontFamily: t.fontMono, fontWeight: 800, fontSize: 13, color: t.text1 }}>{c.n}</span>
                <span style={{ fontSize: 9, color: t.text3 }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Signal list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SIGNALS.map(s => (
              <div key={s.ticker} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${t.border}10` }}>
                <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: t.radiusSm, background: `${actionColor(s.action)}12`, color: actionColor(s.action), letterSpacing: 0.5, minWidth: 52, textAlign: 'center' }}>
                  {actionLabel(s.action)}
                </span>
                <span style={{ fontFamily: t.fontMono, fontWeight: 700, fontSize: 12, minWidth: 48 }}>{s.ticker}</span>
                <span style={{ fontSize: 10, color: t.text3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.reason}</span>
                <ScoreDisplay score={s.score} t={t} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ───────────────────────────────────────

export default function PrototiposPage() {
  const [active, setActive] = useState(0)
  const t = THEMES[active]!

  return (
    <div style={{ background: '#030305', minHeight: '100vh' }}>
      {/* Theme selector — sticky top */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#030305', borderBottom: '1px solid #1A1A1A', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>Escolha o tema:</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {THEMES.map((theme, i) => (
              <button
                key={theme.id}
                onClick={() => setActive(i)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: active === i ? `2px solid ${theme.accent}` : '2px solid #222',
                  background: active === i ? `${theme.accent}10` : 'transparent',
                  color: active === i ? theme.accent : '#777',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ width: 12, height: 12, borderRadius: 3, background: theme.accent }} />
                {theme.name}
              </button>
            ))}
          </div>
          <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto' }}>{t.tagline}</span>
        </div>
      </div>

      {/* Active theme — full dashboard */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 60px' }}>
        <FullDashboard t={t} />
      </div>
    </div>
  )
}
