import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

interface TopAsset {
  ticker: string; company_name: string; iq_score: number; rating_label: string;
  score_quanti: number | null; score_quali: number | null; score_valuation: number | null;
  dividend_yield_proj: number | null; safety_margin: number | null;
}

interface ConveyorItem {
  id: number;
  asset: TopAsset;
  phase: 'entering' | 'processing' | 'done';
  lane: number;
}

@Component({
  selector: 'iq-hero-section',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  readonly allAssets = signal<TopAsset[]>([]);
  readonly processedCards = signal<TopAsset[]>([]);
  readonly enteringTickers = signal<ConveyorItem[]>([]);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private seqId = 0;
  private assetIndex = 0;
  private readonly lanes = [-28, 0, 24];

  ngOnInit(): void {
    this.api.get<{ top: TopAsset[] }>('/scores/top', { limit: 8 }).subscribe({
      next: d => {
        const assets = d.top || [];
        this.allAssets.set(assets);
        if (assets.length === 0) return;

        // Initial batch after 600ms
        setTimeout(() => this.spawnBatch(), 600);
        // Then every 3.5s
        this.intervalId = setInterval(() => this.spawnBatch(), 3500);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private spawnBatch(): void {
    const assets = this.allAssets();
    if (!assets.length) return;

    const batchSize = 2;
    for (let i = 0; i < batchSize; i++) {
      const asset = assets[this.assetIndex % assets.length];
      this.assetIndex++;
      const id = this.seqId++;
      const lane = this.lanes[i % this.lanes.length];

      const item: ConveyorItem = { id, asset, phase: 'entering', lane };
      this.enteringTickers.update(list => [...list, item]);

      // After 1s: processing phase
      setTimeout(() => {
        this.enteringTickers.update(list => list.map(t => t.id === id ? { ...t, phase: 'processing' } : t));
      }, 900);

      // After 1.8s: remove from entering, add to processed (max 4 cards)
      setTimeout(() => {
        this.enteringTickers.update(list => list.filter(t => t.id !== id));
        this.processedCards.update(cards => {
          const next = [asset, ...cards];
          return next.slice(0, 4);
        });
      }, 1800 + i * 300);
    }
  }

  bandColor(score: number): string {
    if (score >= 82) return '#d0f364';
    if (score >= 70) return '#34D399';
    if (score >= 45) return '#F59E0B';
    return '#EF4444';
  }

  logoUrl(ticker: string): string {
    return `https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${ticker}.jpg`;
  }
}
