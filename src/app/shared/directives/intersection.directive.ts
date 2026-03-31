import { Directive, ElementRef, output, inject, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[iqIntersection]',
  standalone: true,
})
export class IntersectionDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  readonly iqIntersection = output<boolean>();
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => this.iqIntersection.emit(entry.isIntersecting),
      { threshold: 0.1 },
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
