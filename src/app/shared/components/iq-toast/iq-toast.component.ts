import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService, Toast } from './iq-toast.service';

@Component({
  selector: 'iq-toast',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast--' + toast.type">
          <span class="toast__msg">{{ toast.message }}</span>
          <button class="toast__close" (click)="toastService.dismiss(toast.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: var(--space-4);
      right: var(--space-4);
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .toast {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius);
      border: 1px solid;
      font-size: 0.75rem;
      min-width: 280px;
      max-width: 400px;
      animation: slideIn 0.2s var(--ease);
      box-shadow: var(--shadow-md);
    }
    .toast--success { background: var(--positive-bg); border-color: var(--positive-border); color: var(--positive); }
    .toast--error { background: var(--negative-bg); border-color: var(--negative-border); color: var(--negative); }
    .toast--warning { background: var(--warning-bg); border-color: var(--warning-border); color: var(--warning); }
    .toast--info { background: var(--info-bg); border-color: var(--info-border); color: var(--info); }
    .toast__msg { flex: 1; }
    .toast__close {
      display: flex;
      border: none;
      background: transparent;
      color: inherit;
      cursor: pointer;
      opacity: 0.6;
      &:hover { opacity: 1; }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqToastComponent {
  readonly toastService = inject(ToastService);
}
