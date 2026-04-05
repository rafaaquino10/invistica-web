import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'iq-skeleton',
  standalone: true,
  template: `<div class="skeleton" [class]="'skeleton skeleton--' + variant()" [style.width]="width()" [style.height]="height()"></div>`,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s ease-in-out infinite;
      border-radius: var(--radius);
    }
    .skeleton--text { height: 14px; border-radius: var(--radius); }
    .skeleton--circle { border-radius: 50%; }
    .skeleton--rect { border-radius: var(--radius); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqSkeletonComponent {
  readonly width = input('100%');
  readonly height = input('14px');
  readonly variant = input<'text' | 'circle' | 'rect'>('text');
}
