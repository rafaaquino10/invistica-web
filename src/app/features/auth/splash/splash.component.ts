import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'iq-splash',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="splash">
      <div class="splash-logo">
        <span class="logo-text mono">IQ</span>
      </div>
    </div>
  `,
  styles: [`
    .splash {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      background: #050505;
    }
    .splash-logo {
      width: 80px; height: 80px; border-radius: 16px;
      background: #12141C; display: flex; align-items: center; justify-content: center;
      animation: splashPulse 2s ease-in-out infinite;
      box-shadow: 0 0 20px rgba(208,243,100,0.25);
    }
    .logo-text { font-size: 28px; font-weight: 800; color: #d0f364; }
    @keyframes splashPulse {
      0%,100% { transform: scale(1); box-shadow: 0 0 20px rgba(208,243,100,0.25); }
      50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(208,243,100,0.4); }
    }
  `]
})
export class SplashComponent {}
