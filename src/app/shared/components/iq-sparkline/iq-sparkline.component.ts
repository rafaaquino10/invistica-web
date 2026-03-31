import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'iq-sparkline',
  standalone: true,
  template: `
    <svg viewBox="0 0 80 24" class="sparkline" preserveAspectRatio="none">
      <polyline [attr.points]="points()" fill="none"
                [attr.stroke]="positive() ? 'var(--positive)' : 'var(--negative)'"
                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
  styles: [`
    .sparkline { width: 80px; height: 24px; display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqSparklineComponent {
  readonly data = input<number[]>([]);
  readonly positive = input(true);

  readonly points = computed(() => {
    const d = this.data();
    if (d.length < 2) return '';
    const min = Math.min(...d);
    const max = Math.max(...d);
    const range = max - min || 1;
    const stepX = 80 / (d.length - 1);
    return d.map((v, i) => `${(i * stepX).toFixed(1)},${(24 - ((v - min) / range) * 22 - 1).toFixed(1)}`).join(' ');
  });
}
