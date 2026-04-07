import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'iq-register',
  standalone: true,
  imports: [FormsModule, RouterLink, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      @if (verificationSent()) {
        <div class="auth-card glass verify-card">
          <i class="ph-fill ph-check-circle verify-icon"></i>
          <h2>Verifique seu email</h2>
          <p>Enviamos um link de confirmação para <strong>{{ registeredEmail }}</strong>. Clique no link para ativar sua conta.</p>
          <a class="link-volt" routerLink="/entrar">Voltar ao login</a>
        </div>
      } @else {
        <div class="auth-card glass">
          <div class="auth-logo">
            <iq-logo size="lg" />
          </div>

          <h2>Criar sua conta</h2>

          @if (error()) {
            <div class="toast error-toast"><i class="ph ph-warning"></i> {{ error() }}</div>
          }

          <button class="google-btn" (click)="googleRegister()">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            <span>Continuar com Google</span>
          </button>

          <div class="divider"><span>ou</span></div>

          <form (ngSubmit)="register()">
            <div class="field"><label class="label">Nome completo</label><input class="auth-input" type="text" autocomplete="name" [(ngModel)]="name" name="name" required minlength="2" /></div>
            <div class="field"><label class="label">Email</label><input class="auth-input" type="email" autocomplete="email" [(ngModel)]="email" name="email" required /></div>
            <div class="field">
              <label class="label">Senha</label>
              <div class="password-field">
                <input class="auth-input" [type]="showPassword() ? 'text' : 'password'" autocomplete="new-password" [(ngModel)]="password" name="password" required minlength="6" />
                <button type="button" class="toggle-pwd" (click)="showPassword.set(!showPassword())"><i class="ph ph-{{ showPassword() ? 'eye-closed' : 'eye' }}"></i></button>
              </div>
              <div class="strength-bar"><div class="strength-fill" [style.width.%]="strengthPct()" [style.background]="strengthColor()"></div></div>
            </div>
            <div class="field"><label class="label">Confirmar senha</label><input class="auth-input" type="password" autocomplete="new-password" [(ngModel)]="confirmPassword" name="confirmPassword" required /></div>
            <label class="checkbox-row"><input type="checkbox" [(ngModel)]="termsAccepted" name="terms" /> <span class="label">Li e aceito os <a href="#" class="link-volt">Termos de Uso</a> e a <a href="#" class="link-volt">Política de Privacidade</a></span></label>
            <button class="btn-volt full" type="submit" [disabled]="!canSubmit() || loading()">{{ loading() ? 'Criando...' : 'Criar conta' }}</button>
          </form>

          <span class="label center">Já tem conta? <a class="link-volt" routerLink="/entrar">Entrar</a></span>
        </div>
      }
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #050505; padding: 24px; }
    .auth-card { max-width: 420px; width: 100%; padding: 32px; border-radius: 4px; display: flex; flex-direction: column; gap: 14px; }
    .auth-logo { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .logo-box { width: 48px; height: 48px; border-radius: 12px; background: #12141C; display: flex; align-items: center; justify-content: center; animation: pulse 2s ease-in-out infinite; box-shadow: 0 0 16px rgba(208,243,100,0.2); }
    .logo-iq { font-size: 20px; font-weight: 800; color: #d0f364; }
    .brand { font-family: var(--font-ui); font-size: 11px; font-weight: 700; color: #F8FAFC; letter-spacing: 0.1em; }
    @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    h2 { font-family: var(--font-ui); font-size: 18px; font-weight: 600; color: #F8FAFC; text-align: center; }
    .toast { padding: 10px 12px; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
    .error-toast { background: rgba(239,68,68,0.12); color: #EF4444; }
    .google-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 10px; background: #fff; border: 1px solid rgba(255,255,255,0.04); border-radius: 4px; font-family: var(--font-ui); font-size: 13px; font-weight: 500; color: #333; }
    .google-btn:hover { background: #f5f5f5; }
    .divider { display: flex; align-items: center; gap: 12px; color: #383E4A; font-size: 12px; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.04); }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .auth-input { width: 100%; height: 40px; padding: 0 14px; background: #12141C; border: 1px solid rgba(255,255,255,0.04); border-radius: 4px; color: #F8FAFC; font-family: var(--font-ui); font-size: 13px; }
    .auth-input:focus { border-color: rgba(208,243,100,0.12); outline: none; }
    .password-field { position: relative; }
    .password-field .auth-input { padding-right: 40px; }
    .toggle-pwd { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #606878; font-size: 16px; }
    .strength-bar { height: 3px; background: #242630; border-radius: 2px; overflow: hidden; margin-top: 2px; }
    .strength-fill { height: 100%; border-radius: 2px; transition: all 200ms; }
    .checkbox-row { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; }
    .checkbox-row input { accent-color: #d0f364; margin-top: 2px; }
    .link-volt { color: #d0f364; }
    .btn-volt { padding: 10px; background: #d0f364; color: #050505; border-radius: 4px; font-weight: 700; font-size: 14px; }
    .btn-volt:disabled { opacity: 0.4; }
    .full { width: 100%; }
    .center { text-align: center; }
    .verify-card { align-items: center; text-align: center; }
    .verify-icon { font-size: 48px; color: #34D399; }
    .verify-card p { font-size: 14px; color: #A0A8B8; line-height: 1.6; }
  `]
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);

  name = ''; email = ''; password = ''; confirmPassword = '';
  termsAccepted = false; registeredEmail = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly verificationSent = signal(false);

  canSubmit = () => this.name.length >= 2 && this.email.includes('@') && this.password.length >= 6 && this.password === this.confirmPassword && this.termsAccepted;

  strengthPct = () => {
    const p = this.password;
    if (p.length < 6) return (p.length / 6) * 33;
    let score = 33;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 17;
    if (/\d/.test(p)) score += 17;
    if (/[^A-Za-z0-9]/.test(p)) score += 16;
    if (p.length >= 10) score += 17;
    return Math.min(score, 100);
  };

  strengthColor = () => {
    const p = this.strengthPct();
    if (p < 40) return '#EF4444';
    if (p < 70) return '#F59E0B';
    return '#34D399';
  };

  async googleRegister(): Promise<void> {
    const err = await this.auth.loginWithGoogle();
    if (err) this.error.set(err);
  }

  async register(): Promise<void> {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    this.error.set('');
    const { error, needsVerification } = await this.auth.register(this.email, this.password, this.name);
    this.loading.set(false);
    if (error) { this.error.set(error); return; }
    if (needsVerification) { this.registeredEmail = this.email; this.verificationSent.set(true); }
    else { this.auth.navigateAfterLogin(); }
  }
}
