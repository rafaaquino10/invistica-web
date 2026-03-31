import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'iq-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="input-wrap" [class.input-wrap--focused]="focused()" [class.input-wrap--error]="!!error()" [class.input-wrap--disabled]="disabled()">
      <label class="input-wrap__label" [class.input-wrap__label--float]="focused() || !!value()">
        {{ label() }}
      </label>
      <input class="input-wrap__field"
             [type]="type()"
             [placeholder]="focused() ? placeholder() : ''"
             [disabled]="disabled()"
             [(ngModel)]="value"
             (focus)="focused.set(true)"
             (blur)="focused.set(false)"
             (ngModelChange)="valueChange.emit($event)" />
    </div>
    @if (error()) {
      <span class="input-wrap__error">{{ error() }}</span>
    }
  `,
  styleUrl: './iq-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqInputComponent {
  readonly label = input('');
  readonly type = input('text');
  readonly placeholder = input('');
  readonly error = input('');
  readonly disabled = input(false);
  readonly value = signal('');
  readonly valueChange = output<string>();
  readonly focused = signal(false);
}
