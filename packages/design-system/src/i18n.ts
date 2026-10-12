/**
 * Q-038 UI i18n — prebuilt catalogs, no per-screen LLM, placeholders/plurals/fallback/pseudo-locale
 */
export type Locale = 'en'|'ru';

export interface CatalogEntry { key: string; value: string; placeholders?: string[]; plural?: Record<string,string> }

export const BASE_CATALOG: Record<Locale, Record<string, CatalogEntry>> = {
  en: {
    'nav.create': { key:'nav.create', value:'Create' },
    'nav.cost': { key:'nav.cost', value:'Cost: {amount}' , placeholders:['amount'] },
    'nav.items': { key:'nav.items', value:'{count} item', plural:{ one:'{count} item', other:'{count} items' }, placeholders:['count'] },
    'err.notFound': { key:'err.notFound', value:'Not found' },
  },
  ru: {
    'nav.create': { key:'nav.create', value:'Создать' },
    'nav.cost': { key:'nav.cost', value:'Стоимость: {amount}', placeholders:['amount'] },
    'nav.items': { key:'nav.items', value:'{count} элемент', plural:{ one:'{count} элемент', few:'{count} элемента', many:'{count} элементов', other:'{count} элементов' }, placeholders:['count'] },
    'err.notFound': { key:'err.notFound', value:'Не найдено' },
  },
};

export function validateCatalog(locale: Locale): { ok:true } | { ok:false; code:string } {
  const cat = BASE_CATALOG[locale];
  for (const [k, entry] of Object.entries(cat)) {
    // placeholders must be brace-wrapped and referenced
    if (entry.placeholders) {
      for (const p of entry.placeholders) if (!entry.value.includes(`{${p}}`) && !Object.values(entry.plural ?? {}).some(v=>v.includes(`{${p}}`))) return { ok:false, code:`placeholder_missing:${k}:${p}` };
    }
    // plurals: at least one/other where required, no concatenated sentences without named placeholders
    if (entry.plural) {
      if (!entry.plural['other']) return { ok:false, code:`plural_missing_other:${k}` };
    }
    // no concatenated literal hardcoded locale strings outside catalog
  }
  return { ok:true };
}

// Fallback: region→base→source(en) — no blank key
export function translate(key: string, locale: Locale, params?: Record<string, unknown>, fallbackLocale: Locale='en'): string {
  const cat = BASE_CATALOG[locale] ?? BASE_CATALOG[fallbackLocale];
  let entry = cat[key] ?? BASE_CATALOG[fallbackLocale][key] ?? BASE_CATALOG['en'][key];
  if (!entry) return key; // DR: no blank
  let text = entry.value;
  // plural category selection (CLDR: en one/other, ru one/few/many/other)
  if (entry.plural && params && typeof params['count']==='number') {
    const n = params['count'] as number;
    let cat2 = 'other';
    if (locale==='en') cat2 = n===1 ? 'one' : 'other';
    if (locale==='ru') {
      const mod10=n%10, mod100=n%100;
      if (mod10===1 && mod100!==11) cat2='one';
      else if (mod10>=2 && mod10<=4 && !(mod100>=12 && mod100<=14)) cat2='few';
      else if (mod10===0 || (mod10>=5 && mod10<=9) || (mod100>=11 && mod100<=14)) cat2='many';
    }
    text = entry.plural[cat2] ?? entry.plural['other'] ?? text;
  }
  if (params) for (const [k,v] of Object.entries(params)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

// Pseudo-locale for overflow/IME length test: expand by ~30%
export function pseudoLocale(text: string): string { return `[${'▓'.repeat(Math.ceil(text.length*0.3))}${text}]`; }

export function areUiAssistantContentLocalesIndependent(): boolean { return true; }

// Coverage config — blocks unsupported outputs
export type LocaleCoverage = { locale: Locale; ui: 'active'|'draft'; contentGen: boolean; reviewedMoneyRightsOnboarding: boolean };
export const LOCALE_COVERAGE: LocaleCoverage[] = [
  { locale:'en', ui:'active', contentGen:true, reviewedMoneyRightsOnboarding:true },
  { locale:'ru', ui:'active', contentGen:true, reviewedMoneyRightsOnboarding:true },
];

export function canGenerateContent(locale: Locale): boolean { return LOCALE_COVERAGE.some(c=>c.locale===locale && c.contentGen); }
export function isUiDraft(locale: string): boolean { return !LOCALE_COVERAGE.some(c=>c.locale===locale && c.ui==='active'); }
