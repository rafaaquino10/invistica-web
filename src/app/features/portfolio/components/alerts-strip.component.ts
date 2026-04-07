import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Alert { id?: string; ticker: string; message: string; severity: string; created_at?: string; }

@Component({
  selector: 'iq-alerts-strip',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (alerts().length > 0) {
      <div class="strip" [class.critical]="hasCritical()" [class.moderate]="!hasCritical()">
        @for (a of alerts(); track $index) {
          <div class="alert-row">
            <i class="ph ph-warning alert-icon"></i>
            <span class="alert-ticker mono" (click)="goTo(a.ticker)">{{ a.ticker }}</span>
            <span class="alert-msg">{{ a.message }}</span>
            @if (a.created_at) {
              <span class="alert-time mono">{{ a.created_at | date:'dd/MM HH:mm' }}</span>
            }
            <button class="dismiss-btn" (click)="dismiss($index)"><i class="ph ph-x"></i></button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .strip { border-radius: var(--radius); padding: 8px 16px; display: flex; flex-direction: column; gap: 4px; }
    .critical { background: var(--neg-dim); border: 1px solid rgba(239,68,68,0.15); }
    .moderate { background: var(--warn-dim); border: 1px solid rgba(245,158,11,0.1); }
    .alert-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .alert-icon { font-size: 14px; color: var(--warn); }
    .critical .alert-icon { color: var(--neg); }
    .alert-ticker { font-size: 12px; font-weight: 700; color: var(--volt); cursor: pointer; }
    .alert-ticker:hover { text-decoration: underline; }
    .alert-msg { flex: 1; font-size: 12px; color: var(--t2); }
    .alert-time { font-size: 10px; color: var(--t4); }
    .dismiss-btn { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: var(--t3); font-size: 10px; border-radius: var(--radius); }
    .dismiss-btn:hover { background: var(--elevated); color: var(--t1); }
  `]
})
export class AlertsStripComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly alerts = signal<Alert[]>([]);

  hasCritical = () => this.alerts().some(a => a.severity === 'critical' || a.severity === 'high');

  ngOnInit(): void {
    this.api.get<{ alerts: Alert[] }>('/portfolio/alerts').subscribe({
      next: d => this.alerts.set(d.alerts || []),
      error: () => {},
    });
  }

  dismiss(index: number): void { this.alerts.update(list => list.filter((_, i) => i !== index)); }
  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
