import { Component, ChangeDetectionStrategy, input, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, filter } from 'rxjs';
import { ScoreService } from '../../../../core/services/score.service';
import type { Dossier } from '../../../../core/models/score.model';
import { IqAccordionComponent } from '../../../../shared/components/iq-accordion/iq-accordion.component';
import { IqSkeletonComponent } from '../../../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../../../shared/components/iq-empty-state/iq-empty-state.component';

@Component({
  selector: 'iq-dossie-tab',
  standalone: true,
  imports: [IqAccordionComponent, IqSkeletonComponent, IqEmptyStateComponent],
  template: `
    @if (loading()) {
      <iq-skeleton variant="rect" width="100%" height="200px" />
    } @else if (dossier()) {
      <div class="dossie">
        <div class="dossie__header">
          <span class="dossie__verdict">{{ dossier()!.veredito_geral }}</span>
          <span class="dossie__score mono">Score Quali: {{ dossier()!.score_quali }}/100</span>
        </div>
        @for (dim of dossier()!.dimensoes; track dim.nome) {
          <iq-accordion [title]="dim.nome + ' — ' + dim.veredito">
            <p class="dossie__narrative">{{ dim.narrativa }}</p>
            @if (dim.evidencias.length > 0) {
              <div class="dossie__section">
                <h5 class="dossie__sub-title">Evidências</h5>
                <ul>
                  @for (ev of dim.evidencias; track ev) {
                    <li class="dossie__point dossie__point--bull">{{ ev }}</li>
                  }
                </ul>
              </div>
            }
            @if (dim.alertas.length > 0) {
              <div class="dossie__section">
                <h5 class="dossie__sub-title" style="color:var(--negative)">Alertas</h5>
                <ul>
                  @for (al of dim.alertas; track al) {
                    <li class="dossie__point dossie__point--bear">{{ al }}</li>
                  }
                </ul>
              </div>
            }
          </iq-accordion>
        }
      </div>
    } @else {
      <iq-empty-state title="Dossiê não disponível" description="Aguardando análise qualitativa do motor IQ-Cognit." />
    }
  `,
  styles: [`
    .dossie { display: flex; flex-direction: column; gap: 12px; }
    .dossie__header { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-default); margin-bottom: 8px; }
    .dossie__verdict { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
    .dossie__score { font-size: 0.875rem; font-weight: 600; color: var(--obsidian); }
    .dossie__narrative { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px; }
    .dossie__section { margin-top: 8px; }
    .dossie__sub-title { font-size: 0.6875rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 4px; }
    .dossie__point { font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; padding: 4px 0 4px 16px; position: relative; }
    .dossie__point::before { content: ''; position: absolute; left: 0; top: 10px; width: 6px; height: 6px; border-radius: 50%; }
    .dossie__point--bull::before { background: var(--positive); }
    .dossie__point--bear::before { background: var(--negative); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DossieTabComponent implements OnInit {
  readonly ticker = input.required<string>();
  private readonly scoreService = inject(ScoreService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly dossier = signal<Dossier | null>(null);

  ngOnInit(): void {
    const t = this.ticker(); if (!t) return; // direct call
    of(t).pipe(
      
      switchMap(t => this.scoreService.getDossier(t).pipe(catchError(() => of(null)))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(d => {
      this.dossier.set(d);
      this.loading.set(false);
    });
  }
}
