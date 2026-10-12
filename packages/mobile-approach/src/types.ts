/** Q-046 types */
export type MobileApproach = 'pwa'|'wrapper'|'native';
export interface ApproachADR { chosen: MobileApproach; licensesOk:boolean; performanceTested:boolean }
