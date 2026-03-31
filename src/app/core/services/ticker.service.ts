import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  TickerListResponse, TickerDetail, Quote, FinancialsResponse,
  TickerDividendsResponse, Peer, HistoryResponse,
  InstitutionalHoldersResponse, ShortInterestResponse, FocusExpectationsResponse,
} from '../models/ticker.model';
import { ClustersResponse } from '../models/cluster.model';

@Injectable({ providedIn: 'root' })
export class TickerService {
  private readonly api = inject(ApiService);

  list(params?: { cluster_id?: number; limit?: number; offset?: number }): Observable<TickerListResponse> {
    return this.api.get('/tickers', params as Record<string, string | number>);
  }

  search(q: string, limit = 10): Observable<TickerListResponse> {
    return this.api.get('/tickers/search', { q, limit });
  }

  get(ticker: string): Observable<TickerDetail> {
    return this.api.get(`/tickers/${ticker}`);
  }

  getQuote(ticker: string): Observable<Quote> {
    return this.api.get(`/tickers/${ticker}/quote`);
  }

  getFinancials(ticker: string, limit = 8): Observable<FinancialsResponse> {
    return this.api.get(`/tickers/${ticker}/financials`, { limit });
  }

  getDividends(ticker: string): Observable<TickerDividendsResponse> {
    return this.api.get(`/tickers/${ticker}/dividends`);
  }

  getPeers(ticker: string): Observable<{ peers: Peer[] }> {
    return this.api.get(`/tickers/${ticker}/peers`);
  }

  getHistory(ticker: string, days = 90): Observable<HistoryResponse> {
    return this.api.get(`/tickers/${ticker}/history`, { days });
  }

  getInstitutionalHolders(ticker: string): Observable<InstitutionalHoldersResponse> {
    return this.api.get(`/tickers/${ticker}/institutional-holders`);
  }

  getShortInterest(ticker: string): Observable<ShortInterestResponse> {
    return this.api.get(`/tickers/${ticker}/short-interest`);
  }

  getFocusExpectations(): Observable<FocusExpectationsResponse> {
    return this.api.get('/tickers/macro/focus-expectations');
  }

  listClusters(): Observable<ClustersResponse> {
    return this.api.get('/clusters');
  }
}
