import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface TopAsset {
  ticker: string; company_name: string; iq_score: number; rating_label: string;
  score_quanti: number | null; score_quali: number | null; score_valuation: number | null;
  dividend_yield_proj: number | null; safety_margin: number | null;
}

@Component({
  selector: 'iq-hero-section',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly cards = signal<TopAsset[]>([]);
  readonly tickers = ['VALE3', 'BBAS3', 'VIVT3', 'PETR4', 'WEGE3'];

  ngOnInit(): void {
    this.api.get<{ top: TopAsset[] }>('/scores/top', { limit: 4 }).subscribe({
      next: d => this.cards.set(d.top || []),
      error: () => {},
    });
  }

  getBandColor(score: number): string {
    if (score >= 82) return '#d0f364';
    if (score >= 70) return '#34D399';
    if (score >= 45) return '#F59E0B';
    return '#EF4444';
  }
}
