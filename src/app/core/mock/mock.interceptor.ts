/**
 * Mock interceptor — retorna dados fake para TODAS as chamadas API.
 * Ativado APENAS na branch mock-data-preview.
 */
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, delay } from 'rxjs';
import { MOCK_DATA, getMockForTickerEndpoint } from './mock-data';

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  // Só intercepta chamadas à API (não assets, fonts, etc.)
  const url = req.url;
  if (!url.includes('/scores') && !url.includes('/portfolio') && !url.includes('/dividends')
      && !url.includes('/radar') && !url.includes('/analytics') && !url.includes('/tickers')
      && !url.includes('/clusters') && !url.includes('/valuation') && !url.includes('/news')
      && !url.includes('/backtest') && !url.includes('/billing')) {
    return next(req);
  }

  // Extrair path relativo (remover base URL)
  let path = url;
  const apiIdx = url.indexOf('/scores');
  const altPaths = ['/portfolio', '/dividends', '/radar', '/analytics', '/tickers', '/clusters', '/valuation', '/news', '/backtest', '/billing'];
  for (const p of ['/scores', ...altPaths]) {
    const idx = url.indexOf(p);
    if (idx >= 0) { path = url.substring(idx); break; }
  }

  // Remove query params for matching
  const pathNoQuery = path.split('?')[0];

  // Try static match first
  let data: any = null;
  for (const [key, fn] of Object.entries(MOCK_DATA)) {
    if (pathNoQuery === key || path.startsWith(key + '?') || path.startsWith(key + '/')) {
      if (pathNoQuery === key) { data = fn(); break; }
    }
  }

  // Exact static match
  if (!data && MOCK_DATA[pathNoQuery]) {
    data = MOCK_DATA[pathNoQuery]();
  }

  // Try dynamic per-ticker match
  if (!data) {
    data = getMockForTickerEndpoint(path);
  }

  if (data) {
    // Simular latência de rede (50-150ms)
    return of(new HttpResponse({ status: 200, body: data })).pipe(delay(Math.random() * 100 + 50));
  }

  // Fallback: deixa passar para o backend real
  return next(req);
};
