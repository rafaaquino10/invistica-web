import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, catchError, of } from 'rxjs';
import { ApiService } from '../services/api.service';

interface BillingStatus {
  plan: string;
  active: boolean;
}

export const planGuard: CanActivateFn = () => {
  // TODO: reativar quando billing estiver configurado
  return true;
};
