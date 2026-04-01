import {
  Component, ChangeDetectionStrategy, input, output, ElementRef,
  viewChild, OnChanges, AfterViewInit, signal,
} from '@angular/core';
import * as d3 from 'd3';

export interface TreemapItem {
  ticker: string;
  name: string;
  value: number;      // market_cap or score (determines size)
  score: number;      // iq_score
  change: number;     // daily % change
  cluster: string;    // sector name
  cluster_id: number;
}

@Component({
  selector: 'iq-treemap',
  standalone: true,
  template: `<div #container class="treemap"></div>`,
  styles: [`
    .treemap { width: 100%; height: 500px; position: relative; }
    .treemap :deep(.treemap-tooltip) {
      position: fixed; pointer-events: none; z-index: 100;
      background: var(--surface-1); border: 1px solid var(--border-default);
      border-radius: 2px; padding: 8px 12px; box-shadow: var(--shadow-md);
      font-size: 12px; line-height: 1.4;
    }
    .treemap :deep(.treemap-tooltip strong) { font-weight: 600; }
    .treemap :deep(.treemap-tooltip .mono) { font-family: 'IBM Plex Mono', monospace; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqTreemapComponent implements AfterViewInit, OnChanges {
  readonly data = input<TreemapItem[]>([]);
  readonly colorBy = input<'change' | 'score' | 'sector'>('change');
  readonly itemClick = output<TreemapItem>();

  readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private rendered = false;
  private tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null = null;

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
    const h = el.clientHeight || 500;

    // Group by cluster for sector-based layout
    const clusters = d3.groups(items, d => d.cluster);
    const hierarchyData = {
      name: 'root',
      children: clusters.map(([cluster, tickers]) => ({
        name: cluster,
        children: tickers.map(t => ({ ...t, name: t.ticker })),
      })),
    };

    const root = d3.hierarchy(hierarchyData)
      .sum((d: any) => Math.max(d.value || 1, 1))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.treemap<any>()
      .size([w, h])
      .paddingOuter(3)
      .paddingTop(18)  // space for sector label
      .paddingInner(1)
      (root);

    // Color scales
    const changeScale = d3.scaleLinear<string>()
      .domain([-5, -1, 0, 1, 5])
      .range(['#C23028', '#D4736E', '#E8E6E1', '#7ABF93', '#1A7A45'])
      .clamp(true);

    const scoreScale = d3.scaleLinear<string>()
      .domain([0, 30, 45, 70, 82, 100])
      .range(['#C23028', '#C23028', '#A07628', '#3D3D3A', '#1A7A45', '#1A7A45'])
      .clamp(true);

    const sectorColors: Record<string, string> = {
      'Financeiro': '#3D3D3A', 'Commodities': '#8B7355', 'Consumo': '#5B8A72',
      'Utilities': '#3B6B96', 'Saúde': '#7A5B96', 'Real Estate': '#96643B',
      'Bens de Capital': '#6B6960', 'Educação': '#4A7A96', 'TMT': '#2D5A3D',
    };

    const getColor = (d: any): string => {
      const mode = this.colorBy();
      if (mode === 'change') return changeScale(d.data.change ?? 0);
      if (mode === 'score') return scoreScale(d.data.score ?? 0);
      return sectorColors[d.parent?.data?.name] ?? '#9C998F';
    };

    const getTextColor = (d: any): string => {
      const bg = getColor(d);
      // Simple luminance check
      const hex = bg.replace('#', '');
      if (hex.length !== 6) return '#1A1A18';
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return lum > 0.55 ? '#1A1A18' : '#F8F7F4';
    };

    const svg = d3.select(el).append('svg')
      .attr('width', w).attr('height', h)
      .style('font-family', "'Satoshi', sans-serif");

    // Sector group labels
    const sectorGroups = root.children ?? [];
    svg.selectAll('.sector-label')
      .data(sectorGroups)
      .join('text')
      .attr('class', 'sector-label')
      .attr('x', (d: any) => d.x0 + 4)
      .attr('y', (d: any) => d.y0 + 13)
      .style('font-size', '9px')
      .style('font-weight', '600')
      .style('fill', '#9C998F')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.06em')
      .style('font-family', "'IBM Plex Mono', monospace")
      .text((d: any) => d.data.name);

    // Sector background rects
    svg.selectAll('.sector-bg')
      .data(sectorGroups)
      .join('rect')
      .attr('class', 'sector-bg')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('width', (d: any) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d: any) => Math.max(0, d.y1 - d.y0))
      .attr('fill', 'none')
      .attr('stroke', '#E0DDD6')
      .attr('stroke-width', 1)
      .attr('rx', 2);

    // Tooltip
    this.tooltip = d3.select(el).append('div')
      .attr('class', 'treemap-tooltip')
      .style('display', 'none');

    // Leaf cells
    const leaves = root.leaves().filter((d: any) => (d.x1 - d.x0) > 2 && (d.y1 - d.y0) > 2);

    const cells = svg.selectAll('.cell')
      .data(leaves)
      .join('g')
      .attr('class', 'cell')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer')
      .on('click', (_: any, d: any) => this.itemClick.emit(d.data))
      .on('mouseenter', (event: MouseEvent, d: any) => {
        const data = d.data;
        const ch = data.change ?? 0;
        const chStr = (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%';
        const chColor = ch >= 0 ? '#1A7A45' : '#C23028';
        this.tooltip!
          .style('display', 'block')
          .html(`
            <strong>${data.ticker}</strong> — ${data.name}<br>
            <span class="mono" style="color:${chColor}">${chStr}</span>
            ${data.score ? ` · IQ-Score <span class="mono">${data.score}</span>` : ''}
          `);
      })
      .on('mousemove', (event: MouseEvent) => {
        this.tooltip!
          .style('left', (event.clientX + 12) + 'px')
          .style('top', (event.clientY - 10) + 'px');
      })
      .on('mouseleave', () => {
        this.tooltip!.style('display', 'none');
      });

    cells.append('rect')
      .attr('width', (d: any) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d: any) => Math.max(0, d.y1 - d.y0))
      .attr('fill', getColor)
      .attr('rx', 1);

    // Ticker label
    cells.filter((d: any) => (d.x1 - d.x0) > 36 && (d.y1 - d.y0) > 22)
      .append('text')
      .attr('x', 4).attr('y', 13)
      .style('font-family', "'IBM Plex Mono', monospace")
      .style('font-size', '10px')
      .style('font-weight', '600')
      .attr('fill', getTextColor)
      .text((d: any) => d.data.ticker);

    // Change % label
    cells.filter((d: any) => (d.x1 - d.x0) > 36 && (d.y1 - d.y0) > 36)
      .append('text')
      .attr('x', 4).attr('y', 26)
      .style('font-family', "'IBM Plex Mono', monospace")
      .style('font-size', '9px')
      .attr('fill', getTextColor)
      .attr('opacity', 0.8)
      .text((d: any) => {
        const c = d.data.change ?? 0;
        return (c >= 0 ? '+' : '') + c.toFixed(1) + '%';
      });
  }
}
