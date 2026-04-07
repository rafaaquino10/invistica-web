import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'iq-reset-password',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card glass">
        <div class="auth-logo"><div class="logo-box"><span class="mono logo-iq">IQ</span></div></div>

        @if (success()) {
          <h2>Senha atualizada!</h2>
          <p class="msg">Redirecionando para o dashboard...</p>
        } @else {
          <h2>Redefinir senha</h2>
          @if (error()) { <div class="toast error-toast"><i class="ph ph-warning"></i> {{ error() }}</div> }
          <form (ngSubmit)="submit()">
            <div class="field">
              <label class="label">Nova senha</label>
              <input class="auth-input" type="password" [(ngModel)]="newPassword" name="password" required minlength="6" />
            </div>
            <div class="field">
              <label class="label">Confirmar nova senha</label>
              <input class="auth-input" type="password" [(ngModel)]="confirmPassword" name="confirm" required />
            </div>
            <button class="btn-volt full" type="submit" [disabled]="loading() || newPassword.length < 6 || newPassword !== confirmPassword">
              {{ loading() ? 'Redefinindo...' : 'Redefinir' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #050505; padding: 24px; }
    .auth-card { max-width: 420px; width: 100%; padding: 32px; border-radius: 4px; display: flex; flex-direction: column; gap: 16px; }
    .auth-logo { display: flex; justify-content: center; }
    .logo-box { width: 48px; height: 48px; border-radius: 12px; background: #12141C; display: flex; align-items: center; justify-content: center; }
    .logo-iq { font-size: 20px; font-weight: 800; color: #d0f364; }
    h2 { font-family: var(--font-ui); font-size: 18px; font-weight: 600; color: #F8FAFC; text-align: center; }
    .msg { font-size: 14px; color: #34D399; text-align: center; }
    .toast { padding: 10px 12px; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
    .error-toast { background: rgba(239,68,68,0.12); color: #EF4444; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .auth-input { width: 100%; height: 40px; padding: 0 14px; background: #12141C; border: 1px solid rgba(255,255,255,0.04); border-radius: 4px; color: #F8FAFC; font-family: var(--font-ui); font-size: 13px; }
    .auth-input:focus { border-color: rgba(208,243,100,0.12); outline: none; }
    .btn-volt { padding: 10px; background: #d0f364; color: #050505; border-radius: 4px; font-weight: 700; font-size: 14px; }
    .btn-volt:disabled { opacity: 0.4; }
    .full { width: 100%; }
  `]
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  newPassword = ''; confirmPassword = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal(false);

  async submit(): Promise<void> {
    this.loading.set(true);
    const err = await this.auth.updatePassword(this.newPassword);
    this.loading.set(false);
    if (err) { this.error.set(err); return; }
    this.success.set(true);
    setTimeout(() => this.router.navigate(['/dashboard']), 3000);
  }
}
