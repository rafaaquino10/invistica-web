import {
  Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy, inject,
  ElementRef, viewChild, AfterViewInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { environment } from '../../../environments/environment';

interface Stock {
  tk: string; nm: string; sec: string; sc: number;
  rl: string; rc: 'sb' | 'b' | 'h' | 'r';
  px: string; chg: string; chgPos: boolean;
  fv: string; mg: string;
  q: number; l: number; v: number;
  wq: string; wl: string; wv: string;
}

interface ProcItem {
  tk: string; px: string; chg: string; chgPos: boolean;
}

const CLUSTER_NAMES: Record<number, string> = {
  1: 'Financeiro', 2: 'Commodities', 3: 'Consumo', 4: 'Utilities',
  5: 'Saude', 6: 'Real Estate', 7: 'Bens de Capital', 8: 'Educacao', 9: 'TMT',
};

function ratingLabel(r: string): string {
  if (r === 'STRONG_BUY') return 'Compra forte';
  if (r === 'BUY') return 'Acumular';
  if (r === 'HOLD') return 'Manter';
  if (r === 'REDUCE') return 'Reduzir';
  return 'Evitar';
}

function ratingClass(r: string): 'sb' | 'b' | 'h' | 'r' {
  if (r === 'STRONG_BUY') return 'sb';
  if (r === 'BUY') return 'b';
  if (r === 'HOLD') return 'h';
  return 'r';
}

@Component({
  selector: 'iq-landing',
  standalone: true,
  imports: [RouterLink, IqTickerLogoComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  readonly heroCanvas = viewChild<ElementRef<HTMLCanvasElement>>('heroCanvas');

  readonly stocks = signal<Stock[]>([]);
  readonly procItems = signal<ProcItem[]>([]);
  readonly currentStock = signal<Stock | null>(null);
  readonly fading = signal(false);
  readonly countdown = signal(8);
  readonly loaded = signal(false);

  private stockIdx = 0;
  private shuffled: Stock[] = [];
  private rotationTimer: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private animFrame = 0;
  private canvasPoints: number[] = [];

  scoreColor(sc: number): string {
    if (sc >= 82) return 'var(--positive)';
    if (sc >= 70) return 'var(--obsidian)';
    return '#A07628';
  }

  pillarColor(sc: number): string {
    return sc >= 80 ? 'var(--positive)' : 'var(--obsidian)';
  }

  ngOnInit(): void {
    const base = environment.apiUrl || '';
    this.http.get<any>(`${base}/scores/top?n=7`).pipe(
      catchError(() => of({ top: [] })),
    ).subscribe(res => {
      const top = res.top ?? [];
      if (top.length === 0) return;

      const mapped: Stock[] = top.map((a: any) => ({
        tk: a.ticker,
        nm: a.company_name,
        sec: CLUSTER_NAMES[a.cluster_id] ?? 'Outros',
        sc: a.iq_score ?? 0,
        rl: ratingLabel(a.rating ?? 'HOLD'),
        rc: ratingClass(a.rating ?? 'HOLD'),
        px: a.fair_value_final ? `R$ ${a.fair_value_final.toFixed(2)}` : '--',
        chg: a.safety_margin != null ? `${a.safety_margin > 0 ? '+' : ''}${(a.safety_margin * 100).toFixed(1)}%` : '--',
        chgPos: (a.safety_margin ?? 0) > 0,
        fv: a.fair_value_final ? `R$ ${a.fair_value_final.toFixed(2)}` : '--',
        mg: a.safety_margin != null ? `${a.safety_margin > 0 ? '+' : ''}${(a.safety_margin * 100).toFixed(1)}%` : '--',
        q: a.score_quanti ?? 0,
        l: a.score_quali ?? 0,
        v: a.score_valuation ?? 0,
        wq: '40%', wl: '20%', wv: '40%',
      }));

      this.stocks.set(mapped);

      const items: ProcItem[] = mapped.map(s => ({
        tk: s.tk,
        px: s.px,
        chg: s.chg,
        chgPos: s.chgPos,
      }));
      this.procItems.set([...items, ...items, ...items]);

      this.shuffled = [...mapped].sort(() => 0.5 - Math.random());
      this.currentStock.set(this.shuffled[0]);
      this.loaded.set(true);
      this.startRotation();
    });
  }

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  private startRotation(): void {
    this.countdown.set(8);
    this.countdownTimer = setInterval(() => {
      this.countdown.update(v => v > 0 ? v - 1 : 8);
    }, 1000);

    this.rotationTimer = setInterval(() => {
      this.fading.set(true);
      setTimeout(() => {
        this.stockIdx++;
        this.currentStock.set(this.shuffled[this.stockIdx % this.shuffled.length]);
        this.fading.set(false);
        this.countdown.set(8);
      }, 400);
    }, 8000);
  }

  private initCanvas(): void {
    const canvas = this.heroCanvas()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement!.clientWidth;
      canvas.height = canvas.parentElement!.clientHeight;
    };
    resize();

    const w = canvas.width;
    const h = canvas.height;
    const totalPoints = 120;

    let y = h * 0.78;
    for (let i = 0; i < totalPoints; i++) {
      const trend = -((h * 0.55) / totalPoints);
      y += trend + (Math.random() - 0.5) * 8;
      y = Math.max(h * 0.12, Math.min(h * 0.88, y));
      this.canvasPoints.push(y);
    }

    let revealed = 0;
    const step = w / (totalPoints - 1);
    const speed = 0.7;

    const drawFrame = () => {
      revealed = Math.min(revealed + speed, totalPoints);
      ctx.clearRect(0, 0, w, h);

      const pts = this.canvasPoints.slice(0, revealed);
      if (pts.length < 2) { this.animFrame = requestAnimationFrame(drawFrame); return; }

      ctx.beginPath();
      ctx.moveTo(0, h);
      pts.forEach((py, i) => ctx.lineTo(i * step, py));
      ctx.lineTo((pts.length - 1) * step, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(61, 61, 58, 0.04)';
      ctx.fill();

      ctx.beginPath();
      pts.forEach((py, i) => {
        if (i === 0) ctx.moveTo(0, py);
        else ctx.lineTo(i * step, py);
      });
      ctx.strokeStyle = 'rgba(61, 61, 58, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const lastX = (pts.length - 1) * step;
      const lastY = pts[pts.length - 1];
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(61, 61, 58, 0.25)';
      ctx.fill();

      if (revealed < totalPoints) {
        this.animFrame = requestAnimationFrame(drawFrame);
      }
    };

    this.animFrame = requestAnimationFrame(drawFrame);

    window.addEventListener('resize', () => {
      resize();
      if (revealed >= totalPoints) {
        revealed = totalPoints;
        drawFrame();
      }
    });
  }

  scrollToLive(): void {
    document.querySelector('.live')?.scrollIntoView({ behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    if (this.rotationTimer) clearInterval(this.rotationTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }
}
