import { Component, ChangeDetectionStrategy, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'iq-slider',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="slider">
      <input class="slider__range"
             type="range"
             [min]="min()"
             [max]="max()"
             [step]="step()"
             [(ngModel)]="value" />
      <span class="slider__value mono">{{ value() }}</span>
    </div>
  `,
  styles: [`
    @use 'typography' as t;
    .slider {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    .slider__range {
      flex: 1;
      height: 4px;
      appearance: none;
      background: var(--surface-3);
      border-radius: var(--radius);
      outline: none;
      &::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        background: var(--obsidian);
        border-radius: 50%;
        cursor: pointer;
      }
      &::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: var(--obsidian);
        border: none;
        border-radius: 50%;
        cursor: pointer;
      }
    }
    .slider__value {
      font-family: t.$font-mono;
      font-size: t.$text-sm;
      font-weight: 500;
      color: var(--text-primary);
      min-width: 40px;
      text-align: right;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqSliderComponent {
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly value = model(50);
}
