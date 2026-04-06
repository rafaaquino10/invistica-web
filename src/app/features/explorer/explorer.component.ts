import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'iq-explorer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-placeholder">
      <h1>explorar</h1>
      <p class="label">Em construção</p>
    </div>
  `,
  styles: [`
    .page-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 8px;
    }
    h1 {
      font-family: var(--font-ui);
      font-size: 21px;
      font-weight: 700;
      color: var(--t1);
    }
    p {
      color: var(--t3);
    }
  `]
})
export class ExplorerComponent {}
