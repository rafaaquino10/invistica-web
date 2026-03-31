import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'iq-button',
  standalone: true,
  template: `
    <button class="btn"
            [class]="'btn btn--' + variant() + ' btn--' + size()"
            [class.btn--loading]="loading()"
            [disabled]="disabled() || loading()"
            [attr.aria-busy]="loading()"
            (click)="clicked.emit($event)">
      @if (loading()) {
        <span class="btn__spinner"></span>
      }
      <ng-content />
    </button>
  `,
  styleUrl: './iq-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'ghost' | 'danger'>('primary');
  readonly size = input<'sm' | 'md'>('md');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly clicked = output<MouseEvent>();
}
