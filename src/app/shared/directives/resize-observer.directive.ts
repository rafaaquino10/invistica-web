import { Directive, ElementRef, output, inject, OnInit, OnDestroy } from '@angular/core';

export interface ResizeEntry {
  width: number;
  height: number;
}

@Directive({
  selector: '[iqResizeObserver]',
  standalone: true,
})
export class ResizeObserverDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  readonly iqResizeObserver = output<ResizeEntry>();
  private observer?: ResizeObserver;

  ngOnInit(): void {
    this.observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      this.iqResizeObserver.emit({ width, height });
    });
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
