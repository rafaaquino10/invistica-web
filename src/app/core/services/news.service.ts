import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { NewsResponse, IRResponse } from '../models/news.model';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly api = inject(ApiService);

  getNews(ticker: string, limit = 10): Observable<NewsResponse> {
    return this.api.get(`/news/${ticker}`, { limit });
  }

  getIR(ticker: string, limit = 20): Observable<IRResponse> {
    return this.api.get(`/news/${ticker}/investor-relations`, { limit });
  }
}
