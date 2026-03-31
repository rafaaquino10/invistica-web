import { Pipe, PipeTransform } from '@angular/core';

const BASE_URL = 'https://raw.githubusercontent.com/thefintz/icones-b3/main/icones';

@Pipe({ name: 'tickerLogo', standalone: true })
export class TickerLogoPipe implements PipeTransform {
  transform(ticker: string | null | undefined): string {
    if (!ticker) return '';
    return `${BASE_URL}/${ticker.toUpperCase()}.png`;
  }
}
