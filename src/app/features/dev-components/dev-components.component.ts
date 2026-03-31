import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqInputComponent } from '../../shared/components/iq-input/iq-input.component';
import { IqDropdownComponent, DropdownOption } from '../../shared/components/iq-dropdown/iq-dropdown.component';
import { IqModalComponent } from '../../shared/components/iq-modal/iq-modal.component';
import { IqTabsComponent, TabDef } from '../../shared/components/iq-tabs/iq-tabs.component';
import { IqToggleComponent } from '../../shared/components/iq-toggle/iq-toggle.component';
import { IqAccordionComponent } from '../../shared/components/iq-accordion/iq-accordion.component';
import { IqToastComponent } from '../../shared/components/iq-toast/iq-toast.component';
import { ToastService } from '../../shared/components/iq-toast/iq-toast.service';
import { IqSearchComponent } from '../../shared/components/iq-search/iq-search.component';
import { IqSliderComponent } from '../../shared/components/iq-slider/iq-slider.component';
import { IqTooltipDirective } from '../../shared/components/iq-tooltip/iq-tooltip.directive';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { PercentPipe } from '../../shared/pipes/percent.pipe';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { RatingLabelPipe } from '../../shared/pipes/rating-label.pipe';
import { ClusterNamePipe } from '../../shared/pipes/cluster-name.pipe';
import { RegimeLabelPipe } from '../../shared/pipes/regime-label.pipe';

@Component({
  selector: 'iq-dev-components',
  standalone: true,
  imports: [
    IqButtonComponent, IqInputComponent, IqDropdownComponent, IqModalComponent,
    IqTabsComponent, IqToggleComponent, IqAccordionComponent, IqToastComponent,
    IqSearchComponent, IqSliderComponent, IqTooltipDirective, IqSkeletonComponent,
    IqEmptyStateComponent, IqDisclaimerComponent,
    CurrencyBrlPipe, PercentPipe, CompactNumberPipe, RatingLabelPipe, ClusterNamePipe, RegimeLabelPipe,
  ],
  templateUrl: './dev-components.component.html',
  styleUrl: './dev-components.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevComponentsComponent {
  private readonly toast = inject(ToastService);

  readonly modalOpen = signal(false);
  readonly toggleChecked = signal(false);
  readonly sliderVal = signal(70);

  readonly dropdownOptions: DropdownOption[] = [
    { label: 'Financeiro', value: '1' },
    { label: 'Commodities', value: '2' },
    { label: 'Consumo', value: '3' },
    { label: 'Utilities', value: '4' },
    { label: 'Saúde', value: '5' },
    { label: 'Real Estate', value: '6' },
  ];

  readonly tabsDef: TabDef[] = [
    { label: 'Overview', id: 'overview' },
    { label: 'Financeiro', id: 'financeiro' },
    { label: 'Valuation', id: 'valuation' },
  ];

  readonly searchResults = [
    { label: 'PETR4', value: 'PETR4', subtitle: 'Petrobras' },
    { label: 'VALE3', value: 'VALE3', subtitle: 'Vale S.A.' },
    { label: 'ITUB4', value: 'ITUB4', subtitle: 'Itaú Unibanco' },
  ];

  showToast(type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toast.show(type, `Toast ${type} de exemplo!`);
  }
}
