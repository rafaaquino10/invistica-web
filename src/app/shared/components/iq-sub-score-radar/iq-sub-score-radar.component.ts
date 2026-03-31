import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface SubScores {
  valuation: number | null;
  quality: number | null;
  risk: number | null;
  dividends: number | null;
  growth: number | null;
  momentum: number | null;
}

const LABELS = ['Valuation', 'Qualidade', 'Risco', 'Dividendos', 'Crescimento', 'Momentum'];
const SIZE = 200;
const CENTER = SIZE / 2;
const MAX_R = 70;
const AXES = 6;

function polarToXY(angle: number, r: number): [number, number] {
  const rad = (angle - 90) * (Math.PI / 180);
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)];
}

@Component({
  selector: 'iq-sub-score-radar',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 ' + size + ' ' + size" class="radar">
      <!-- grid hexagons -->
      @for (level of [0.25, 0.5, 0.75, 1]; track level) {
        <polygon [attr.points]="gridPoints(level)" class="radar__grid" />
      }
      <!-- axes -->
      @for (i of axisIndices; track i) {
        <line [attr.x1]="center" [attr.y1]="center"
              [attr.x2]="axisEnd(i)[0]" [attr.y2]="axisEnd(i)[1]"
              class="radar__axis" />
      }
      <!-- data polygon -->
      <polygon [attr.points]="dataPoints()" class="radar__data" />
      <!-- labels + scores -->
      @for (i of axisIndices; track i) {
        <text [attr.x]="labelPos(i)[0]" [attr.y]="labelPos(i)[1]"
              class="radar__label" text-anchor="middle" dominant-baseline="middle">
          {{ labels[i] }}
        </text>
        <text [attr.x]="scorePos(i)[0]" [attr.y]="scorePos(i)[1]"
              class="radar__score" text-anchor="middle" dominant-baseline="middle">
          {{ scoreValues()[i] ?? '—' }}
        </text>
      }
    </svg>
  `,
  styles: [`
    .radar { width: 100%; max-width: 240px; }
    .radar__grid { fill: none; stroke: var(--surface-3); stroke-width: 0.5; }
    .radar__axis { stroke: var(--surface-3); stroke-width: 0.5; }
    .radar__data { fill: rgba(61,61,58,0.1); stroke: var(--obsidian); stroke-width: 1.5; }
    .radar__label { font-size: 9px; fill: var(--text-tertiary); font-family: 'Satoshi', sans-serif; }
    .radar__score { font-size: 10px; fill: var(--text-primary); font-family: 'IBM Plex Mono', monospace; font-weight: 600; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqSubScoreRadarComponent {
  readonly scores = input.required<SubScores>();
  readonly size = SIZE;
  readonly center = CENTER;
  readonly labels = LABELS;
  readonly axisIndices = [0, 1, 2, 3, 4, 5];

  readonly scoreValues = computed(() => {
    const s = this.scores();
    return [s.valuation, s.quality, s.risk, s.dividends, s.growth, s.momentum];
  });

  gridPoints(level: number): string {
    return Array.from({ length: AXES }, (_, i) => {
      const angle = (360 / AXES) * i;
      return polarToXY(angle, MAX_R * level).join(',');
    }).join(' ');
  }

  axisEnd(i: number): [number, number] {
    return polarToXY((360 / AXES) * i, MAX_R);
  }

  labelPos(i: number): [number, number] {
    return polarToXY((360 / AXES) * i, MAX_R + 18);
  }

  scorePos(i: number): [number, number] {
    return polarToXY((360 / AXES) * i, MAX_R + 30);
  }

  dataPoints(): string {
    const vals = this.scoreValues();
    return vals.map((v, i) => {
      const r = ((v ?? 0) / 100) * MAX_R;
      return polarToXY((360 / AXES) * i, r).join(',');
    }).join(' ');
  }
}
