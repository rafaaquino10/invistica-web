import { Component, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'iq-landing-header',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="lh" [class.scrolled]="scrolled()">
      <a class="logo" routerLink="/">
        <span class="logo-mark mono">IQ</span>
        <span class="logo-text">INVESTIQ</span>
      </a>
      <nav class="nav">
        <a href="#motor" class="nav-link">Motor</a>
        <a href="#como" class="nav-link">Como Funciona</a>
        <a href="#resultados" class="nav-link">Resultados</a>
        <a href="#visao" class="nav-link">Visão</a>
      </nav>
      <div class="actions">
        <a class="btn-ghost cta" routerLink="/dashboard">Entrar</a>
        <a class="btn-volt cta" routerLink="/dashboard">Começar grátis</a>
      </div>
    </header>
  `,
  styles: [`
    .lh {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 32px; height: 56px;
      transition: background 300ms, backdrop-filter 300ms;
    }
    .lh.scrolled {
      background: rgba(5,5,5,0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .logo { display: flex; align-items: center; gap: 8px; }
    .logo-mark { font-size: 18px; font-weight: 700; color: #d0f364; text-shadow: 0 0 16px rgba(208,243,100,0.25); }
    .logo-text { font-family: var(--font-ui); font-size: 13px; font-weight: 700; color: #F8FAFC; letter-spacing: 0.08em; }
    .nav { display: flex; gap: 24px; }
    .nav-link { font-family: var(--font-ui); font-size: 12px; color: #A0A8B8; transition: color 150ms; }
    .nav-link:hover { color: #F8FAFC; }
    .actions { display: flex; gap: 8px; }
    .btn-ghost { padding: 6px 16px; color: #A0A8B8; font-size: 12px; border-radius: 4px; }
    .btn-ghost:hover { color: #F8FAFC; }
    .btn-volt { padding: 6px 16px; background: #d0f364; color: #050505; font-size: 12px; border-radius: 4px; font-weight: 700; }
  `]
})
export class LandingHeaderComponent {
  readonly scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void { this.scrolled.set(window.scrollY > 60); }
}
