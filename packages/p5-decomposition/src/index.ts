/**
 * Q-025 + Q-048 P5 branch decomposition and real benchmark
 * AC1 bounded tasks/evals with feature links and DAG
 * AC2 Q-030G depends on implemented tasks not just planning
 * AC3 each claim has limits and verification
 * Q-048: Товары/Реклама/Видео studio expansion baseline
 */
import type { P5Task, Decomposition } from './types.ts';

export function decompose(): Decomposition {
  // Base cinema/runtime tasks from Q-025 remain; Q-048 adds product/creative expansion baseline
  const tasks: P5Task[] = [
    { id:'Q-025-1', featureId:'F18', scope:'cinema rig camera fidelity', budgetMinor:50000, rightsChecked:true, dependsOn:[] },
    { id:'Q-025-2', featureId:'F24', scope:'timeline EDL export', budgetMinor:20000, rightsChecked:true, dependsOn:['Q-025-1'] },
    // Q-048 selected studio — Товары/Реклама/Видео baseline (bounded, not whole catalog)
    { id:'Q-048-1', featureId:'F42', scope:'tovary-hero baseline: cutout + bg + protected product QA', budgetMinor:15000, rightsChecked:true, dependsOn:['Q-025-2'] },
    { id:'Q-048-2', featureId:'F42', scope:'reklama-banner baseline: variants lineage + platform limits', budgetMinor:12000, rightsChecked:true, dependsOn:['Q-048-1'] },
    { id:'Q-048-3', featureId:'F42', scope:'video-shorts baseline: 30-60s hook/voice/music + source sufficiency', budgetMinor:10000, rightsChecked:true, dependsOn:['Q-048-2'] },
    { id:'Q-048-4', featureId:'F27', scope:'code family baseline: code-scaffold/bot-factory/freelance scaffold + qa', budgetMinor:8000, rightsChecked:true, dependsOn:['Q-048-3'] },
  ];
  return { tasks, gateDependsOn: tasks.map(t=>t.id) };
}

export function verifyGateDepends(gateDeps: string[], implTasks:string[]): boolean {
  return implTasks.every(t=> gateDeps.includes(t));
}

export function claimWithLimits(claim:string, limits:string, verified:boolean): boolean {
  return !!claim && !!limits && verified;
}

/** Q-048 helper: selected studio descriptor */
export interface StudioRecipeScope {
  studio: 'tovary'|'reklama'|'video'|'series';
  recipeId: string;
  inputs: string[];
  platformProfiles: string[];
  protectedProduct: boolean;
  claimsRubric: string;
}

export function q048Scopes(): StudioRecipeScope[] {
  return [
    { studio:'tovary', recipeId:'tovary-hero', inputs:['product_cutout_id','sku','claims','required_texts','protected_region','aspect'], platformProfiles:['1:1','4:5','16:9'], protectedProduct:true, claimsRubric:'human_claim_approval + OCR/visual signal, synthetic testimonial forbidden' },
    { studio:'reklama', recipeId:'reklama-banner', inputs:['offer','audience','landing_url','proofs','cta','platform','variants'], platformProfiles:['generic','yandex_direct','vk_ads','telegram'], protectedProduct:false, claimsRubric:'proofs required for claim, variants lineage, ad policy gate' },
    { studio:'video', recipeId:'video-shorts', inputs:['hook','voice','durationSec','platform','source_material_ids'], platformProfiles:['9:16','16:9','1:1'], protectedProduct:false, claimsRubric:'30-60s duration_ok + hook_present + source_sufficient, insufficient material unsupported' },
  ];
}
