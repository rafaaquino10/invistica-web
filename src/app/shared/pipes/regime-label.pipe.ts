import { Pipe, PipeTransform } from '@angular/core';
import { RegimeType, REGIME_LABELS } from '../../core/models/regime.model';

@Pipe({ name: 'regimeLabel', standalone: true })
export class RegimeLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return REGIME_LABELS[value as RegimeType] ?? value;
  }
}
