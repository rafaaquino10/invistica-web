import { Component, ChangeDetectionStrategy, input, output, signal, contentChildren, AfterContentInit, TemplateRef } from '@angular/core';

export interface TabDef {
  label: string;
  id: string;
}

@Component({
  selector: 'iq-tabs',
  standalone: true,
  template: `
    <div class="tabs">
      <div class="tabs__header">
        @for (tab of tabs(); track tab.id) {
          <button class="tabs__tab"
                  [class.tabs__tab--active]="activeId() === tab.id"
                  (click)="selectTab(tab.id)">
            {{ tab.label }}
          </button>
        }
        <div class="tabs__indicator" [style.transform]="indicatorTransform()" [style.width]="indicatorWidth()"></div>
      </div>
      <div class="tabs__content">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './iq-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqTabsComponent {
  readonly tabs = input<TabDef[]>([]);
  readonly activeId = signal('');
  readonly tabChange = output<string>();

  ngOnInit(): void {
    const t = this.tabs();
    if (t.length > 0 && !this.activeId()) {
      this.activeId.set(t[0].id);
    }
  }

  selectTab(id: string): void {
    this.activeId.set(id);
    this.tabChange.emit(id);
  }

  indicatorTransform(): string {
    const t = this.tabs();
    const idx = t.findIndex(tab => tab.id === this.activeId());
    if (idx < 0) return 'translateX(0)';
    return `translateX(${idx * 100}%)`;
  }

  indicatorWidth(): string {
    const t = this.tabs();
    if (t.length === 0) return '0';
    return `${100 / t.length}%`;
  }
}
