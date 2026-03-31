import { Directive, ElementRef, output, inject, OnDestroy } from '@angular/core';

@Directive({
  selector: '[iqClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective implements OnDestroy {
  private readonly el = inject(ElementRef);
  readonly iqClickOutside = output<void>();

  private readonly handler = (e: MouseEvent) => {
    if (!this.el.nativeElement.contains(e.target)) {
      this.iqClickOutside.emit();
    }
  };

  constructor() {
    document.addEventListener('click', this.handler, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handler, true);
  }
}
