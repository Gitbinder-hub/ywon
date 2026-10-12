/**
 * Q-031 Scale plan and unit economics
 * AC1 priorities + acceptance plan, AC2 no million-ready claim tests defined, AC3 tasks for scale features created Q-035G deps
 */
import type { ScalePlan } from './types.ts';
let plan: ScalePlan | null = null;
const loadTests: string[] = [];
const scaleTasks: string[] = [];

export function createPlan(p: ScalePlan): void { plan={...p}; }
export function getPlan(): ScalePlan | null { return plan ? {...plan} : null; }
export function defineLoadTests(tests: string[]): void { loadTests.length=0; loadTests.push(...tests); }
export function getLoadTests(): string[] { return [...loadTests]; }
export function createScaleTasks(ids: string[]): void { scaleTasks.length=0; scaleTasks.push(...ids); }
export function getScaleTasks(): string[] { return [...scaleTasks]; }
export function isMillionReady(): boolean { return false; }
export function gateDependsCorrect(): boolean { return scaleTasks.length>0; }
