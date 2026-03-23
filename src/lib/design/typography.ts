/**
 * SISTEMA TIPOGRÁFICO aQInvest
 *
 * REGRAS OBRIGATÓRIAS — Todas as páginas devem seguir:
 *
 * | Elemento           | Token              | Tamanho | Peso      | Uso                            |
 * |--------------------|--------------------|---------|-----------|--------------------------------|
 * | Page Title         | --text-title       | 24px    | semibold  | Título principal da página     |
 * | Section Heading    | --text-heading     | 20px    | semibold  | Títulos de seção               |
 * | Subheading         | --text-subheading  | 16px    | medium    | Sub-seções, card titles        |
 * | Body               | --text-body        | 13px    | normal    | Texto corrido, descrições      |
 * | Base (UI)          | --text-base        | 14px    | normal    | Inputs, dropdowns, buttons     |
 * | Small              | --text-small       | 12px    | normal    | Texto secundário, table data   |
 * | Caption            | --text-caption     | 11px    | medium    | Labels, table headers (upper)  |
 * | Display            | --text-display     | 36px    | bold      | KPI valores grandes            |
 *
 * PROIBIDO: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl inline.
 * SEMPRE usar: text-[var(--text-TOKEN)]
 */

export const TYPOGRAPHY = {
  pageTitle: 'text-[var(--text-title)] font-semibold',
  sectionHeading: 'text-[var(--text-heading)] font-semibold',
  subheading: 'text-[var(--text-subheading)] font-medium',
  body: 'text-[var(--text-body)]',
  base: 'text-[var(--text-base)]',
  small: 'text-[var(--text-small)]',
  caption: 'text-[var(--text-caption)] font-medium uppercase tracking-wider',
  display: 'text-[var(--text-display)] font-bold',
} as const
