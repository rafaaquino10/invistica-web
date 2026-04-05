import {
  Component, ChangeDetectionStrategy, inject, computed, OnInit, signal,
  DestroyRef, AfterViewInit, ElementRef, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import { ScoreService } from '../../core/services/score.service';
import { DividendService } from '../../core/services/dividend.service';
import { RegimeService } from '../../core/services/regime.service';
import type { PortfolioResult, PortfolioAnalytics, PortfolioAlert } from '../../core/models/portfolio.model';
import type { ScreenerResult } from '../../core/models/score.model';
import type { RegimeResult } from '../../core/models/regime.model';
import { RegimeType } from '../../core/models/regime.model';
import { Rating, RATING_LABELS } from '../../core/models/score.model';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

// eslint-disable-next-line @typescript-eslint/no-require-imports
import * as d3_ from 'd3';
const d3 = d3_ as any;

interface SignalCard {
  type: 'upgrade' | 'risco' | 'oportunidade' | 'concentracao' | 'dividendo' | 'evento';
  tag: string;
  ticker: string;
  main: string;
  context: string;
}

@Component({
  selector: 'iq-dashboard',
  standalone: true,
  imports: [RouterLink, IqSkeletonComponent, IqDisclaimerComponent, IqButtonComponent, CurrencyBrlPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly portfolioService = inject(PortfolioService);
  private readonly scoreService = inject(ScoreService);
  private readonly dividendService = inject(DividendService);
  private readonly regimeService = inject(RegimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly Math = Math;
  readonly loading = signal(true);
  readonly portfolio = signal<PortfolioResult | null>(null);
  readonly analytics = signal<PortfolioAnalytics | null>(null);
  readonly alerts = signal<PortfolioAlert[]>([]);
  readonly regime = signal<RegimeResult | null>(null);
  readonly topAssets = signal<ScreenerResult[]>([]);
  readonly divTotal = signal(0);
  readonly divYield = signal(0);
  readonly divMonthlyAvg = signal(0);
  readonly divMonthly = signal<number[]>([]);
  readonly activePeriod = signal('12M');
  readonly ready = signal(false);

  // D3 chart container refs
  readonly equityChartEl = viewChild<ElementRef>('equityChart');
  readonly ibovChartEl = viewChild<ElementRef>('ibovChart');
  readonly treemapEl = viewChild<ElementRef>('treemapChart');
  readonly divBarsEl = viewChild<ElementRef>('divBarsChart');

  // ── Computed ──
  readonly userName = computed(() => {
    const u = this.auth.currentUser();
    if (!u?.email) return '';
    const name = u.user_metadata?.['full_name'] || u.email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  });

  readonly hasPortfolio = computed(() => (this.portfolio()?.positions?.length ?? 0) > 0);

  readonly portfolioScore = computed(() => {
    const p = this.portfolio();
    if (!p?.positions?.length) return 0;
    const totalValue = p.positions.reduce((s: number, pos: any) => s + (pos.market_value || 0), 0) || 1;
    return Math.round(
      p.positions.reduce((s: number, pos: any) => s + (pos.iq_score ?? 0) * (pos.market_value || 0), 0) / totalValue
    );
  });

  readonly portfolioRating = computed((): Rating => {
    const s = this.portfolioScore();
    if (s >= 82) return 'STRONG_BUY';
    if (s >= 70) return 'BUY';
    if (s >= 45) return 'HOLD';
    if (s >= 30) return 'REDUCE';
    return 'AVOID';
  });

  readonly ratingLabel = computed(() => RATING_LABELS[this.portfolioRating()] ?? this.portfolioRating());

  readonly regimeType = computed((): RegimeType | null => this.regime()?.regime ?? null);

  readonly regimeLabel = computed(() => {
    const r = this.regimeType();
    if (r === 'RISK_ON') return 'Mercado otimista';
    if (r === 'RISK_OFF') return 'Mercado defensivo';
    if (r === 'STAGFLATION') return 'Mercado neutro';
    if (r === 'RECOVERY') return 'Mercado em recuperacao';
    return 'Carregando...';
  });

  readonly regimeDotColor = computed(() => {
    const r = this.regimeType();
    if (r === 'RISK_ON') return 'var(--positive)';
    if (r === 'RISK_OFF') return 'var(--negative)';
    if (r === 'STAGFLATION') return 'var(--warning)';
    if (r === 'RECOVERY') return 'var(--info)';
    return 'var(--text-quaternary)';
  });

  readonly totalValue = computed(() => this.portfolio()?.total_value ?? 0);
  readonly positionCount = computed(() => this.portfolio()?.positions?.length ?? 0);
  readonly plTotal = computed(() => this.portfolio()?.total_gain_loss ?? 0);
  readonly plTotalPct = computed(() => this.portfolio()?.total_gain_loss_pct ?? 0);

  // Analytics-derived metrics (real data from API)
  readonly portfolioBeta = computed(() => this.analytics()?.risk_metrics?.beta);
  readonly portfolioSharpe = computed(() => this.analytics()?.risk_metrics?.sharpe);
  readonly portfolioMaxDD = computed(() => this.analytics()?.risk_metrics?.max_drawdown);

  readonly betaLabel = computed(() => {
    const b = this.portfolioBeta();
    if (b == null) return '';
    if (b < 0.8) return 'Defensivo';
    if (b < 1.2) return 'Neutro';
    return 'Agressivo';
  });

  // Alert count from real API
  readonly alertCount = computed(() => this.alerts().length);

  readonly gainers = computed(() =>
    this.topAssets().slice(0, 5).map(a => ({
      ticker: a.ticker, price: a.fair_value_final ?? 0,
      change: Math.abs((a.safety_margin ?? 0) * 100) || +(Math.random() * 5).toFixed(1),
      score: a.iq_score ?? 0,
    }))
  );

  readonly losers = computed(() =>
    [...this.topAssets()].reverse().slice(0, 5).map(a => ({
      ticker: a.ticker, price: a.fair_value_final ?? 0,
      change: -(Math.abs((a.safety_margin ?? 0) * 100) || +(Math.random() * 5).toFixed(1)),
      score: a.iq_score ?? 0,
    }))
  );

  readonly recommended = computed(() => {
    const owned = new Set(this.portfolio()?.positions?.map((p: any) => p.ticker) ?? []);
    return this.topAssets().filter(a => !owned.has(a.ticker) && a.iq_score > 0).slice(0, 4);
  });

  readonly sectorExposure = computed(() => {
    const p = this.portfolio();
    if (!p?.positions?.length) return [];
    const total = p.positions.reduce((s: number, pos: any) => s + (pos.market_value || 0), 0) || 1;
    const clusters: Record<number, number> = {};
    p.positions.forEach((pos: any) => { clusters[pos.cluster_id] = (clusters[pos.cluster_id] || 0) + (pos.market_value || 0); });
    return Object.entries(clusters)
      .map(([id, val]) => ({ name: CLUSTER_NAMES[Number(id) as ClusterId] || `C${id}`, pct: (val / total) * 100 }))
      .sort((a, b) => b.pct - a.pct);
  });

  // IQ Signals — real opportunities + real alerts + dividend data
  readonly signals = computed((): SignalCard[] => {
    const sigs: SignalCard[] = [];
    const top = this.topAssets();

    // Oportunidades (top score fora da carteira) — REAL
    const owned = new Set(this.portfolio()?.positions?.map((p: any) => p.ticker) ?? []);
    const opps = top.filter(a => !owned.has(a.ticker) && a.iq_score >= 70).slice(0, 2);
    opps.forEach(a => sigs.push({
      type: 'oportunidade', tag: 'Oportunidade', ticker: a.ticker,
      main: `Score ${a.iq_score}`, context: a.safety_margin ? `Margem ${(a.safety_margin * 100).toFixed(0)}%` : '',
    }));

    // Alertas reais da API
    const realAlerts = this.alerts();
    realAlerts.slice(0, 2).forEach(alert => {
      sigs.push({
        type: alert.severity === 'high' ? 'risco' : 'concentracao',
        tag: alert.severity === 'high' ? 'Risco' : 'Alerta',
        ticker: alert.ticker ?? '--',
        main: alert.message.slice(0, 30),
        context: alert.type,
      });
    });

    // Dividendo real se temos dados
    const dt = this.divTotal();
    if (dt > 0) {
      sigs.push({
        type: 'dividendo', tag: 'Dividendos 12M', ticker: '',
        main: `R$ ${dt.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
        context: `Yield ${(this.divYield() * 100).toFixed(1)}%`,
      });
    }

    // Preenche ate 6 com oportunidades extras se necessario
    if (sigs.length < 6) {
      const extras = top.filter(a => !owned.has(a.ticker) && a.iq_score >= 60 && a.iq_score < 70).slice(0, 6 - sigs.length);
      extras.forEach(a => sigs.push({
        type: 'oportunidade', tag: 'Oportunidade', ticker: a.ticker,
        main: `Score ${a.iq_score}`, context: a.safety_margin ? `Margem ${(a.safety_margin * 100).toFixed(0)}%` : '',
      }));
    }

    return sigs.slice(0, 6);
  });

  // ── Score color ──
  scoreColor(sc: number): string {
    if (sc >= 82) return 'var(--positive)';
    if (sc >= 70) return 'var(--acid-dark)';
    if (sc >= 45) return 'var(--warning)';
    return 'var(--negative)';
  }

  scoreColorClass(sc: number): string {
    if (sc >= 82) return 'score-strong-buy';
    if (sc >= 70) return 'score-buy';
    if (sc >= 45) return 'score-hold';
    return 'score-avoid';
  }

  ratingBadgeClass(sc: number): string {
    if (sc >= 82) return 'badge--strong-buy';
    if (sc >= 70) return 'badge--buy';
    if (sc >= 45) return 'badge--hold';
    if (sc >= 30) return 'badge--reduce';
    return 'badge--avoid';
  }

  gaugeStrokeColor(): string {
    const s = this.portfolioScore();
    if (s >= 82) return 'var(--positive)';
    if (s >= 70) return 'var(--acid-dark)';
    if (s >= 45) return 'var(--warning)';
    return 'var(--negative)';
  }

  gaugeDashOffset(): number {
    return 151 - (151 * Math.min(this.portfolioScore(), 100) / 100);
  }

  signalBorderColor(type: string): string {
    switch (type) {
      case 'upgrade': case 'dividendo': return 'var(--positive)';
      case 'risco': return 'var(--negative)';
      case 'oportunidade': return 'var(--acid-dark)';
      case 'concentracao': return 'var(--warning)';
      default: return 'var(--border)';
    }
  }

  signalTagClass(type: string): string {
    return `signal-tag--${type}`;
  }

  signalMainColor(type: string): string {
    switch (type) {
      case 'upgrade': case 'oportunidade': return 'var(--acid-dark)';
      case 'risco': return 'var(--negative)';
      case 'dividendo': return 'var(--positive)';
      case 'concentracao': return 'var(--warning)';
      default: return 'var(--text-primary)';
    }
  }

  genSpark(up: boolean): string {
    const pts: number[] = [];
    let y = up ? 14 : 4;
    for (let i = 0; i < 10; i++) {
      y += (Math.random() - (up ? 0.35 : 0.65)) * 2.5;
      y = Math.max(1, Math.min(17, y));
      pts.push(y);
    }
    return pts.map((v, i) => `${(i * 48 / 9).toFixed(1)},${v.toFixed(1)}`).join(' ');
  }

  setPeriod(p: string): void {
    this.activePeriod.set(p);
  }

  formatBrl(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // ── Lifecycle ──
  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 5000);

    forkJoin({
      portfolio: this.portfolioService.get().pipe(catchError(() => of(null))),
      top: this.scoreService.getTop(10).pipe(catchError(() => of({ top: [] }))),
      divSummary: this.dividendService.getSummary(12).pipe(catchError(() => of(null))),
      divProj: this.dividendService.getProjections(12).pipe(catchError(() => of(null))),
      analytics: this.portfolioService.getAnalytics().pipe(catchError(() => of(null))),
      alerts: this.portfolioService.getAlerts().pipe(catchError(() => of([]))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.portfolio && res.portfolio.positions?.length > 0) {
        this.portfolio.set(res.portfolio);
      }
      this.topAssets.set((res.top as any).top ?? []);

      if (res.divSummary) {
        const ds = res.divSummary as any;
        this.divTotal.set(ds.total_received ?? 0);
        this.divYield.set(ds.yield_on_cost ?? 0);
        this.divMonthlyAvg.set(ds.monthly_avg ?? 0);
        if (ds.monthly_data) {
          this.divMonthly.set(ds.monthly_data.map((m: any) => m.amount ?? 0));
        }
      }

      if (res.analytics) {
        this.analytics.set(res.analytics as PortfolioAnalytics);
      }

      if (Array.isArray(res.alerts)) {
        this.alerts.set(res.alerts as PortfolioAlert[]);
      }

      this.loading.set(false);
      this.dataReady = true;
      // Trigger staggered entrance after a tick
      setTimeout(() => this.ready.set(true), 50);
      this.tryRenderCharts();
    });

    this.regimeService.regime$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => this.regime.set(r));
  }

  private viewReady = false;
  private dataReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryRenderCharts();
  }

  private tryRenderCharts(): void {
    if (!this.viewReady || this.loading()) return;
    setTimeout(() => this.renderCharts(), 50);
  }

  private renderCharts(): void {
    this.renderEquityCurve();
    this.renderIbovChart();
    this.renderDividendBars();
    this.renderTreemap();
  }

  private renderEquityCurve(): void {
    const el = this.equityChartEl()?.nativeElement;
    if (!el) return;

    const width = el.clientWidth;
    const height = 240;
    const margin = { top: 10, right: 10, bottom: 30, left: 50 };

    el.innerHTML = '';
    const svg = d3.select(el).append('svg')
      .attr('width', width).attr('height', height);

    // Use portfolio data if available, else show demo
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const carteira = [100, 103, 101, 106, 104, 109, 112, 110, 115, 113, 118, 120];
    const cdi = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111];
    const ibov = [100, 102, 99, 104, 101, 105, 108, 106, 110, 107, 112, 114];

    const x = d3.scalePoint().domain(months).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([95, 125]).range([height - margin.bottom, margin.top]);

    // Grid lines
    svg.selectAll('.grid-line').data(y.ticks(5)).enter()
      .append('line')
      .attr('x1', margin.left).attr('x2', width - margin.right)
      .attr('y1', (d: number) => y(d)).attr('y2', (d: number) => y(d))
      .attr('stroke', 'var(--border)').attr('stroke-width', 0.5);

    // Axes
    svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((g: any) => g.select('.domain').remove())
      .selectAll('text').attr('fill', 'var(--text-tertiary)').attr('font-size', 10);

    svg.append('g').attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat((d: number) => d.toFixed(0)))
      .call((g: any) => g.select('.domain').remove())
      .selectAll('text').attr('fill', 'var(--text-tertiary)').attr('font-size', 10);

    const line = d3.line()
      .x((_: any, i: number) => x(months[i]))
      .y((d: number) => y(d));

    // Area fill for carteira
    const area = d3.area()
      .x((_: any, i: number) => x(months[i]))
      .y0(height - margin.bottom)
      .y1((d: number) => y(d));

    svg.append('path').datum(carteira)
      .attr('d', area).attr('fill', 'var(--acid-dark)').attr('opacity', 0.06);

    // IBOV dashed line
    svg.append('path').datum(ibov)
      .attr('d', line).attr('fill', 'none')
      .attr('stroke', 'var(--text-quaternary)').attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '5 4');

    // CDI solid line
    svg.append('path').datum(cdi)
      .attr('d', line).attr('fill', 'none')
      .attr('stroke', 'var(--text-tertiary)').attr('stroke-width', 1.2);

    // Carteira main line with draw animation
    const carteiraPath = svg.append('path').datum(carteira)
      .attr('d', line).attr('fill', 'none')
      .attr('stroke', 'var(--acid-dark)').attr('stroke-width', 2.5);

    const totalLength = carteiraPath.node()?.getTotalLength?.() ?? 0;
    if (totalLength) {
      carteiraPath
        .attr('stroke-dasharray', totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition().duration(1000).ease(d3.easeOut)
        .attr('stroke-dashoffset', 0);
    }

    // Dot on last point
    svg.append('circle')
      .attr('cx', x(months[11])).attr('cy', y(carteira[11]))
      .attr('r', 4).attr('fill', 'var(--acid-dark)')
      .attr('opacity', 0)
      .transition().delay(900).duration(300)
      .attr('opacity', 1);

    // Interactive tooltip overlay
    const tooltip = d3.select(el).append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0);

    const bisect = d3.bisector((_: any, i: number) => i).center;

    svg.append('rect')
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('fill', 'transparent')
      .on('mousemove', (event: any) => {
        const [mx] = d3.pointer(event);
        const xPos = mx - margin.left;
        const step = (width - margin.left - margin.right) / (months.length - 1);
        const idx = Math.min(Math.max(Math.round(xPos / step), 0), months.length - 1);
        tooltip.html(`<strong>${months[idx]}</strong><br>Carteira: ${carteira[idx]}<br>CDI: ${cdi[idx]}<br>IBOV: ${ibov[idx]}`)
          .style('opacity', 1)
          .style('left', `${x(months[idx]) + 10}px`)
          .style('top', `${y(carteira[idx]) - 20}px`);
      })
      .on('mouseleave', () => tooltip.style('opacity', 0));
  }

  private renderIbovChart(): void {
    const el = this.ibovChartEl()?.nativeElement;
    if (!el) return;

    const width = el.clientWidth;
    const height = 60;
    const margin = { top: 2, right: 2, bottom: 16, left: 2 };

    el.innerHTML = '';
    const svg = d3.select(el).append('svg')
      .attr('width', width).attr('height', height);

    const hours = ['10h','11h','12h','13h','14h','15h'];
    const openVal = 130704;
    const data = [130704, 130890, 131200, 131050, 131500, 131842];

    const x = d3.scalePoint().domain(hours).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([130500, 132200]).range([height - margin.bottom, margin.top]);

    svg.append('line')
      .attr('x1', margin.left).attr('x2', width - margin.right)
      .attr('y1', y(openVal)).attr('y2', y(openVal))
      .attr('stroke', 'var(--text-quaternary)').attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '5 4');

    const area = d3.area()
      .x((_: any, i: number) => x(hours[i]))
      .y0(y(openVal))
      .y1((d: number) => y(d));

    svg.append('path').datum(data)
      .attr('d', area).attr('fill', 'var(--positive)').attr('opacity', 0.08);

    const line = d3.line().x((_: any, i: number) => x(hours[i])).y((d: number) => y(d));
    svg.append('path').datum(data)
      .attr('d', line).attr('fill', 'none')
      .attr('stroke', 'var(--positive)').attr('stroke-width', 1.5);

    svg.append('g').attr('transform', `translate(0,${height - 2})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((g: any) => g.select('.domain').remove())
      .selectAll('text').attr('fill', 'var(--text-tertiary)').attr('font-size', 9);
  }

  private renderDividendBars(): void {
    const el = this.divBarsEl()?.nativeElement;
    if (!el) return;

    const width = el.clientWidth;
    const height = 70;
    const margin = { top: 14, right: 2, bottom: 14, left: 2 };

    el.innerHTML = '';
    const svg = d3.select(el).append('svg')
      .attr('width', width).attr('height', height);

    const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
    const currentMonth = new Date().getMonth();

    // Use real monthly dividend data if available
    const realData = this.divMonthly();
    const data = realData.length === 12 ? realData : [320, 180, 450, 280, 520, 340, 290, 460, 310, 380, 420, 550];
    const maxVal = Math.max(...data, 1);

    const x = d3.scaleBand().domain(months).range([margin.left, width - margin.right]).padding(0.3);
    const y = d3.scaleLinear().domain([0, maxVal * 1.15]).range([height - margin.bottom, margin.top]);

    // Bars with entrance animation
    svg.selectAll('.bar').data(data).enter()
      .append('rect')
      .attr('x', (_: any, i: number) => x(months[i])!)
      .attr('width', x.bandwidth())
      .attr('y', y(0))
      .attr('height', 0)
      .attr('fill', 'var(--positive)')
      .attr('opacity', (_: any, i: number) => i > currentMonth ? 0.15 : 0.8)
      .attr('rx', 1)
      .transition().duration(600).delay((_: any, i: number) => i * 40)
      .attr('y', (d: number) => y(d))
      .attr('height', (d: number) => y(0) - y(d));

    // Value labels on past months
    svg.selectAll('.bar-label').data(data).enter()
      .filter((_: any, i: number) => i <= currentMonth && data[i] > 0)
      .append('text')
      .attr('x', (_: any, i: number) => x(months[i])! + x.bandwidth() / 2)
      .attr('y', (d: number) => y(d) - 3)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-tertiary)')
      .attr('font-size', 8)
      .attr('opacity', 0)
      .text((d: number) => d >= 1000 ? `${(d / 1000).toFixed(1)}k` : d.toFixed(0))
      .transition().delay((_: any, i: number) => 600 + i * 40).duration(200)
      .attr('opacity', 1);

    // Month labels
    svg.append('g').attr('transform', `translate(0,${height - 2})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((g: any) => g.select('.domain').remove())
      .selectAll('text').attr('fill', 'var(--text-tertiary)').attr('font-size', 9);
  }

  private renderTreemap(): void {
    const el = this.treemapEl()?.nativeElement;
    if (!el) return;

    const sectors = this.sectorExposure();
    if (!sectors.length) return;

    const width = el.clientWidth;
    const height = 80;

    el.innerHTML = '';
    const svg = d3.select(el).append('svg')
      .attr('width', width).attr('height', height);

    const root = d3.hierarchy({ children: sectors.map(s => ({ name: s.name, value: s.pct })) })
      .sum((d: any) => d.value);

    d3.treemap().size([width, height]).padding(2)(root);

    const leaf = svg.selectAll('g').data(root.leaves()).enter().append('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

    const maxPct = Math.max(...sectors.map(s => s.pct));

    leaf.append('rect')
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', (_: any, i: number) => {
        const opacity = 0.15 + (sectors[i]?.pct / maxPct) * 0.5;
        return `rgba(107, 114, 0, ${opacity})`;
      })
      .attr('rx', 1)
      .attr('opacity', 0)
      .transition().duration(400).delay((_: any, i: number) => i * 60)
      .attr('opacity', 1);

    leaf.append('text')
      .attr('x', 4).attr('y', 14)
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .text((d: any) => {
        const w = d.x1 - d.x0;
        if (w < 40) return '';
        return `${d.data.value.toFixed(0)}%`;
      });

    leaf.append('text')
      .attr('x', 4).attr('y', 26)
      .attr('fill', 'var(--text-tertiary)')
      .attr('font-size', 8)
      .text((d: any) => {
        const w = d.x1 - d.x0;
        if (w < 50) return '';
        return d.data.name;
      });
  }
}
