import { Component, ChangeDetectionStrategy, input, output, effect, ElementRef, inject } from '@angular/core';

@Component({
  selector: 'iq-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="modal-overlay" (click)="onOverlayClick($event)" (keydown.escape)="close.emit()">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal__header">
            <h2 class="modal__title">{{ title() }}</h2>
            <button class="modal__close" (click)="close.emit()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal__body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './iq-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly close = output<void>();

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }
}
