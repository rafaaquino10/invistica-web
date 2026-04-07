import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LandingHeaderComponent } from './components/landing-header.component';
import { HeroSectionComponent } from './components/hero-section.component';
import { PillarsSectionComponent } from './components/pillars-section.component';
import { HowItWorksComponent } from './components/how-it-works.component';
import { ResultsSectionComponent } from './components/results-section.component';
import { FeaturesGridComponent } from './components/features-grid.component';
import { VisionTimelineComponent } from './components/vision-timeline.component';
import { FaqComponent } from './components/faq.component';
import { CtaSectionComponent } from './components/cta-section.component';
import { LandingFooterComponent } from './components/landing-footer.component';

@Component({
  selector: 'iq-landing',
  standalone: true,
  imports: [
    LandingHeaderComponent, HeroSectionComponent, PillarsSectionComponent,
    HowItWorksComponent, ResultsSectionComponent, FeaturesGridComponent,
    VisionTimelineComponent, FaqComponent, CtaSectionComponent, LandingFooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="landing" data-theme="dark">
      <iq-landing-header />
      <iq-hero-section />
      <iq-pillars-section />
      <iq-how-it-works />
      <iq-results-section />
      <iq-features-grid />
      <iq-vision-timeline />
      <iq-faq />
      <iq-cta-section />
      <iq-landing-footer />
    </div>
  `,
  styles: [`
    .landing {
      background: #050505;
      color: #F8FAFC;
      min-height: 100vh;
      overflow-x: hidden;
    }
  `]
})
export class LandingComponent {}
