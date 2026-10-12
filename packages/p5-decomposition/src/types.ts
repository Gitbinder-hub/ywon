/** Q-025 types */
export interface P5Task { id:string; featureId:string; scope:string; budgetMinor:number; rightsChecked:boolean; dependsOn:string[] }
export interface Decomposition { tasks:P5Task[]; gateDependsOn:string[] }
