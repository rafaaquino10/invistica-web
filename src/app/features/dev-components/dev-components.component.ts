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
import { IqScoreGaugeComponent } from '../../shared/components/iq-score-gauge/iq-score-gauge.component';
import { IqRatingBadgeComponent } from '../../shared/components/iq-rating-badge/iq-rating-badge.component';
import { IqRegimeBadgeComponent } from '../../shared/components/iq-regime-badge/iq-regime-badge.component';
import { IqPillarBarsComponent } from '../../shared/components/iq-pillar-bars/iq-pillar-bars.component';
import { IqSubScoreRadarComponent, SubScores } from '../../shared/components/iq-sub-score-radar/iq-sub-score-radar.component';
import { IqKpiCardComponent } from '../../shared/components/iq-kpi-card/iq-kpi-card.component';
import { IqSparklineComponent } from '../../shared/components/iq-sparkline/iq-sparkline.component';
import { IqFairValueBarComponent } from '../../shared/components/iq-fair-value-bar/iq-fair-value-bar.component';
import { IqBarChartComponent, BarDataPoint } from '../../shared/components/iq-bar-chart/iq-bar-chart.component';
import { IqLineChartComponent, LineSeries } from '../../shared/components/iq-line-chart/iq-line-chart.component';
import { IqDonutChartComponent, DonutSlice } from '../../shared/components/iq-donut-chart/iq-donut-chart.component';
import { IqHeatmapComponent } from '../../shared/components/iq-heatmap/iq-heatmap.component';
import { IqTreemapComponent, TreemapItem } from '../../shared/components/iq-treemap/iq-treemap.component';
import { IqMonteCarloComponent, MonteCarloScenarios } from '../../shared/components/iq-monte-carlo/iq-monte-carlo.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { PercentPipe } from '../../shared/pipes/percent.pipe';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { RatingLabelPipe } from '../../shared/pipes/rating-label.pipe';
import { ClusterNamePipe } from '../../shared/pipes/cluster-name.pipe';
import { RegimeLabelPipe } from '../../shared/pipes/regime-label.pipe';
import { Rating } from '../../core/models/score.model';
import { RegimeType } from '../../core/models/regime.model';

@Component({
  selector: 'iq-dev-components',
  standalone: true,
  imports: [
    IqButtonComponent, IqInputComponent, IqDropdownComponent, IqModalComponent,
    IqTabsComponent, IqToggleComponent, IqAccordionComponent, IqToastComponent,
    IqSearchComponent, IqSliderComponent, IqTooltipDirective, IqSkeletonComponent,
    IqEmptyStateComponent, IqDisclaimerComponent,
    IqScoreGaugeComponent, IqRatingBadgeComponent, IqRegimeBadgeComponent,
    IqPillarBarsComponent, IqSubScoreRadarComponent, IqKpiCardComponent,
    IqSparklineComponent, IqFairValueBarComponent,
    IqBarChartComponent, IqLineChartComponent, IqDonutChartComponent,
    IqHeatmapComponent, IqTreemapComponent, IqMonteCarloComponent,
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

  readonly ratings: Rating[] = ['STRONG_BUY', 'BUY', 'HOLD', 'REDUCE', 'AVOID', 'DADOS_INSUFICIENTES'];
  readonly regimes: RegimeType[] = ['RISK_ON', 'RISK_OFF', 'STAGFLATION', 'RECOVERY'];

  readonly subScores: SubScores = {
    valuation: 3, quality: 71, risk: 45, dividends: 67, growth: 50, momentum: 30,
  };

  readonly sparkData = [42, 45, 43, 48, 47, 50, 49, 52, 51, 49, 53];
  readonly sparkDataDown = [55, 53, 50, 48, 45, 43, 40, 38, 42, 39, 37];

  readonly barData: BarDataPoint[] = [
    { label: 'Q1', value: 12800 },
    { label: 'Q2', value: 14200 },
    { label: 'Q3', value: 13500 },
    { label: 'Q4', value: 15800 },
    { label: 'Q1p', value: 16200, opacity: 0.5 },
  ];

  readonly lineSeries: LineSeries[] = [
    { name: 'Carteira', data: [100, 105, 103, 110, 108, 115, 120, 118, 125], color: 'var(--obsidian)' },
    { name: 'IBOV', data: [100, 102, 101, 104, 103, 106, 108, 107, 110], color: 'var(--info)', dashed: true },
    { name: 'CDI', data: [100, 101, 102, 103, 104, 105, 106, 107, 108], color: 'var(--text-tertiary)', dashed: true },
  ];

  readonly donutData: DonutSlice[] = [
    { label: 'Financeiro', value: 35, color: '#3D3D3A' },
    { label: 'Commodities', value: 25, color: '#1A7A45' },
    { label: 'Utilities', value: 20, color: '#3B6B96' },
    { label: 'Consumo', value: 12, color: '#A07628' },
    { label: 'Outros', value: 8, color: '#9C998F' },
  ];

  readonly heatmapData = [
    [3, -3, -3, 5, 2],
    [-2, 3, 3, -5, 2],
    [3, 2, -5, 8, 0],
    [-2, 5, 5, -3, 0],
  ];
  readonly heatmapRows = ['RISK_ON', 'RISK_OFF', 'STAGFLATION', 'RECOVERY'];
  readonly heatmapCols = ['Fin', 'Com', 'Cons', 'Util', 'Saúde'];

  readonly treemapData: TreemapItem[] = [
    { ticker: 'PETR4', name: 'Petrobras', value: 666, score: 29, change: 1.23 },
    { ticker: 'VALE3', name: 'Vale', value: 337, score: 33, change: -0.87 },
    { ticker: 'ITUB4', name: 'Itaú', value: 280, score: 65, change: 0.45 },
    { ticker: 'BBDC4', name: 'Bradesco', value: 150, score: 42, change: -0.32 },
    { ticker: 'WEGE3', name: 'WEG', value: 180, score: 78, change: 2.15 },
    { ticker: 'ABEV3', name: 'Ambev', value: 200, score: 55, change: 0.18 },
    { ticker: 'RENT3', name: 'Localiza', value: 120, score: 60, change: -1.56 },
    { ticker: 'BBAS3', name: 'BB', value: 140, score: 70, change: 0.67 },
  ];

  readonly mcScenarios: MonteCarloScenarios = { bear: 2.03, base: 26.47, bull: 9.50 };

  showToast(type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toast.show(type, `Toast ${type} de exemplo!`);
  }
}
