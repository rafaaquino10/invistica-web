'use client'

import { useState } from 'react'

/*
 ╔══════════════════════════════════════════════════════════════╗
 ║  InvestIQ — Protótipo de Design "911"                       ║
 ║                                                              ║
 ║  Filosofia: Porsche 911                                      ║
 ║  - Performance pura, design atemporal                        ║
 ║  - Engenharia visível — cada detalhe tem propósito           ║
 ║  - Elegante mas agressivo quando precisa                     ║
 ║  - Você sente o poder antes de pisar no acelerador           ║
 ╚══════════════════════════════════════════════════════════════╝
*/

// ─── Dados mock ─────────────────────────────────────────────

const P = [
  { tk: 'WEGE3', nm: 'WEG', sc: 88, pr: 52.30, ch: 1.8, w: 22, dy: 1.2, fv: 61.40, mg: 17.4, rat: 'STRONG_BUY', q: 95, v: 35, r: 92 },
  { tk: 'ITUB4', nm: 'Itaú', sc: 82, pr: 33.12, ch: 0.5, w: 18, dy: 7.8, fv: 42.80, mg: 29.2, rat: 'STRONG_BUY', q: 80, v: 72, r: 85 },
  { tk: 'TAEE11', nm: 'Taesa', sc: 79, pr: 11.45, ch: -0.3, w: 15, dy: 9.2, fv: 14.20, mg: 24.0, rat: 'BUY', q: 78, v: 68, r: 90 },
  { tk: 'PETR4', nm: 'Petrobras', sc: 72, pr: 38.90, ch: -1.2, w: 14, dy: 8.5, fv: 45.00, mg: 15.7, rat: 'BUY', q: 65, v: 82, r: 55 },
  { tk: 'BBSE3', nm: 'BB Seg', sc: 77, pr: 35.90, ch: 0.8, w: 12, dy: 6.5, fv: 41.50, mg: 15.6, rat: 'BUY', q: 82, v: 75, r: 85 },
  { tk: 'PRIO3', nm: 'PetroRio', sc: 69, pr: 46.10, ch: 2.1, w: 10, dy: 2.1, fv: 52.30, mg: 13.4, rat: 'HOLD', q: 68, v: 70, r: 60 },
  { tk: 'MGLU3', nm: 'Magalu', sc: 28, pr: 8.45, ch: -3.2, w: 5, dy: 0, fv: 5.20, mg: -38.5, rat: 'AVOID', q: 28, v: 55, r: 25 },
  { tk: 'RENT3', nm: 'Localiza', sc: 65, pr: 42.80, ch: 0.2, w: 4, dy: 1.8, fv: 48.00, mg: 12.1, rat: 'HOLD', q: 85, v: 48, r: 80 },
]

const SIG = [
  { a: 'buy', tk: 'ITUB4', r: 'Margem 29% + DY 7.8% + Score crescente', sc: 82 },
  { a: 'buy', tk: 'BBSE3', r: 'Valuation atrativo + dividend safety 88', sc: 77 },
  { a: 'hold', tk: 'WEGE3', r: 'Qualidade excepcional, valuation esticado', sc: 88 },
  { a: 'sell', tk: 'MGLU3', r: 'IQ 28 + Merton PD >15% + Margem -38%', sc: 28 },
  { a: 'rotate', tk: 'PETR4', r: 'Regime RISK_OFF desfavorece commodities', sc: 72 },
]

// ─── Colors ─────────────────────────────────────────────────

const C = {
  bg: '#07080C',
  s1: '#0C0E14',
  s2: '#12151E',
  s3: '#1A1E2A',
  border: '#1F2436',
  borderLight: '#2A3048',
  t1: '#E4E8F0',
  t2: '#8890A4',
  t3: '#505870',
  accent: '#00C9A7',
  accentDim: '#00C9A720',
  pos: '#00E0B0',
  neg: '#FF3860',
  warn: '#FFB830',
  // score gradient
  exc: '#00FFD4',
  good: '#00C9A7',
  att: '#FFB830',
  crit: '#FF3860',
  // glass
  glass: 'rgba(14,16,24,0.65)',
  glassBorder: 'rgba(255,255,255,0.04)',
  glassHover: 'rgba(255,255,255,0.02)',
}

const sc = (v: number) => v >= 80 ? C.exc : v >= 60 ? C.good : v >= 40 ? C.att : C.crit
const ratC = (r: string) => r.includes('BUY') ? C.pos : r === 'HOLD' ? C.t2 : r === 'AVOID' ? C.neg : C.warn
const actC = (a: string) => a === 'buy' ? C.pos : a === 'sell' ? C.neg : a === 'rotate' ? C.warn : C.t3
const actL = (a: string) => a === 'buy' ? 'COMPRA' : a === 'sell' ? 'VENDA' : a === 'rotate' ? 'ROTAÇÃO' : 'HOLD'

// ─── Micro components ───────────────────────────────────────

