import { Pipe, PipeTransform } from '@angular/core';
import { Rating, RATING_LABELS } from '../../core/models/score.model';

@Pipe({ name: 'ratingLabel', standalone: true })
export class RatingLabelPipe implements PipeTransform {
  transform(value: Rating | null | undefined): string {
    if (!value) return '—';
    return RATING_LABELS[value] ?? value;
  }
}
