import { Component, ChangeDetectionStrategy, input, computed, signal, OnInit } from '@angular/core';
import { Rating, RATING_COLORS } from '../../../core/models/score.model';

@Component({
  selector: 'iq-score-gauge',
  standalone: true,
  template: `
    <div class="gauge" [class]="'gauge gauge--' + size()">
      <svg [attr.viewBox]="'0 0 ' + svgSize() + ' ' + svgSize()">
        <!-- background arc -->
        <circle class="gauge__bg"
                [attr.cx]="center()" [attr.cy]="center()" [attr.r]="radius()"
                fill="none" [attr.stroke-width]="strokeWidth()"
                [attr.stroke-dasharray]="circumference()"
                [attr.stroke-dashoffset]="bgOffset()"
                [attr.transform]="arcRotation()" />
        <!-- value arc -->
        <circle class="gauge__fill"
                [attr.cx]="center()" [attr.cy]="center()" [attr.r]="radius()"
                fill="none" [attr.stroke-width]="strokeWidth()"
                [attr.stroke]="arcColor()"
                [attr.stroke-dasharray]="circumference()"
                [attr.stroke-dashoffset]="fillOffset()"
                [attr.transform]="arcRotation()"
                stroke-linecap="round" />
      </svg>
      <div class="gauge__label">
        <span class="gauge__score mono">{{ animatedScore() }}</span>
      </div>
    </div>
  `,
  styleUrl: './iq-score-gauge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqScoreGaugeComponent implements OnInit {
  readonly score = input(0);
  readonly rating = input<Rating>('HOLD');
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly animatedScore = signal(0);

  private readonly ARC_DEGREES = 270;
  private readonly ARC_FRACTION = this.ARC_DEGREES / 360;

  readonly svgSize = computed(() => {
    const s = this.size();
    return s === 'sm' ? 80 : s === 'md' ? 120 : 160;
  });

  readonly strokeWidth = computed(() => {
    const s = this.size();
    return s === 'sm' ? 6 : s === 'md' ? 8 : 10;
  });

  readonly center = computed(() => this.svgSize() / 2);
  readonly radius = computed(() => (this.svgSize() - this.strokeWidth()) / 2);
  readonly circumference = computed(() => 2 * Math.PI * this.radius());

  readonly bgOffset = computed(() => {
    return this.circumference() * (1 - this.ARC_FRACTION);
  });

  readonly fillOffset = computed(() => {
    const pct = Math.min(this.score(), 100) / 100;
    const arcLen = this.circumference() * this.ARC_FRACTION;
    return this.circumference() - arcLen * pct;
  });

  readonly arcRotation = computed(() => {
    const c = this.center();
    return `rotate(${135}, ${c}, ${c})`;
  });

  readonly arcColor = computed(() => {
    const colors = RATING_COLORS[this.rating()];
    return colors?.text ?? 'var(--obsidian)';
  });

  ngOnInit(): void {
    const target = this.score();
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      this.animatedScore.set(current);
      if (current >= target) clearInterval(interval);
    }, 20);
  }
}
