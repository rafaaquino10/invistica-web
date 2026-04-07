import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'iq-splash',
  standalone: true,
  imports: [LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="splash">
      <div class="splash-inner">
        <iq-logo size="xl" />
      </div>
    </div>
  `,
  styles: [`
    .splash {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      background: #050505;
    }
    .splash-inner {
      animation: splashPulse 2s ease-in-out infinite;
    }
    @keyframes splashPulse {
      0%,100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.9; }
    }
  `]
})
export class SplashComponent {}
