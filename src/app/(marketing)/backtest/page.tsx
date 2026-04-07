'use client'

import Link from 'next/link'
import { Disclaimer } from '@/components/ui'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'

// ─── Backtest Data (real, from quant/reports) ──────────────────

const equityCurve = [
  { year: '2015', portfolio: 1000000, ibov: 1000000, cdi: 1000000 },
  { year: '2016', portfolio: 1283532, ibov: 1389319, cdi: 1139946 },
  { year: '2017', portfolio: 1892653, ibov: 1762445, cdi: 1253186 },
  { year: '2018', portfolio: 2190499, ibov: 2027382, cdi: 1333527 },
  { year: '2019', portfolio: 3957723, ibov: 2675063, cdi: 1412818 },
  { year: '2020', portfolio: 5018838, ibov: 2752157, cdi: 1451724 },
  { year: '2021', portfolio: 5548849, ibov: 2418039, cdi: 1516118 },
  { year: '2022', portfolio: 6098617, ibov: 2538201, cdi: 1703821 },
  { year: '2023', portfolio: 7511808, ibov: 3095386, cdi: 1925799 },
  { year: '2024', portfolio: 6868341, ibov: 2774694, cdi: 2135482 },
  { year: '2025', portfolio: 9004030, ibov: 3716840, cdi: 2441556 },
]

const annualReturns = [
  { year: '2016', q1: 28.35, ibov: 38.93 },
  { year: '2017', q1: 47.44, ibov: 26.82 },
  { year: '2018', q1: 15.71, ibov: 15.02 },
  { year: '2019', q1: 80.68, ibov: 31.94 },
  { year: '2020', q1: 26.82, ibov: 2.88 },
  { year: '2021', q1: 10.56, ibov: -12.15 },
  { year: '2022', q1: 9.91, ibov: 4.97 },
  { year: '2023', q1: 23.16, ibov: 21.92 },
  { year: '2024', q1: -8.57, ibov: -10.34 },
  { year: '2025', q1: 31.07, ibov: 33.99 },
]

const quintiles = [
  { name: 'Q1 (Top)', value: 936.6, color: '#1A73E8' },
  { name: 'Q2', value: 523.0, color: '#60A5FA' },
  { name: 'Q3', value: 944.2, color: '#94A3B8' },
  { name: 'Q4', value: 622.3, color: '#94A3B8' },
  { name: 'Q5 (Bottom)', value: 338.7, color: '#EF4444' },
]

const walkForward = [
  { year: '2019', cagr: 80.7, sharpe: 4.82, alpha: 48.7, winRate: 91.7, pass: true },
  { year: '2020', cagr: 26.8, sharpe: 0.83, alpha: 23.9, winRate: 66.7, pass: true },
  { year: '2021', cagr: 10.6, sharpe: 0.45, alpha: 22.7, winRate: 66.7, pass: true },
  { year: '2022', cagr: 9.9, sharpe: 0.02, alpha: 4.9, winRate: 50.0, pass: false },
  { year: '2023', cagr: 23.2, sharpe: 0.56, alpha: 1.2, winRate: 50.0, pass: true },
  { year: '2024', cagr: -8.6, sharpe: -1.56, alpha: 1.8, winRate: 41.7, pass: false },
  { year: '2025', cagr: 31.1, sharpe: 1.04, alpha: -2.9, winRate: 50.0, pass: true },
]

const ablation = [
  { version: 'v3-base', cagr: 18.25, sharpe: 0.51, alpha: 4.22, drawdown: 30.9, wf: '3/7', q1q5: false },
  { version: '+Data Fixes', cagr: 23.23, sharpe: 0.73, alpha: 9.20, drawdown: 28.0, wf: '3/7', q1q5: true },
  { version: '+Mechanics', cagr: 25.13, sharpe: 0.79, alpha: 11.10, drawdown: 30.0, wf: '4/7', q1q5: true },
  { version: '+Momentum', cagr: 24.58, sharpe: 0.78, alpha: 10.55, drawdown: 27.8, wf: '5/7', q1q5: true },
]

