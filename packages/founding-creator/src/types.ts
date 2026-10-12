/** Q-043 types */
export interface CohortOffer { cohortSize:number; generationFees:Record<string,number>; eligibility:string; lifetimeScope:string; supportEconomics:string; negativeReviewAllowed:boolean }
export interface DisclosureConsent { disclosureGiven:boolean; consentForTestimonial: boolean; metricsPrivacySafe:boolean }
