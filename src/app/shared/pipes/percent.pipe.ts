import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'iqPercent', standalone: true })
export class PercentPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 2): string {
    if (value == null) return '—';
    const pct = value * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(decimals)}%`;
  }
}