const keyMetrics = [
  { label: 'CAGR', value: '24.58%', ibov: '14.03%', highlight: true },
  { label: 'Alpha vs IBOV', value: '+10.55%', ibov: '—', highlight: true },
  { label: 'Sharpe Ratio', value: '0.78', ibov: '0.42', highlight: false },
  { label: 'Sortino Ratio', value: '0.77', ibov: '—', highlight: false },
  { label: 'Max Drawdown', value: '-27.8%', ibov: '-46.2%', highlight: false },
  { label: 'Win Rate', value: '59.2%', ibov: '—', highlight: false },
  { label: 'Info Ratio', value: '0.91', ibov: '—', highlight: false },
  { label: 'IC Mean', value: '0.039', ibov: '—', highlight: false },
]

// ─── Helpers ────────────────────────────────────────────────

function formatBRL(value: number) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
  return `R$ ${value}`
}

// ─── Page ───────────────────────────────────────────────────

export default function BacktestPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A73E8]/10 via-transparent to-[#0D9488]/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-[#1A73E8]/10 border border-[#1A73E8]/20 text-[#60A5FA] text-sm">
            <span>10 anos de dados reais</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Prova de Robustez
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-2">
            Motor IQ-Cognit™
          </p>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            Backtest completo de jan/2016 a dez/2025 com 120 meses de dados reais da B3.
            Universo de ~60 ações líquidas, rebalanceamento mensal, custos reais incluídos.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">

        {/* ─── 1. Equity Curve ──────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Curva de Patrimônio</h2>
          <p className="text-slate-400 text-sm mb-6">R$ 1M investidos em jan/2016 → R$ 9M com aQ Top-10 vs R$ 3.7M no IBOV</p>
          <div className="bg-[#1E293B] rounded-xl p-4 md:p-6 border border-white/5">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={formatBRL} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94A3B8' }}
                  formatter={(value: number, name: string) => [formatBRL(value), name === 'portfolio' ? 'aQ Top-10' : name === 'ibov' ? 'IBOV' : 'CDI']}
                />
                <Legend formatter={(value) => value === 'portfolio' ? 'aQ Top-10' : value === 'ibov' ? 'IBOV' : 'CDI'} />
                <Line type="monotone" dataKey="portfolio" stroke="#1A73E8" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="ibov" stroke="#94A3B8" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="cdi" stroke="#EAB308" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                <ReferenceLine x="2020" stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'COVID', fill: '#EF4444', fontSize: 10 }} />
                <ReferenceLine x="2022" stroke="#F97316" strokeDasharray="3 3" label={{ value: 'SELIC 13.75%', fill: '#F97316', fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ─── 2. Performance Anual ─────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Performance Anual</h2>
          <p className="text-slate-400 text-sm mb-6">Retorno anual do portfólio aQ Top-10 vs IBOV (líquido de custos)</p>
          <div className="bg-[#1E293B] rounded-xl p-4 md:p-6 border border-white/5">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={annualReturns} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name === 'q1' ? 'aQ Top-10' : 'IBOV']}
                />
                <Legend formatter={(value) => value === 'q1' ? 'aQ Top-10' : 'IBOV'} />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="q1" fill="#1A73E8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ibov" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ─── 3. Quintis ──────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Análise por Quintis</h2>
          <p className="text-slate-400 text-sm mb-6">Retorno acumulado (2016-2025) por quintil de IQ Score — Q1 (melhores) vs Q5 (piores)</p>
          <div className="bg-[#1E293B] rounded-xl p-4 md:p-6 border border-white/5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quintiles} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={12} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Retorno Acumulado']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {quintiles.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-3">
              * Q3 apresenta anomalia por efeito momentum em mid-caps. Q1 {'>'} Q5 confirma poder discriminativo do score.
            </p>
          </div>
        </section>

        {/* ─── 4. Métricas-chave ────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Métricas de Performance</h2>
          <p className="text-slate-400 text-sm mb-6">Resultados líquidos de custos (0.26% round-trip), rebalanceamento mensal</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {keyMetrics.map((m) => (
              <div key={m.label} className={`bg-[#1E293B] rounded-xl p-4 border ${m.highlight ? 'border-[#1A73E8]/30' : 'border-white/5'}`}>
                <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                <p className={`text-xl font-bold ${m.highlight ? 'text-[#1A73E8]' : 'text-white'}`}>{m.value}</p>
                {m.ibov !== '—' && (
                  <p className="text-xs text-slate-500 mt-1">IBOV: {m.ibov}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── 5. Walk-Forward ──────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Walk-Forward (Out-of-Sample)</h2>
          <p className="text-slate-400 text-sm mb-6">7 janelas anuais testadas fora da amostra — 5/7 PASS (71.4%)</p>
          <div className="grid grid-cols-7 gap-2">
            {walkForward.map((w) => (
              <div
                key={w.year}
                className={`bg-[#1E293B] rounded-xl p-3 border text-center ${
                  w.pass ? 'border-green-500/30' : 'border-red-500/30'
                }`}
              >
                <p className="text-sm font-bold mb-2">{w.year}</p>
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                  w.pass ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {w.pass ? 'OK' : 'X'}
                </div>
                <p className="text-xs text-slate-400">Sharpe</p>
                <p className={`text-sm font-mono font-bold ${w.sharpe > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {w.sharpe.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Alpha</p>
                <p className={`text-xs font-mono ${w.alpha > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {w.alpha > 0 ? '+' : ''}{w.alpha.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 6. Ablation Study ───────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Estudo de Ablação</h2>
          <p className="text-slate-400 text-sm mb-6">Evolução progressiva do motor: cada fix melhora uma dimensão diferente</p>
          <div className="bg-[#1E293B] rounded-xl border border-white/5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-400">
                  <th className="text-left p-3 font-medium">Versão</th>
                  <th className="text-right p-3 font-medium">CAGR</th>
                  <th className="text-right p-3 font-medium">Sharpe</th>
                  <th className="text-right p-3 font-medium">Alpha</th>
                  <th className="text-right p-3 font-medium">Max DD</th>
                  <th className="text-right p-3 font-medium">Walk-Fwd</th>
                  <th className="text-center p-3 font-medium">Q1{'>'}Q5</th>
                </tr>
              </thead>
              <tbody>
                {ablation.map((a, i) => (
                  <tr key={a.version} className={`border-b border-white/5 ${i === ablation.length - 1 ? 'bg-[#1A73E8]/5' : ''}`}>
                    <td className="p-3 font-medium">{a.version}</td>
                    <td className="p-3 text-right font-mono">{a.cagr.toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono">{a.sharpe.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-green-400">+{a.alpha.toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono text-red-400">-{a.drawdown.toFixed(1)}%</td>
                    <td className="p-3 text-right font-mono">{a.wf}</td>
                    <td className="p-3 text-center">
                      {a.q1q5 ? (
                        <span className="text-green-400">OK</span>
                      ) : (
                        <span className="text-red-400">X</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Methodology Note ─────────────────────────── */}
        <section className="bg-[#1E293B]/50 rounded-xl p-6 border border-white/5">
          <h3 className="text-lg font-bold mb-3">Metodologia</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-400">
            <div>
              <p><strong className="text-slate-300">Período:</strong> Jan/2016 — Dez/2025 (120 meses)</p>
              <p><strong className="text-slate-300">Universo:</strong> ~60 ações líquidas (vol. {'>'} R$ 500k/dia)</p>
              <p><strong className="text-slate-300">Rebalanceamento:</strong> Mensal, equal-weight</p>
              <p><strong className="text-slate-300">Custos:</strong> 0.26% round-trip (emolumentos + spread)</p>
            </div>
            <div>
              <p><strong className="text-slate-300">Dados:</strong> CVM DFP (fundamentais) + yfinance (preços)</p>
              <p><strong className="text-slate-300">Lag:</strong> 3 meses (fundamentais publicados com atraso)</p>
              <p><strong className="text-slate-300">Benchmark:</strong> IBOV (price return — alpha pode ser ~2pp overstated)</p>
              <p><strong className="text-slate-300">Survivorship:</strong> Mitigado via existência CVM</p>
            </div>
          </div>
        </section>

        {/* ─── CTA ──────────────────────────────────────── */}
        <section className="text-center py-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Experimente o IQ Score em todas as 387 ações
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            O mesmo motor que gerou +10.55% de alpha anualizado está disponível em tempo real para sua carteira.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#1A73E8] text-white font-medium hover:bg-[#1557B0] transition-colors"
            >
              Criar conta grátis
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
            >
              Ver planos
            </Link>
          </div>
        </section>
        <Disclaimer variant="footer" className="mt-4" />
        <p className="text-[10px] text-[var(--text-3)] mt-1">
          Resultados passados não garantem retornos futuros. Backtest simulado com dados históricos e custos estimados.
        </p>
      </div>
    </div>
  )
}
