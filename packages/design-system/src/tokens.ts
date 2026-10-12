/** Q-038 design tokens — locale-neutral codes, responsive breakpoints */
export const TOKENS = {
  color: { bg:'#ffffff', fg:'#0f0f0f', accent:'#4f46e5', muted:'#6b7280', error:'#dc2626' },
  space: { xs:4, sm:8, md:16, lg:24, xl:32 },
  radius: { sm:6, md:10, lg:16 },
  type: { sans:'Inter, system-ui, sans-serif', mono:'ui-monospace, monospace', sizeBase:16 },
  motion: { durationMs: 180, easing:'ease' },
  breakpoints: { mobile: 0, tablet: 768, desktop: 1024, wide: 1440 },
} as const;
export type LocaleNeutralCode = `ERR_${string}` | `COST_${string}` | `STATE_${string}`;
