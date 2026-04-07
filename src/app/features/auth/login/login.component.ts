import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'iq-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card glass">
        <div class="auth-logo">
          <div class="logo-box"><span class="mono logo-iq">IQ</span></div>
          <span class="brand">INVESTIQ</span>
        </div>

        <h2>Entrar na sua conta</h2>

        @if (sessionExpired()) {
          <div class="toast warn-toast"><i class="ph ph-warning"></i> Sua sessão expirou. Faça login novamente.</div>
        }

        @if (error()) {
          <div class="toast error-toast"><i class="ph ph-warning"></i> {{ error() }}</div>
        }

        <button class="google-btn" (click)="googleLogin()">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          <span>Continuar com Google</span>
        </button>

        <div class="divider"><span>ou</span></div>

        <form (ngSubmit)="emailLogin()">
          <div class="field">
            <label class="label">Email</label>
            <input class="auth-input" type="email" autocomplete="email" [(ngModel)]="email" name="email" required />
          </div>
          <div class="field">
            <label class="label">Senha</label>
            <div class="password-field">
              <input class="auth-input" [type]="showPassword() ? 'text' : 'password'" autocomplete="current-password" [(ngModel)]="password" name="password" required />
              <button type="button" class="toggle-pwd" (click)="showPassword.set(!showPassword())">
                <i class="ph ph-{{ showPassword() ? 'eye-closed' : 'eye' }}"></i>
              </button>
            </div>
          </div>
          <button class="btn-volt full" type="submit" [disabled]="loading()">
            {{ loading() ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <div class="links">
          <button class="link-btn" (click)="showReset.set(!showReset())">Esqueceu a senha?</button>
          @if (showReset()) {
            <div class="reset-inline">
              <input class="auth-input" type="email" placeholder="Seu email" [(ngModel)]="resetEmail" />
              <button class="btn-outline-sm" (click)="sendReset()">Enviar link</button>
              @if (resetMsg()) { <span class="reset-msg label">{{ resetMsg() }}</span> }
            </div>
          }
          <span class="label">Não tem conta? <a class="link-volt" routerLink="/criar-conta">Criar conta grátis</a></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #050505; padding: 24px; }
    .auth-card { max-width: 420px; width: 100%; padding: 32px; border-radius: 4px; display: flex; flex-direction: column; gap: 16px; }
    .auth-logo { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .logo-box { width: 48px; height: 48px; border-radius: 12px; background: #12141C; display: flex; align-items: center; justify-content: center; animation: pulse 2s ease-in-out infinite; box-shadow: 0 0 16px rgba(208,243,100,0.2); }
    .logo-iq { font-size: 20px; font-weight: 800; color: #d0f364; }
    .brand { font-family: var(--font-ui); font-size: 11px; font-weight: 700; color: #F8FAFC; letter-spacing: 0.1em; }
    @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    h2 { font-family: var(--font-ui); font-size: 18px; font-weight: 600; color: #F8FAFC; text-align: center; }
    .toast { padding: 10px 12px; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
    .error-toast { background: rgba(239,68,68,0.12); color: #EF4444; }
    .warn-toast { background: rgba(245,158,11,0.08); color: #F59E0B; }
    .google-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 10px; background: #fff; border: 1px solid rgba(255,255,255,0.04); border-radius: 4px; font-family: var(--font-ui); font-size: 13px; font-weight: 500; color: #333; transition: background 150ms; }
    .google-btn:hover { background: #f5f5f5; }
    .divider { display: flex; align-items: center; gap: 12px; color: #383E4A; font-size: 12px; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.04); }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .auth-input { width: 100%; height: 40px; padding: 0 14px; background: #12141C; border: 1px solid rgba(255,255,255,0.04); border-radius: 4px; color: #F8FAFC; font-family: var(--font-ui); font-size: 13px; }
    .auth-input:focus { border-color: rgba(208,243,100,0.12); outline: none; }
    .auth-input::placeholder { color: #383E4A; }
    .password-field { position: relative; }
    .password-field .auth-input { padding-right: 40px; }
    .toggle-pwd { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #606878; font-size: 16px; }
    .btn-volt { padding: 10px; background: #d0f364; color: #050505; border-radius: 4px; font-weight: 700; font-size: 14px; transition: opacity 150ms; }
    .btn-volt:disabled { opacity: 0.4; }
    .full { width: 100%; }
    .links { display: flex; flex-direction: column; gap: 8px; align-items: center; }
    .link-btn { font-size: 12px; color: #d0f364; }
    .link-volt { color: #d0f364; font-weight: 600; }
    .reset-inline { display: flex; flex-direction: column; gap: 6px; width: 100%; }
    .btn-outline-sm { padding: 6px 14px; border: 1px solid rgba(255,255,255,0.04); border-radius: 4px; color: #A0A8B8; font-size: 12px; align-self: flex-start; }
    .reset-msg { color: #34D399; font-size: 11px; }
  `]
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  resetEmail = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly showReset = signal(false);
  readonly resetMsg = signal('');
  readonly sessionExpired = signal(false);
  private returnUrl = '';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.returnUrl = params.get('returnUrl') || '';
    if (params.get('reason') === 'session_expired') this.sessionExpired.set(true);
  }

  async googleLogin(): Promise<void> {
    const err = await this.auth.loginWithGoogle();
    if (err) this.error.set(err);
  }

  async emailLogin(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const err = await this.auth.login(this.email, this.password);
    this.loading.set(false);
    if (err) {
      this.error.set(err);
      setTimeout(() => this.error.set(''), 5000);
    } else {
      this.auth.navigateAfterLogin(this.returnUrl);
    }
  }

  async sendReset(): Promise<void> {
    const err = await this.auth.resetPassword(this.resetEmail);
    this.resetMsg.set(err || 'Email enviado com link de redefinição');
  }
}
