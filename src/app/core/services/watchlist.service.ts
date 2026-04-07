import { Injectable, signal } from '@angular/core';

export interface WatchlistItem {
  ticker: string;
  company_name: string;
}

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly STORAGE_KEY = 'iq-watchlist';
  readonly items = signal<WatchlistItem[]>(this.load());

  add(item: WatchlistItem): void {
    if (this.items().some(i => i.ticker === item.ticker)) return;
    this.items.update(list => [...list, item]);
    this.persist();
  }

  remove(ticker: string): void {
    this.items.update(list => list.filter(i => i.ticker !== ticker));
    this.persist();
  }

  has(ticker: string): boolean {
    return this.items().some(i => i.ticker === ticker);
  }

  private load(): WatchlistItem[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private persist(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items()));
  }
}
