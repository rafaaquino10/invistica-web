import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'iq-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="logo" [style.gap.px]="gap()">
      <span class="invest" [style.font-size.px]="textSize()">Invest</span>
      <span class="badge mono" [style.font-size.px]="badgeSize()" [style.padding]="badgePad()">IQ</span>
    </span>
  `,
  styles: [`
    .logo {
      display: inline-flex;
      align-items: center;
    }
    .invest {
      font-family: var(--font-ui);
      font-weight: 700;
      color: var(--t1);
      line-height: 1;
    }
    .badge {
      font-weight: 900;
      color: #050505;
      background: var(--volt);
      border-radius: 4px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class LogoComponent {
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  private readonly config = computed(() => {
    switch (this.size()) {
      case 'sm': return { text: 12, badge: 12, pad: '2px 4px', gap: 4 };
      case 'md': return { text: 14, badge: 14, pad: '2px 5px', gap: 5 };
      case 'lg': return { text: 20, badge: 18, pad: '3px 6px', gap: 6 };
      case 'xl': return { text: 24, badge: 22, pad: '3px 7px', gap: 6 };
    }
  });

  textSize = computed(() => this.config().text);
  badgeSize = computed(() => this.config().badge);
  badgePad = computed(() => this.config().pad);
  gap = computed(() => this.config().gap);
}
