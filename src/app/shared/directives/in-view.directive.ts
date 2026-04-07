import { Directive, ElementRef, output, OnInit, OnDestroy, inject } from '@angular/core';

@Directive({ selector: '[iqInView]', standalone: true })
export class InViewDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  readonly inView = output<boolean>();
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.inView.emit(true);
          this.el.nativeElement.classList.add('in-view');
          this.observer?.unobserve(this.el.nativeElement);
        }
      },
      { threshold: 0.15 }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
