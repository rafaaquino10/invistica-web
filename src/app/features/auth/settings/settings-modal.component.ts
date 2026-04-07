import { Component, ChangeDetectionStrategy, inject, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'iq-settings-modal',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iq-modal (closed)="closed.emit()">
      <h2>Configurações</h2>

      <div class="tabs">
        @for (t of tabs; track t.id) {
          <button class="tab" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">{{ t.label }}</button>
        }
      </div>

      @switch (activeTab()) {
        @case ('profile') {
          <div class="section">
            <div class="avatar-row">
              @if (auth.userProfile().avatarUrl) {
                <img class="avatar" [src]="auth.userProfile().avatarUrl!" [alt]="auth.userProfile().name" />
              } @else {
                <div class="avatar-placeholder"><span>{{ auth.userProfile().name.slice(0,2).toUpperCase() }}</span></div>
              }
              <div class="avatar-info">
                <span class="email label">{{ auth.userProfile().email }}</span>
                <span class="since label">Membro desde {{ auth.currentUser()?.created_at?.slice(0,10) || '--' }}</span>
              </div>
            </div>
            <div class="field"><label class="label">Nome</label><input class="s-input" type="text" [(ngModel)]="editName" /></div>
            <button class="btn-volt" (click)="saveProfile()">{{ profileMsg() || 'Salvar' }}</button>
          </div>
        }
        @case ('appearance') {
          <div class="section">
            <div class="toggle-row">
              <span class="label">Modo escuro</span>
              <button class="theme-toggle" (click)="theme.toggle()">
                <i class="ph ph-{{ theme.theme() === 'dark' ? 'sun' : 'moon' }}"></i>
                {{ theme.theme() === 'dark' ? 'Dark' : 'Light' }}
              </button>
            </div>
          </div>
        }
        @case ('notifications') {
          <div class="section">
            @for (n of notifications; track n.key) {
              <label class="toggle-row">
                <div><span class="label">{{ n.label }}</span><span class="toggle-desc">{{ n.desc }}</span></div>
                <span class="badge-soon label">(Em breve)</span>
              </label>
            }
          </div>
        }
        @case ('account') {
          <div class="section">
            <button class="btn-outline" (click)="showPasswordChange.set(!showPasswordChange())">Alterar senha</button>
            @if (showPasswordChange()) {
              <div class="field"><label class="label">Nova senha</label><input class="s-input" type="password" [(ngModel)]="newPassword" /></div>
              <div class="field"><label class="label">Confirmar</label><input class="s-input" type="password" [(ngModel)]="confirmNewPassword" /></div>
              <button class="btn-volt" [disabled]="newPassword.length < 6 || newPassword !== confirmNewPassword" (click)="changePassword()">{{ passwordMsg() || 'Atualizar senha' }}</button>
            }
            <div class="danger-zone">
              <button class="btn-danger" (click)="showDeleteConfirm.set(true)">Excluir conta</button>
              @if (showDeleteConfirm()) {
                <div class="delete-confirm">
                  <p class="label">Esta ação é irreversível. Digite <strong>EXCLUIR</strong> para confirmar.</p>
                  <input class="s-input" type="text" [(ngModel)]="deleteConfirmText" placeholder="EXCLUIR" />
                  <button class="btn-danger" [disabled]="deleteConfirmText !== 'EXCLUIR'" (click)="deleteAccount()">Confirmar exclusão</button>
                </div>
              }
              <p class="lgpd-text">Seus dados serão removidos conforme a Lei Geral de Proteção de Dados (LGPD).</p>
            </div>
          </div>
        }
      }
    </iq-modal>
  `,
  styles: [`
    h2 { font-family: var(--font-ui); font-size: 17px; font-weight: 600; color: var(--t1); margin-bottom: 12px; }
    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
    .tab { padding: 6px 12px; font-family: var(--font-ui); font-size: 12px; color: var(--t3); border-bottom: 2px solid transparent; }
    .tab.active { color: var(--volt); border-bottom-color: var(--volt); font-weight: 700; }
    .section { display: flex; flex-direction: column; gap: 12px; }
    .avatar-row { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .avatar-placeholder { width: 48px; height: 48px; border-radius: 50%; background: var(--elevated); display: flex; align-items: center; justify-content: center; font-family: var(--font-ui); font-size: 16px; font-weight: 700; color: var(--t3); }
    .avatar-info { display: flex; flex-direction: column; gap: 2px; }
    .email { color: var(--t2); font-size: 13px; }
    .since { color: var(--t4); font-size: 11px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .s-input { height: 36px; padding: 0 12px; background: var(--bg-alt); border: 1px solid var(--border); border-radius: var(--radius); color: var(--t1); font-family: var(--font-ui); font-size: 13px; }
    .s-input:focus { border-color: var(--border-active); outline: none; }
    .btn-volt { padding: 8px 16px; background: var(--volt); color: #050505; border-radius: var(--radius); font-weight: 700; font-size: 12px; align-self: flex-start; }
    .btn-volt:disabled { opacity: 0.4; }
    .btn-outline { padding: 8px 16px; border: 1px solid var(--border); color: var(--t2); border-radius: var(--radius); font-size: 12px; align-self: flex-start; }
    .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
    .toggle-desc { display: block; font-size: 10px; color: var(--t4); }
    .badge-soon { color: var(--t4); font-size: 10px; }
    .theme-toggle { padding: 4px 10px; border: 1px solid var(--border); border-radius: var(--radius); color: var(--t2); font-size: 12px; display: flex; align-items: center; gap: 6px; }
    .danger-zone { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }
    .btn-danger { padding: 8px 16px; background: var(--neg); color: #fff; border-radius: var(--radius); font-weight: 700; font-size: 12px; align-self: flex-start; }
    .btn-danger:disabled { opacity: 0.4; }
    .delete-confirm { display: flex; flex-direction: column; gap: 6px; }
    .lgpd-text { font-size: 9px; color: var(--t4); }
  `]
})
export class SettingsModalComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly closed = output<void>();

  readonly activeTab = signal('profile');
  readonly showPasswordChange = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly profileMsg = signal('');
  readonly passwordMsg = signal('');

  editName = this.auth.userProfile().name;
  newPassword = ''; confirmNewPassword = ''; deleteConfirmText = '';

  readonly tabs = [
    { id: 'profile', label: 'Perfil' },
    { id: 'appearance', label: 'Aparência' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'account', label: 'Conta' },
  ];

  readonly notifications = [
    { key: 'score_alerts', label: 'Alertas de score', desc: 'Quando o score de um ativo da carteira mudar significativamente' },
    { key: 'cvm_alerts', label: 'Fatos relevantes', desc: 'Quando a CVM publicar fato relevante de ativo na carteira' },
    { key: 'div_alerts', label: 'Dividendos', desc: 'Quando uma data-com de ativo na carteira se aproximar' },
    { key: 'weekly', label: 'Relatório semanal', desc: 'Resumo semanal da carteira e mercado por email' },
  ];

  async saveProfile(): Promise<void> {
    const err = await this.auth.updateProfile({ full_name: this.editName });
    this.profileMsg.set(err || 'Salvo!');
    setTimeout(() => this.profileMsg.set(''), 2000);
  }

  async changePassword(): Promise<void> {
    const err = await this.auth.updatePassword(this.newPassword);
    this.passwordMsg.set(err || 'Senha atualizada!');
    setTimeout(() => { this.passwordMsg.set(''); this.showPasswordChange.set(false); }, 2000);
  }

  async deleteAccount(): Promise<void> {
    localStorage.setItem('iq-account-deleted', 'true');
    await this.auth.logout();
  }
}
