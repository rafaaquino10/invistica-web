import { Directive, input, ElementRef, inject, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[iqTooltip]',
  standalone: true,
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
  },
})
export class IqTooltipDirective implements OnDestroy {
  readonly iqTooltip = input.required<string>();
  readonly tooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('top');

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private tipEl: HTMLElement | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  show(): void {
    this.timeout = setTimeout(() => {
      if (this.tipEl) return;
      this.tipEl = this.renderer.createElement('div');
      this.renderer.setStyle(this.tipEl, 'position', 'absolute');
      this.renderer.setStyle(this.tipEl, 'background', 'var(--obsidian)');
      this.renderer.setStyle(this.tipEl, 'color', '#fff');
      this.renderer.setStyle(this.tipEl, 'padding', '4px 8px');
      this.renderer.setStyle(this.tipEl, 'borderRadius', '2px');
      this.renderer.setStyle(this.tipEl, 'fontSize', '11px');
      this.renderer.setStyle(this.tipEl, 'fontFamily', "'Satoshi', sans-serif");
      this.renderer.setStyle(this.tipEl, 'whiteSpace', 'nowrap');
      this.renderer.setStyle(this.tipEl, 'zIndex', '300');
      this.renderer.setStyle(this.tipEl, 'pointerEvents', 'none');
      this.renderer.setStyle(this.tipEl, 'animation', 'fadeIn 120ms ease');
      this.tipEl!.textContent = this.iqTooltip();

      document.body.appendChild(this.tipEl!);
      this.position();
    }, 200);
  }

  hide(): void {
    if (this.timeout) { clearTimeout(this.timeout); this.timeout = null; }
    if (this.tipEl) {
      this.tipEl.remove();
      this.tipEl = null;
    }
  }

  private position(): void {
    if (!this.tipEl) return;
    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tipRect = this.tipEl.getBoundingClientRect();
    const gap = 6;
    let top = 0, left = 0;

    switch (this.tooltipPosition()) {
      case 'top':
        top = hostRect.top - tipRect.height - gap;
        left = hostRect.left + (hostRect.width - tipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + gap;
        left = hostRect.left + (hostRect.width - tipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tipRect.height) / 2;
        left = hostRect.left - tipRect.width - gap;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tipRect.height) / 2;
        left = hostRect.right + gap;
        break;
    }

    this.renderer.setStyle(this.tipEl, 'top', `${top + window.scrollY}px`);
    this.renderer.setStyle(this.tipEl, 'left', `${left + window.scrollX}px`);
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
