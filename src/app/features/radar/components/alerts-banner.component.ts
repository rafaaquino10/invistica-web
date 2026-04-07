import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Alert { id?: string; ticker: string; message: string; severity: string; created_at?: string; type?: string; }

@Component({
  selector: 'iq-alerts-banner',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (alerts().length > 0) {
      <div class="banner" [class]="bannerClass()">
        @for (a of alerts(); track $index) {
          <div class="alert-row">
            <i class="ph ph-{{ alertIcon(a) }} alert-icon"></i>
            <span class="alert-ticker mono" (click)="goTo(a.ticker)">{{ a.ticker }}</span>
            <span class="alert-msg">{{ a.message }}</span>
            @if (a.created_at) { <span class="alert-time mono">{{ a.created_at | date:'HH:mm' }}</span> }
            <button class="btn-ghost" (click)="dismiss($index)">Dispensar</button>
            <button class="btn-outline-sm" (click)="goTo(a.ticker)">Ver ativo</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .banner { border-radius: var(--radius); padding: 10px 16px; display: flex; flex-direction: column; gap: 4px; }
    .banner-neg { background: var(--neg-dim); border: 1px solid rgba(239,68,68,0.12); }
    .banner-warn { background: var(--warn-dim); border: 1px solid rgba(245,158,11,0.1); }
    .banner-volt { background: var(--volt-dim); border: 1px solid rgba(208,243,100,0.1); }
    .alert-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .alert-icon { font-size: 16px; }
    .alert-ticker { font-size: 12px; font-weight: 700; color: var(--volt); cursor: pointer; }
    .alert-ticker:hover { text-decoration: underline; }
    .alert-msg { flex: 1; font-size: 12px; color: var(--t2); }
    .alert-time { font-size: 10px; color: var(--t4); }
    .btn-ghost { font-size: 10px; color: var(--t3); padding: 2px 8px; border-radius: var(--radius); }
    .btn-ghost:hover { background: var(--elevated); color: var(--t1); }
    .btn-outline-sm { font-size: 10px; color: var(--t2); padding: 2px 8px; border: 1px solid var(--border); border-radius: var(--radius); }
    .btn-outline-sm:hover { border-color: var(--border-hover); }
  `]
})
export class AlertsBannerComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly alerts = signal<Alert[]>([]);

  bannerClass = () => {
    if (this.alerts().some(a => a.severity === 'critical' || a.severity === 'high')) return 'banner-neg';
    if (this.alerts().some(a => a.severity === 'warning' || a.severity === 'medium')) return 'banner-warn';
    return 'banner-volt';
  };

  alertIcon(a: Alert): string {
    if (a.type === 'dividend' || a.type === 'dividendo') return 'currency-dollar';
    if (a.severity === 'critical' || a.severity === 'high') return 'warning-circle';
    return 'trend-up';
  }

  ngOnInit(): void {
    this.api.get<{ alerts: Alert[] }>('/portfolio/alerts').subscribe({
      next: d => {
        const combined = [...(d.alerts || [])];
        this.api.get<{ alerts: Alert[] }>('/radar/alerts').subscribe({
          next: r => {
            const fired = (r.alerts || []).filter(a => (a as any).triggered);
            this.alerts.set([...combined, ...fired]);
          },
        });
      },
      error: () => {},
    });
  }

  dismiss(i: number): void { this.alerts.update(list => list.filter((_, idx) => idx !== i)); }
  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
