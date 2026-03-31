import { Pipe, PipeTransform } from '@angular/core';
import { ClusterId, CLUSTER_NAMES } from '../../core/models/cluster.model';

@Pipe({ name: 'clusterName', standalone: true })
export class ClusterNamePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    return CLUSTER_NAMES[value as ClusterId] ?? `Cluster ${value}`;
  }
}
