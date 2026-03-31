import { Component, ChangeDetectionStrategy, input, output, signal, computed, ElementRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

export interface DropdownOption {
  label: string;
  value: string;
}

@Component({
  selector: 'iq-dropdown',
  standalone: true,
  imports: [FormsModule, ClickOutsideDirective],
  template: `
    <div class="dropdown" (iqClickOutside)="close()">
      <button class="dropdown__trigger" (click)="toggle()" [class.dropdown__trigger--open]="open()">
        <span class="dropdown__text">{{ displayText() }}</span>
        <svg class="dropdown__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      @if (open()) {
        <div class="dropdown__panel">
          @if (options().length > 5) {
            <input class="dropdown__search"
                   type="text"
                   placeholder="Buscar..."
                   [(ngModel)]="searchTerm"
                   (keydown)="onKeydown($event)" />
          }
          <ul class="dropdown__list" role="listbox">
            @for (opt of filtered(); track opt.value; let i = $index) {
              <li class="dropdown__item"
                  role="option"
                  [class.dropdown__item--active]="i === activeIndex()"
                  [class.dropdown__item--selected]="isSelected(opt)"
                  (click)="select(opt)"
                  (mouseenter)="activeIndex.set(i)">
                @if (multi()) {
                  <span class="dropdown__check" [class.dropdown__check--on]="isSelected(opt)"></span>
                }
                {{ opt.label }}
              </li>
            } @empty {
              <li class="dropdown__empty">Nenhum resultado</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styleUrl: './iq-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqDropdownComponent {
  readonly options = input<DropdownOption[]>([]);
  readonly placeholder = input('Selecione');
  readonly multi = input(false);
  readonly selectionChange = output<DropdownOption | DropdownOption[]>();

  readonly open = signal(false);
  readonly searchTerm = signal('');
  readonly activeIndex = signal(0);
  readonly selected = signal<DropdownOption[]>([]);

  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.options();
    return this.options().filter(o => o.label.toLowerCase().includes(term));
  });

  readonly displayText = computed(() => {
    const sel = this.selected();
    if (sel.length === 0) return this.placeholder();
    if (this.multi()) return `${sel.length} selecionado${sel.length > 1 ? 's' : ''}`;
    return sel[0].label;
  });

  toggle(): void {
    this.open.update(v => !v);
    if (this.open()) {
      this.searchTerm.set('');
      this.activeIndex.set(0);
    }
  }

  close(): void {
    this.open.set(false);
  }

  select(opt: DropdownOption): void {
    if (this.multi()) {
      this.selected.update(sel => {
        const exists = sel.some(s => s.value === opt.value);
        const next = exists ? sel.filter(s => s.value !== opt.value) : [...sel, opt];
        this.selectionChange.emit(next);
        return next;
      });
    } else {
      this.selected.set([opt]);
      this.selectionChange.emit(opt);
      this.close();
    }
  }

  isSelected(opt: DropdownOption): boolean {
    return this.selected().some(s => s.value === opt.value);
  }

  onKeydown(e: KeyboardEvent): void {
    const list = this.filtered();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex.update(i => Math.min(i + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex.update(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = list[this.activeIndex()];
      if (item) this.select(item);
    } else if (e.key === 'Escape') {
      this.close();
    }
  }
}
