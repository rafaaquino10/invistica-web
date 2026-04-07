import { Directive, ElementRef, input, OnInit, OnDestroy, inject } from '@angular/core';

@Directive({ selector: '[iqCountUp]', standalone: true })
export class CountUpDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  iqCountUp = input.required<number>();
  countDuration = input(800);
  countDecimals = input(0);
  countPrefix = input('');
  countSuffix = input('');

  private observer: IntersectionObserver | null = null;
  private animated = false;

  ngOnInit(): void {
    this.el.nativeElement.textContent = `${this.countPrefix()}0${this.countSuffix()}`;
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.animated) {
          this.animated = true;
          this.animate();
          this.observer?.unobserve(this.el.nativeElement);
        }
      },
      { threshold: 0.3 }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private animate(): void {
    const target = this.iqCountUp();
    const duration = this.countDuration();
    const decimals = this.countDecimals();
    const prefix = this.countPrefix();
    const suffix = this.countSuffix();
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = target * eased;
      this.el.nativeElement.textContent = `${prefix}${current.toFixed(decimals)}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
