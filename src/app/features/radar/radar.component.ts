import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'iq-radar',
  standalone: true,
  template: `
    <div class="placeholder">
      <h1>Radar</h1>
      <p>Em construção</p>
    </div>
  `,
  styles: [`
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-tertiary);

      h1 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarComponent {}
