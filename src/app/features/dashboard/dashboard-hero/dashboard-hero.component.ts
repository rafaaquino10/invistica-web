import {
  Component, ChangeDetectionStrategy, input, computed, signal,
  ElementRef, viewChild, AfterViewInit, OnDestroy, inject, DestroyRef,
} from '@angular/core';
import { Rating, RATING_LABELS } from '../../../core/models/score.model';
import { RegimeType, REGIME_LABELS } from '../../../core/models/regime.model';

@Component({
  selector: 'dash-hero',
  standalone: true,
  template: `
    <section class="hero">
      <canvas #canvas class="hero__canvas"></canvas>
      <div class="hero__content">
        <!-- TOP ROW -->
        <div class="hero__top">
          <div class="hero__left">
            <span class="hero__date mono">{{ dateStr() }}</span>
            <h1 class="hero__headline">
              {{ greeting() }}, {{ userName() }}.
              @if (totalValue() > 0) {
                <span>Sua carteira vale <strong class="mono">R$ {{ totalValue().toLocaleString('pt-BR', {minimumFractionDigits: 2}) }}</strong>.</span>
              }
            </h1>
          </div>
        </div>

        <!-- BOTTOM ROW -->
        <div class="hero__bottom">
          <!-- GAUGE -->
          <div class="hero__gauge-wrap">
            <svg width="110" height="70" viewBox="0 0 110 70" class="hero__gauge">
              <path d="M10 65 A45 45 0 0 1 100 65" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="7" stroke-linecap="round"/>
              <path d="M10 65 A45 45 0 0 1 100 65" fill="none" [attr.stroke]="gaugeColor()"
                    stroke-width="7" stroke-linecap="round"
                    stroke-dasharray="141" [attr.stroke-dashoffset]="gaugeDashOffset()" />
              <text x="55" y="56" text-anchor="middle" font-family="IBM Plex Mono" font-size="30" font-weight="700" fill="#fff">{{ score() }}</text>
            </svg>
            <span class="hero__rating-pill" [style.backgroundColor]="ratingPillBg()" [style.color]="ratingPillColor()">
              {{ ratingLabel() }}
            </span>
          </div>

          <!-- METRICS GRID -->
          <div class="hero__metrics">
            <div class="hero__metric">
              <span class="hero__metric-label mono">PATRIMÔNIO</span>
              <span class="hero__metric-value mono">R$ {{ totalValue().toLocaleString('pt-BR', {minimumFractionDigits: 2}) }}</span>
            </div>
            <div class="hero__metric">
              <span class="hero__metric-label mono">P&L HOJE</span>
              <span class="hero__metric-value mono" [class.hero__metric-value--neg]="plToday() < 0">
                {{ plToday() >= 0 ? '+' : '' }}R$ {{ plToday().toLocaleString('pt-BR', {minimumFractionDigits: 2}) }}
              </span>
            </div>
            <div class="hero__metric">
              <span class="hero__metric-label mono">P&L TOTAL</span>
              <span class="hero__metric-value mono" [class.hero__metric-value--neg]="plTotalPct() < 0">
                {{ plTotalPct() >= 0 ? '+' : '' }}{{ (plTotalPct() * 100).toFixed(2) }}%
              </span>
              <span class="hero__metric-sub mono">{{ plTotal() >= 0 ? '+' : '' }}R$ {{ plTotal().toLocaleString('pt-BR', {minimumFractionDigits: 2}) }}</span>
            </div>
            <div class="hero__metric">
              <span class="hero__metric-label mono">DIVIDENDOS 12M</span>
              @if (dividends12m() > 0) {
                <span class="hero__metric-value mono">R$ {{ dividends12m().toLocaleString('pt-BR', {minimumFractionDigits: 2}) }}</span>
                <span class="hero__metric-sub mono">Yield {{ (yieldOnCost() * 100).toFixed(1) }}%</span>
              } @else {
                <span class="hero__metric-value mono">—</span>
                <span class="hero__metric-sub mono">Sem proventos</span>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrl: './dashboard-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeroComponent implements AfterViewInit, OnDestroy {
  readonly userName = input('');
  readonly score = input(0);
  readonly rating = input<Rating>('HOLD');
  readonly totalValue = input(0);
  readonly plToday = input(0);
  readonly plTotal = input(0);
  readonly plTotalPct = input(0);
  readonly dividends12m = input(0);
  readonly yieldOnCost = input(0);
  readonly regimeType = input<RegimeType | null>(null);
  readonly selic = input<number | null>(null);
  readonly ipca = input<number | null>(null);

  readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private animFrame = 0;
  private points: number[] = [];

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  readonly dateStr = computed(() => {
    const d = new Date();
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${weekday.toUpperCase()}, ${date.toUpperCase()}`;
  });

  readonly regimeLabel = computed(() => {
    const r = this.regimeType();
    return r ? (REGIME_LABELS[r] ?? r) : '';
  });

  readonly regimeColor = computed(() => {
    const r = this.regimeType();
    if (r === 'RISK_ON') return '#3DB87A';
    if (r === 'RISK_OFF') return '#D4453A';
    if (r === 'STAGFLATION') return '#D4943A';
    if (r === 'RECOVERY') return '#5B7FA6';
    return '#888';
  });

  readonly ratingLabel = computed(() => RATING_LABELS[this.rating()] ?? this.rating());

  readonly gaugeColor = computed(() => {
    const s = this.score();
    if (s >= 82) return '#3DB87A';
    if (s >= 70) return 'rgba(255,255,255,0.85)';
    if (s >= 45) return '#D4943A';
    if (s >= 30) return 'rgba(255,100,90,0.7)';
    return '#D4453A';
  });

  readonly gaugeDashOffset = computed(() => 141 - (141 * Math.min(this.score(), 100) / 100));

  readonly ratingPillBg = computed(() => {
    const s = this.score();
    if (s >= 82) return 'rgba(61,184,122,0.2)';
    if (s >= 70) return 'rgba(255,255,255,0.15)';
    if (s >= 45) return 'rgba(212,148,58,0.2)';
    return 'rgba(212,69,58,0.2)';
  });

  readonly ratingPillColor = computed(() => {
    const s = this.score();
    if (s >= 82) return '#3DB87A';
    if (s >= 70) return 'rgba(255,255,255,0.8)';
    if (s >= 45) return '#D4943A';
    return '#D4453A';
  });

  ngAfterViewInit(): void {
    this.initCanvas();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
  }

  private onResize = () => {
    const c = this.canvas()?.nativeElement;
    if (!c) return;
    c.width = c.parentElement!.clientWidth;
    c.height = c.parentElement!.clientHeight;
  };

  private initCanvas(): void {
    const c = this.canvas()?.nativeElement;
    if (!c) return;
    c.width = c.parentElement!.clientWidth;
    c.height = c.parentElement!.clientHeight;

    // Init points
    this.points = [];
    let y = c.height * 0.5;
    for (let i = 0; i < 150; i++) {
      y += (Math.random() - 0.46) * 3;
      y = Math.max(c.height * 0.2, Math.min(c.height * 0.9, y));
      this.points.push(y);
    }

    const draw = () => {
      const ctx = c.getContext('2d');
      if (!ctx) return;
      const w = c.width;
      const h = c.height;

      // Shift and push
      this.points.shift();
      let last = this.points[this.points.length - 1];
      last += (Math.random() - 0.46) * 3;
      last = Math.max(h * 0.2, Math.min(h * 0.9, last));
      this.points.push(last);

      ctx.clearRect(0, 0, w, h);
      const step = w / (this.points.length - 1);

      // Area fill
      ctx.beginPath();
      ctx.moveTo(0, h);
      this.points.forEach((py, i) => ctx.lineTo(i * step, py));
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();

      // Line
      ctx.beginPath();
      this.points.forEach((py, i) => {
        if (i === 0) ctx.moveTo(0, py);
        else ctx.lineTo(i * step, py);
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      this.animFrame = requestAnimationFrame(draw);
    };

    draw();
  }
}
