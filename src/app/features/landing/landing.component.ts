import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LandingHeaderComponent } from './components/landing-header.component';
import { HeroSectionComponent } from './components/hero-section.component';
import { MotorDemoComponent } from './components/motor-demo.component';
import { ExplorerLiveComponent } from './components/explorer-live.component';
import { HowItWorksComponent } from './components/how-it-works.component';
import { FeaturesSectionComponent } from './components/features-section.component';
import { ResultsSectionComponent } from './components/results-section.component';
import { VisionSectionComponent } from './components/vision-section.component';
import { FaqSectionComponent } from './components/faq-section.component';
import { CtaSectionComponent } from './components/cta-section.component';
import { LandingFooterComponent } from './components/landing-footer.component';

@Component({
  selector: 'iq-landing',
  standalone: true,
  imports: [
    LandingHeaderComponent, HeroSectionComponent, MotorDemoComponent,
    ExplorerLiveComponent, HowItWorksComponent, FeaturesSectionComponent,
    ResultsSectionComponent, VisionSectionComponent, FaqSectionComponent,
    CtaSectionComponent, LandingFooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="landing" data-theme="dark">
      <iq-landing-header />
      <iq-hero-section />
      <iq-motor-demo />
      <iq-explorer-live />
      <iq-how-it-works />
      <iq-features-section />
      <iq-results-section />
      <iq-vision-section />
      <iq-faq-section />
      <iq-cta-section />
      <iq-landing-footer />
    </div>
  `,
  styles: [`
    .landing { background: #050505; color: #F8FAFC; min-height: 100vh; overflow-x: hidden; }
  `]
})
export class LandingComponent {}
