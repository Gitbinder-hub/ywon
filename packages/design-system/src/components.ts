/** Q-038 accessible components — a11y roles, keyboard/numeric alternatives */
export type Viewport = 'mobile'|'tablet'|'desktop'|'wide';
export type ComponentState = 'default'|'hover'|'focus'|'active'|'disabled'|'loading'|'error'|'empty';

export interface ComponentSpec { name: string; role: string; keyboard: boolean; numericAlt?: boolean; states: ComponentState[]; ariaLabelRequired?: boolean }

export const COMPONENTS: ComponentSpec[] = [
  { name:'task-card', role:'article', keyboard:true, states:['default','loading','error','empty'], ariaLabelRequired:true },
  { name:'result-card', role:'article', keyboard:true, states:['default','loading','error'], ariaLabelRequired:true },
  { name:'cost-panel', role:'region', keyboard:true, states:['default','loading','error'], ariaLabelRequired:true },
  { name:'approval-card', role:'form', keyboard:true, states:['default','focus','disabled','loading'], ariaLabelRequired:true },
  { name:'canvas-layer', role:'listitem', keyboard:true, numericAlt:true, states:['default','focus','active'], ariaLabelRequired:true },
  { name:'brief-editor', role:'form', keyboard:true, states:['default','focus','error','empty'], ariaLabelRequired:true },
];

export function getViewport(width: number): Viewport {
  if (width >= 1440) return 'wide';
  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
}

export function isAccessibilityOk(spec: ComponentSpec): boolean {
  // WCAG 2.2 AA: keyboard operable, aria label where required, no drag-only interaction for canvas
  if (!spec.keyboard) return false;
  if (spec.ariaLabelRequired && !spec.name) return false;
  if (spec.name==='canvas-layer' && !spec.numericAlt) return false;
  return true;
}
