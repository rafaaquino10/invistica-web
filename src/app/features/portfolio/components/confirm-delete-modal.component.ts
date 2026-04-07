import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'iq-confirm-delete-modal',
  standalone: true,
  imports: [ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iq-modal (closed)="closed.emit()">
      <h2>Remover posição</h2>
      <p class="msg">Remover <strong class="mono">{{ ticker() }}</strong> da carteira?</p>
      <p class="detail label">Qtd: <span class="mono">{{ quantity() }}</span> · PM: <span class="mono">R$ {{ avgPrice().toFixed(2) }}</span></p>
      <div class="actions">
        <button class="btn-outline cta" (click)="closed.emit()">Cancelar</button>
        <button class="btn-danger cta" (click)="confirm()">Remover</button>
      </div>
    </iq-modal>
  `,
  styles: [`
    h2 { font-family: var(--font-ui); font-size: 17px; font-weight: 600; color: var(--t1); margin-bottom: 12px; }
    .msg { font-size: 14px; color: var(--t1); margin-bottom: 4px; }
    .detail { color: var(--t3); margin-bottom: 16px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-outline { padding: 8px 20px; border: 1px solid var(--border); color: var(--t2); border-radius: var(--radius); }
    .btn-danger { padding: 8px 20px; background: var(--neg); color: #fff; border-radius: var(--radius); font-weight: 700; }
  `]
})
export class ConfirmDeleteModalComponent {
  private readonly api = inject(ApiService);
  positionId = input.required<string>();
  ticker = input('');
  quantity = input(0);
  avgPrice = input(0);
  closed = output<void>();
  deleted = output<void>();

  confirm(): void {
    this.api.delete(`/portfolio/positions/${this.positionId()}`).subscribe({
      next: () => this.deleted.emit(),
      error: () => this.deleted.emit(),
    });
  }
}
