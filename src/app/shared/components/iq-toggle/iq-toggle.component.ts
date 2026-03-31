import { Component, ChangeDetectionStrategy, model } from '@angular/core';

@Component({
  selector: 'iq-toggle',
  standalone: true,
  template: `
    <button class="toggle" [class.toggle--on]="checked()" (click)="checked.set(!checked())" role="switch" [attr.aria-checked]="checked()">
      <span class="toggle__track">
        <span class="toggle__thumb"></span>
      </span>
    </button>
  `,
  styles: [`
    .toggle {
      display: inline-flex;
      border: none;
      background: transparent;
      padding: 0;
      cursor: pointer;
    }
    .toggle__track {
      width: 36px;
      height: 20px;
      background: var(--surface-3);
      border-radius: 10px;
      position: relative;
      transition: background var(--duration-fast) var(--ease);
    }
    .toggle--on .toggle__track {
      background: var(--btn-primary-bg);
    }
    .toggle__thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 50%;
      transition: transform var(--duration-fast) var(--ease);
    }
    .toggle--on .toggle__thumb {
      transform: translateX(16px);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqToggleComponent {
  readonly checked = model(false);
}
