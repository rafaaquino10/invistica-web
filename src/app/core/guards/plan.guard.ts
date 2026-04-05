import { CanActivateFn } from '@angular/router';

/**
 * Plan guard — all features are free during early access.
 * When billing is activated, this should check the user's plan
 * and redirect to an upgrade page if the feature requires Pro.
 */
export const planGuard: CanActivateFn = () => {
  return true;
};
