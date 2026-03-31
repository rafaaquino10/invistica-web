import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface BillingStatus {
  plan: string;
  active: boolean;
  expires_at: string | null;
}

export interface CheckoutResponse {
  checkout_url: string;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly api = inject(ApiService);

  getStatus(): Observable<BillingStatus> {
    return this.api.get('/billing/status');
  }

  createCheckout(): Observable<CheckoutResponse> {
    return this.api.post('/billing/checkout', {});
  }
}