function ScoreArc({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const pct = score / 100
  const offset = circ * (1 - pct * 0.75) // 270deg arc
  const color = sc(score)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-225deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.s3} strokeWidth={3} strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray={`${circ * 0.75 * pct} ${circ}`} style={{ filter: `drop-shadow(0 0 4px ${color}40)`, transition: 'all 0.6s ease' }} />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Geist Mono', monospace", fontWeight: 800, fontSize: size * 0.32, color, letterSpacing: '-0.03em' }}>
        {score}
      </span>
    </div>
  )
}

function MiniPillarBar({ label, value }: { label: string; value: number }) {
  const color = sc(value)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 14, fontSize: 8, color: C.t3, fontWeight: 600, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: 2, background: C.s3, borderRadius: 1, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 1, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ width: 18, fontSize: 9, fontFamily: "'Geist Mono', monospace", fontWeight: 700, color, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────

export default function PrototiposPage() {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const totalValue = 127450
  const totalReturn = 18.7

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.t1, fontFamily: "'Geist Sans', system-ui", fontSize: 12 }}>

      {/* ═══ TOP BAR ═══ */}
      <div style={{
        background: C.glass,
        backdropFilter: 'blur(20px) saturate(1.4)',
        borderBottom: `1px solid ${C.glassBorder}`,
        padding: '0 24px',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: `linear-gradient(135deg, ${C.accent}, #009E82)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Geist Mono', monospace", fontWeight: 900, fontSize: 10, color: '#000',
          }}>IQ</div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.03em' }}>
            Invest<span style={{ color: C.accent }}>IQ</span>
          </span>
          <div style={{ width: 1, height: 20, background: C.border, margin: '0 8px' }} />
          <span style={{ fontSize: 10, color: C.t3, fontWeight: 600, letterSpacing: 0.5 }}>DASHBOARD</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 10 }}>
          {[
            { l: 'SELIC', v: '14.25%' },
            { l: 'IPCA', v: '4.21%' },
            { l: 'USD', v: 'R$5.68' },
            { l: 'BRENT', v: '$78.40' },
          ].map(m => (
            <span key={m.l} style={{ color: C.t3 }}>
              {m.l} <span style={{ color: C.t1, fontFamily: "'Geist Mono', monospace", fontWeight: 700 }}>{m.v}</span>
            </span>
          ))}
          <div style={{
            padding: '3px 10px', borderRadius: 4, fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
            background: `${C.pos}10`, color: C.pos, border: `1px solid ${C.pos}20`,
          }}>
            RISK_ON
          </div>
        </div>
      </div>

      {/* ═══ MAIN GRID ═══ */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 24px 60px' }}>

        {/* ── Row 1: Patrimônio hero + KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>

          {/* Main KPI — patrimônio com glow */}
          <div style={{
            gridColumn: '1 / 3',
            background: `linear-gradient(135deg, ${C.s1} 0%, ${C.s2} 100%)`,
            borderRadius: 10, padding: '20px 24px',
            border: `1px solid ${C.glassBorder}`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Ambient glow */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `${C.accent}06`, filter: 'blur(40px)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 9, color: C.t3, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>PATRIMÔNIO TOTAL</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Geist Mono', monospace", letterSpacing: '-0.04em', lineHeight: 1 }}>
                  R$ 127.450
                </span>
                <span style={{ fontSize: 16, fontFamily: "'Geist Mono', monospace", fontWeight: 700, color: C.pos }}>
                  +18.7%
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <span style={{ fontSize: 10, color: C.t3 }}>vs CDI <span style={{ color: C.pos, fontFamily: "'Geist Mono', monospace", fontWeight: 700 }}>+6.2pp</span></span>
                <span style={{ fontSize: 10, color: C.t3 }}>vs IBOV <span style={{ color: C.pos, fontFamily: "'Geist Mono', monospace", fontWeight: 700 }}>+9.8pp</span></span>
              </div>
            </div>
          </div>

          {/* IQ Score da carteira */}
          <div style={{ background: C.s1, borderRadius: 10, padding: 20, border: `1px solid ${C.glassBorder}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 9, color: C.t3, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>IQ SCORE MÉDIO</div>
            <ScoreArc score={76} size={64} />
          </div>

          {/* Motor status */}
          <div style={{ background: C.s1, borderRadius: 10, padding: 20, border: `1px solid ${C.glassBorder}` }}>
            <div style={{ fontSize: 9, color: C.t3, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>MOTOR IQ-COGNIT</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 8, color: C.t3, marginBottom: 2 }}>CONFIANÇA</div>
                <div style={{ fontSize: 24, fontFamily: "'Geist Mono', monospace", fontWeight: 800, color: C.pos, lineHeight: 1 }}>78%</div>
              </div>
              <div>
                <div style={{ fontSize: 8, color: C.t3, marginBottom: 2 }}>VOL STRESS</div>
                <div style={{ fontSize: 24, fontFamily: "'Geist Mono', monospace", fontWeight: 800, color: C.t1, lineHeight: 1 }}>0.94x</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              {[{ n: 2, l: 'buy', c: C.pos }, { n: 1, l: 'sell', c: C.neg }, { n: 1, l: 'rot', c: C.warn }, { n: 1, l: 'hold', c: C.t3 }].map(s => (
                <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9 }}>
                  <div style={{ width: 4, height: 4, borderRadius: 2, background: s.c }} />
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 800 }}>{s.n}</span>
                  <span style={{ color: C.t3 }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: Positions + Signals ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12 }}>

          {/* Positions — glass card */}
          <div style={{
            background: C.glass,
            backdropFilter: 'blur(12px)',
            borderRadius: 10,
            border: `1px solid ${C.glassBorder}`,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: C.t3 }}>POSIÇÕES</span>
              <span style={{ fontSize: 10, color: C.t3 }}>{P.length} ativos</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['ATIVO', 'PREÇO', 'DIA', 'IQ', 'RATING', 'FAIR VALUE', 'MARGEM', 'DY', 'PESO'].map((h, i) => (
                    <th key={h} style={{
                      padding: '8px 14px', fontSize: 9, fontWeight: 700, color: C.t3,
                      letterSpacing: 1, textAlign: i === 0 ? 'left' : 'right',
                      background: C.s1,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {P.map(p => {
                  const isHovered = hoveredRow === p.tk
                  return (
                    <tr
                      key={p.tk}
                      onMouseEnter={() => setHoveredRow(p.tk)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: `1px solid ${C.border}08`,
                        background: isHovered ? C.glassHover : 'transparent',
                        transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Score micro-arc */}
                          <ScoreArc score={p.sc} size={30} />
                          <div>
                            <div style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em' }}>{p.tk}</div>
                            <div style={{ fontSize: 9, color: C.t3, marginTop: 1 }}>{p.nm}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'Geist Mono', monospace", fontWeight: 600 }}>R${p.pr.toFixed(2)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'Geist Mono', monospace", fontWeight: 700, color: p.ch >= 0 ? C.pos : C.neg }}>
                        {p.ch >= 0 ? '+' : ''}{p.ch.toFixed(1)}%
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 800, fontSize: 14, color: sc(p.sc), textShadow: `0 0 8px ${sc(p.sc)}20` }}>{p.sc}</span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: `${ratC(p.rat)}10`, color: ratC(p.rat), letterSpacing: 0.3 }}>
                          {p.rat.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'Geist Mono', monospace", color: C.t2 }}>R${p.fv.toFixed(2)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'Geist Mono', monospace", fontWeight: 700, color: p.mg > 0 ? C.pos : C.neg }}>
                        {p.mg > 0 ? '+' : ''}{p.mg.toFixed(1)}%
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'Geist Mono', monospace", color: p.dy > 5 ? C.pos : C.t2 }}>{p.dy.toFixed(1)}%</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 32, height: 3, borderRadius: 1, background: C.s3, overflow: 'hidden' }}>
                            <div style={{ width: `${p.w}%`, height: '100%', background: `linear-gradient(90deg, ${C.accent}80, ${C.accent})`, borderRadius: 1 }} />
                          </div>
                          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, color: C.t3, width: 22, textAlign: 'right' }}>{p.w}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Signals — glass card */}
          <div style={{
            background: C.glass,
            backdropFilter: 'blur(12px)',
            borderRadius: 10,
            border: `1px solid ${C.glassBorder}`,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: C.t3, marginBottom: 16 }}>SINAIS DO MOTOR</div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {SIG.map(s => (
                <div key={s.tk} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderRadius: 6, transition: 'background 0.15s',
                  background: 'transparent',
                }} onMouseEnter={e => e.currentTarget.style.background = C.glassHover}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{
                    fontSize: 8, fontWeight: 800, padding: '3px 8px', borderRadius: 3,
                    background: `${actC(s.a)}10`, color: actC(s.a),
                    letterSpacing: 0.5, minWidth: 56, textAlign: 'center',
                    border: `1px solid ${actC(s.a)}15`,
                  }}>
                    {actL(s.a)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 700, fontSize: 12 }}>{s.tk}</div>
                    <div style={{ fontSize: 9, color: C.t3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{s.r}</div>
                  </div>
                  <ScoreArc score={s.sc} size={28} />
                </div>
              ))}
            </div>

            {/* Pillar breakdown example */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: C.t3, marginBottom: 10 }}>PILARES — ITUB4</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <MiniPillarBar label="Q" value={80} />
                <MiniPillarBar label="V" value={72} />
                <MiniPillarBar label="R" value={85} />
                <MiniPillarBar label="D" value={68} />
                <MiniPillarBar label="C" value={55} />
                <MiniPillarBar label="AI" value={75} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer note ── */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ color: C.t3, fontSize: 11 }}>
            Protótipo de design "<span style={{ color: C.accent }}>911</span>" — Performance pura, engenharia visível.
          </p>
          <p style={{ color: C.t3, fontSize: 10, marginTop: 4 }}>
            Glass surfaces · Score arcs · Gradient accents · Data-dense typography · Zero decoração
          </p>
        </div>
      </div>
    </div>
  )
}
