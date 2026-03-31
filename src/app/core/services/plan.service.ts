import { Injectable, inject, signal, computed } from '@angular/core';
import { BillingService, BillingStatus } from './billing.service';
import { catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly billingService = inject(BillingService);
  private readonly _status = signal<BillingStatus | null>(null);
  private loaded = false;

  readonly plan = computed(() => this._status()?.plan ?? 'free');
  readonly isPro = computed(() => this.plan() !== 'free');
  readonly isFree = computed(() => this.plan() === 'free');

  load(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.billingService.getStatus()
      .pipe(catchError(() => of({ plan: 'free', active: false, expires_at: null })))
      .subscribe(s => this._status.set(s));
  }

  refresh(): void {
    this.loaded = false;
    this.load();
  }
}
