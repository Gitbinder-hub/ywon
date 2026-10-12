/** Q-020 types */
export interface ExperimentDesign { id:string; samplePlan:string; window:string; primaryMetric:string; costMinor:number; stopRule:string; preregistered:boolean }
export type ExperimentOutcome = 'win'|'loss'|'inconclusive'|'invalid';
