import { Component, ChangeDetectionStrategy, input, output, signal, OnInit, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { IqTickerLogoComponent } from '../iq-ticker-logo/iq-ticker-logo.component';

export interface SearchResult {
  label: string;
  value: string;
  subtitle?: string;
}

@Component({
  selector: 'iq-search',
  standalone: true,
  imports: [FormsModule, ClickOutsideDirective, IqTickerLogoComponent],
  template: `
    <div class="search" (iqClickOutside)="showResults.set(false)">
      <div class="search__bar">
        <svg class="search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input class="search__input"
               type="text"
               [placeholder]="placeholder()"
               [(ngModel)]="term"
               (ngModelChange)="onInput($event)"
               (focus)="showResults.set(true)" />
      </div>
      @if (showResults() && results().length > 0) {
        <ul class="search__results">
          @for (r of results(); track r.value) {
            <li class="search__item" (click)="onSelect(r)">
              <iq-ticker-logo [ticker]="r.value" [size]="20" />
              <span class="search__label">{{ r.label }}</span>
              @if (r.subtitle) {
                <span class="search__sub">{{ r.subtitle }}</span>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './iq-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqSearchComponent implements OnInit {
  readonly placeholder = input('Buscar...');
  readonly results = input<SearchResult[]>([]);
  readonly searchChange = output<string>();
  readonly resultSelect = output<SearchResult>();

  readonly term = signal('');
  readonly showResults = signal(false);
  private readonly input$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.input$.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(val => this.searchChange.emit(val));
  }

  onInput(val: string): void {
    this.input$.next(val);
    this.showResults.set(true);
  }

  onSelect(r: SearchResult): void {
    this.term.set(r.label);
    this.showResults.set(false);
    this.resultSelect.emit(r);
  }
}
