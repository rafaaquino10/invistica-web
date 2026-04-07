import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { ThesisConfig } from '../thesis-config';

@Component({
  selector: 'iq-thesis-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs">
      @for (t of theses(); track t.id) {
        <button class="tab" [class.active]="activeId() === t.id" (click)="select(t.id)">
          <i class="ph ph-{{ t.icon }} tab-icon"></i>
          <span class="tab-name">{{ t.name }}</span>
          <span class="tab-tag">{{ t.tagline }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .tabs { display: flex; gap: 8px; flex-wrap: wrap; }
    .tab {
      flex: 1; min-width: 150px; display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 14px 12px; background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); cursor: pointer;
      transition: all var(--transition-fast); text-align: center;
    }
    .tab:hover { border-color: var(--border-hover); background: var(--card-hover); }
    .tab.active { border-color: var(--volt); background: var(--volt-dim); }
    .tab-icon { font-size: 20px; color: var(--t3); }
    .tab.active .tab-icon { color: var(--volt); }
    .tab-name { font-family: var(--font-ui); font-size: 12px; font-weight: 700; color: var(--t1); }
    .tab-tag { font-family: var(--font-ui); font-size: 9px; color: var(--t3); line-height: 1.3; }
    .tab.active .tab-name { color: var(--volt); }
  `]
})
export class ThesisSelectorComponent {
  theses = input.required<ThesisConfig[]>();
  activeId = input.required<string>();
  thesisChanged = output<string>();

  select(id: string): void { this.thesisChanged.emit(id); }
}
