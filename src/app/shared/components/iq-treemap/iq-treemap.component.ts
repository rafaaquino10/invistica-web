import {
  Component, ChangeDetectionStrategy, input, output, ElementRef,
  viewChild, OnChanges, AfterViewInit, inject, signal,
} from '@angular/core';
import * as d3 from 'd3';

export interface TreemapItem {
  ticker: string;
  name: string;
  value: number;
  score: number;
  change: number;
}

@Component({
  selector: 'iq-treemap',
  standalone: true,
  template: `<div #container class="treemap"></div>`,
  styles: [`
    .treemap { width: 100%; height: 320px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqTreemapComponent implements AfterViewInit, OnChanges {
  readonly data = input<TreemapItem[]>([]);
  readonly colorBy = input<'change' | 'score'>('change');
  readonly itemClick = output<TreemapItem>();

  readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private rendered = false;

  ngAfterViewInit(): void {
    this.rendered = true;
    this.render();
  }

  ngOnChanges(): void {
    if (this.rendered) this.render();
  }

  private render(): void {
    const el = this.container().nativeElement;
    el.innerHTML = '';
    const items = this.data();
    if (!items.length) return;

    const w = el.clientWidth;
    const h = el.clientHeight || 320;

    const root = d3.hierarchy({ children: items } as any)
      .sum((d: any) => Math.abs(d.value) || 1);

    d3.treemap<any>().size([w, h]).padding(2)(root);

    const colorScale = this.colorBy() === 'change'
      ? d3.scaleLinear<string>().domain([-5, 0, 5]).range(['#C23028', '#E8E6E1', '#1A7A45']).clamp(true)
      : d3.scaleLinear<string>().domain([0, 50, 100]).range(['#C23028', '#E8E6E1', '#1A7A45']).clamp(true);

    const svg = d3.select(el).append('svg').attr('width', w).attr('height', h);

    const cells = svg.selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer')
      .on('click', (_: any, d: any) => this.itemClick.emit(d.data));

    cells.append('rect')
      .attr('width', (d: any) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d: any) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d: any) => colorScale(this.colorBy() === 'change' ? d.data.change : d.data.score))
      .attr('rx', 2);

    cells.filter((d: any) => (d.x1 - d.x0) > 40 && (d.y1 - d.y0) > 28)
      .append('text')
      .attr('x', 4).attr('y', 14)
      .style('font-family', "'IBM Plex Mono', monospace")
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', () => getComputedStyle(el).getPropertyValue('--text-primary').trim() || '#1A1A18')
      .text((d: any) => d.data.ticker);

    cells.filter((d: any) => (d.x1 - d.x0) > 40 && (d.y1 - d.y0) > 42)
      .append('text')
      .attr('x', 4).attr('y', 28)
      .style('font-family', "'IBM Plex Mono', monospace")
      .style('font-size', '9px')
      .style('fill', () => getComputedStyle(el).getPropertyValue('--text-secondary').trim() || '#6B6960')
      .text((d: any) => {
        const c = d.data.change;
        return (c >= 0 ? '+' : '') + c.toFixed(1) + '%';
      });
  }
}
