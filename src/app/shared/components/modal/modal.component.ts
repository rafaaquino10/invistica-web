import { Component, ChangeDetectionStrategy, output, HostListener } from '@angular/core';

@Component({
  selector: 'iq-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="onBackdrop($event)">
      <div class="modal glass" (click)="$event.stopPropagation()">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0; z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
    }
    .modal {
      width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto;
      padding: 24px; border-radius: var(--radius);
    }
  `]
})
export class ModalComponent {
  closed = output<void>();

  @HostListener('document:keydown.escape')
  onEsc(): void { this.closed.emit(); }

  onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.closed.emit();
  }
}
