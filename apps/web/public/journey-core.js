// journey-core — deterministic offline draft, per-factory briefing.
// Архитектор: один draft ведёт через любую фабрику. Фабрика выбирается на Главной и сохраняется в draft.factory.
export const STORAGE_KEY = 'Ywoom.b003.brief.v1';
export const FACTORIES = {
  'content-factory': { label: 'Контент-Завод', hint: 'Видео из своих материалов — Студия соберёт MP4.', href: '/studio' },
  'freelance-autopilot': { label: 'Фриланс-Автопилот', hint: 'Собирает черновики ставок — человек подтверждает отправку, gate >10%.', href: '/journey?factory=freelance-autopilot' },
  'bot-factory': { label: 'Бот-Фабрика', hint: 'Telegram / Discord / виджет — scaffold, публикация только после approval.', href: '/journey?factory=bot-factory' },
  'code-scaffold': { label: 'Код-Скаффолд', hint: 'Заготовка проекта по брифу — typed recipe, versioned.', href: '/journey?factory=code-scaffold' },
  'telegram-network': { label: 'Сеть Telegram-каналов', hint: 'Контент-план канала → серия постов → черновики → публикация по расписанию.', href: '/journey?factory=telegram-network' },
  'commerce': { label: 'Товары / Реклама / B-roll', hint: 'tovary-hero, reklama-banner, b-roll-planning — каждый gated skill.', href: '/skills?factory=commerce' },
};
export const FACTORY_FIELDS = {
  'content-factory': [
    ['goal', 'Что нужно объяснить и какой результат получить?', 1000],
    ['audience', 'Для кого этот ролик?', 500],
    ['language', 'На каком языке будет ролик?', 0],
    ['duration', 'Длительность: 30–60 секунд?', 0],
    ['aspect', 'Вертикальный или горизонтальный формат?', 0],
  ],
  'freelance-autopilot': [
    ['goal', 'Какую работу ищешь? Опиши навык/услугу', 600],
    ['query', 'Ключевые слова для поиска проектов', 120],
    ['platforms', 'Биржи: kwork / fl / freelancer', 0],
    ['budget_floor', 'Минимальный бюджет (₽/USD), 0 если любой', 0],
    ['audience', 'Кому отправляем ставки? (профиль/ниша)', 400],
  ],
  'bot-factory': [
    ['goal', 'Что должен делать бот? Сценарий/логика', 1200],
    ['platform', 'Где бот: telegram / discord / web_widget', 0],
    ['commands', 'Команды через запятую (/start, /help)', 400],
    ['language_code', 'На чём: typescript / python', 0],
  ],
  'code-scaffold': [
    ['goal', 'Что строим? Заготовка проекта — цель/фичи', 1200],
    ['stack', 'Стек/требования (например: Next.js + Postgres)', 400],
    ['language_code', 'На чём: typescript / python', 0],
    ['audience', 'Для кого/куда деплой', 300],
  ],
  'telegram-network': [
    ['goal', 'Тема и цель сети / канала', 600],
    ['channel', 'Канал / сеть: ник, ссылка или «новый»', 120],
    ['audience', 'Для кого и о чём канал?', 500],
    ['schedule', 'Частота: daily / 3×week / weekly', 0],
    ['language', 'Язык контента', 0],
  ],
  'commerce': [
    ['goal', 'Что показываем: товар/оффер/ролик — опиши', 800],
    ['audience', 'Для кого / канал (OZON, TG, сайт)', 400],
    ['language', 'Язык контента', 0],
  ],
};
export function defaultFactoryFromURL(){
  try{ const v=new URLSearchParams(location.search).get('factory'); if(v && FACTORIES[v]) return v; }catch{}
  return 'content-factory';
}
export const MODES = ['talk', 'guided', 'import'];
export const FIELDS = [
  ['goal', 'Что нужно объяснить и какой результат получить?', 1000],
  ['audience', 'Для кого этот ролик?', 500],
  ['language', 'На каком языке будет ролик?', 0],
  ['duration', 'Какая длительность нужна: 30–60 секунд?', 0],
  ['aspect', 'Вертикальный или горизонтальный формат?', 0],
];
export function freshDraft() {
  return { factory: defaultFactoryFromURL(), mode: 'talk', step: 0, brief: { goal: '', audience: '', language: '', duration: '', aspect: '', sourceNotes: '', query: '', platforms: 'kwork', budget_floor: '', platform: 'telegram', commands: '', stack: '', language_code: '', channel: '', schedule: 'daily' }, script: '', scenes: [], sceneScript: '', scriptReviewed: false, rights: false, finalReview: false, approval: null, handoff: null };
}
const obj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v, keys) => obj(v) && Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));
export function validateDraft(d) {
  const f = freshDraft();
  if (!exact(d, Object.keys(f)) || !MODES.includes(d.mode) || !Number.isInteger(d.step) || d.step < 0 || d.step > 3) throw new Error('Неподдерживаемый черновик');
  if (typeof d.factory !== 'string' || !FACTORIES[d.factory]) throw new Error('Фабрика не выбрана');
  if (!exact(d.brief, Object.keys(f.brief))) throw new Error('Неподдерживаемый бриф');
  for (const [key, max] of [['goal', 1200], ['audience', 500], ['sourceNotes', 2000], ['query',120], ['commands',400], ['stack',400], ['channel',120]]) if (typeof d.brief[key] !== 'string' || d.brief[key].length > max) throw new Error('Некорректное поле брифа: '+key);
  if (typeof d.brief.platforms !== 'string' || typeof d.brief.budget_floor !== 'string') throw new Error('Некорректное поле биржи');
  if (typeof d.brief.platform !== 'string' || typeof d.brief.language_code !== 'string') throw new Error('Некорректное поле бота');
  if (!['', 'ru'].includes(d.brief.language) || !['', 'portrait', 'landscape'].includes(d.brief.aspect)) throw new Error('Язык/формат не поддерживается');
  if (d.brief.duration !== '' && (!Number.isInteger(d.brief.duration) || d.brief.duration < 30 || d.brief.duration > 60)) throw new Error('Длительность: 30–60 целых секунд');
  if (typeof d.script !== 'string' || d.script.length > 4000 || typeof d.sceneScript !== 'string' || d.sceneScript.length > 4000 || !Array.isArray(d.scenes) || d.scenes.length > 6) throw new Error('Некорректный сценарий');
  for (const s of d.scenes) if (!exact(s, ['text']) || typeof s.text !== 'string' || s.text.length > 180) throw new Error('Некорректная сцена');
  for (const k of ['scriptReviewed', 'rights', 'finalReview']) if (typeof d[k] !== 'boolean') throw new Error('Некорректное подтверждение');
  if (d.approval !== null && (typeof d.approval !== 'string' || d.approval.length > 20000)) throw new Error('Некорректная версия подтверждения');
  if (d.handoff !== null && (!exact(d.handoff, ['key', 'state', 'id']) || typeof d.handoff.key !== 'string' || d.handoff.key.length > 12000 || !['pending', 'ready'].includes(d.handoff.state) || (d.handoff.id !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(d.handoff.id)) || (d.handoff.state === 'ready' && d.handoff.id === null))) throw new Error('Некорректная передача');
  return d;
}
export function readRecord(raw) {
  if (raw === null) return null;
  const r = JSON.parse(raw);
  if (!exact(r, ['schemaVersion', 'revision', 'draft']) || r.schemaVersion !== 1 || !Number.isSafeInteger(r.revision) || r.revision < 1) throw new Error('Не удалось прочитать сохранённый черновик. Он не перезаписан.');
  // backward compat: old drafts without factory
  if (!r.draft.factory) r.draft.factory = 'content-factory';
  if (!('query' in r.draft.brief)) { r.draft.brief.query=''; r.draft.brief.platforms='kwork'; r.draft.brief.budget_floor=''; r.draft.brief.platform='telegram'; r.draft.brief.commands=''; r.draft.brief.stack=''; r.draft.brief.language_code=''; r.draft.brief.channel=''; r.draft.brief.schedule='daily'; }
  validateDraft(r.draft); return r;
}
export function factoryFields(factory){ return FACTORY_FIELDS[factory] || FIELDS; }
export function missingFields(d) {
  const fields = factoryFields(d.factory);
  return fields.filter(([k]) => {
    if (k==='duration') return !Number.isInteger(d.brief[k]);
    if (k==='platforms' || k==='platform') return !String(d.brief[k]||'').trim();
    if (k==='budget_floor' || k==='language_code' || k==='schedule') return false;
    return !String(d.brief[k]||'').trim();
  }).map(([k]) => k);
}
export function outline(d) {
  if (missingFields(d).length) throw new Error('Сначала заполни недостающие поля брифа');
  return `Тема: ${d.brief.goal.trim()}\n\n${d.brief.sourceNotes.trim() || '[ДОБАВЬТЕ проверенные факты своими словами]'}\n\n[УТОЧНИТЕ итог или полезное действие для зрителя]`;
}
export function splitScript(script) {
  const parts = script.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  if (!script.trim() || script.length > 4000 || !parts.length || parts.length > 6) throw new Error('Сценарий: 1–6 абзацев, до 4000 символов');
  return parts.map((text) => ({ text: text.slice(0, 160) }));
}
export function invalidate(d) { d.approval = null; d.scriptReviewed = false; return d; }
export function signature(d) { return JSON.stringify({ factory: d.factory, brief: d.brief, script: d.script, scenes: d.scenes, sceneScript: d.sceneScript, scriptReviewed: d.scriptReviewed, rights: d.rights, finalReview: d.finalReview }); }
export function blockers(d) {
  const out = missingFields(d).map((k) => (factoryFields(d.factory).find(([key]) => key === k)||[k,k])[1]);
  if (d.factory==='content-factory') {
    if (!d.script.trim() || /\[(ДОБАВЬТЕ|УТОЧНИТЕ)/i.test(d.script)) out.push('Замени шаблонные подсказки готовым сценарием');
    if (!d.scenes.length || d.scenes.some((s) => !s.text.trim()) || d.sceneScript !== d.script) out.push('Обнови и проверь план из 1–6 сцен для текущего сценария');
  }
  if (!d.scriptReviewed) out.push('Подтверди проверку плана');
  if (!d.rights) out.push('Подтверди права на материалы');
  if (!d.finalReview) out.push('Подтверди ручную проверку финала');
  return out;
}
export function approve(d) { if (blockers(d).length) throw new Error(blockers(d).join('. ')); d.approval = signature(d); return d; }
export function approved(d) { return blockers(d).length === 0 && d.approval === signature(d); }
export function toPlan(d) {
  if (!approved(d)) throw new Error('Подтверди актуальный офлайн-план');
  // content-factory keeps strict plan shape; other factories map goal → title/script-lite
  if (d.factory==='content-factory') return { title: d.brief.goal.trim().slice(0, 120), script: d.script.trim(), duration: d.brief.duration, aspect: d.brief.aspect, trimAudio: false, audioId: null, scenes: d.scenes.map((s) => ({ text: s.text.trim(), imageId: null })) };
  return { title: `[${FACTORIES[d.factory].label}] ${d.brief.goal.trim().slice(0, 80)}`, script: d.brief.goal.trim() + '\n\n' + (d.brief.query||d.brief.commands||d.brief.stack||'').trim(), duration: d.brief.duration||30, aspect: d.brief.aspect||'portrait', trimAudio: false, audioId: null, scenes: (d.scenes.length? d.scenes: [{text: d.brief.goal.trim().slice(0,120)}]).map((s) => ({ text: s.text.trim(), imageId: null })) };
}
export function planKey(p) { return JSON.stringify({ title: p.title, script: p.script, duration: p.duration, aspect: p.aspect, trimAudio: p.trimAudio, audioId: p.audioId, scenes: p.scenes }); }
export function matchingProjects(projects, key) { if (!Array.isArray(projects)) throw new Error('Некорректный список проектов'); return projects.filter((p) => obj(p) && typeof p.id === 'string' && /^[0-9a-f-]{36}$/.test(p.id) && planKey(p) === key); }
export async function commitRecord(storage, locks, expectedRevision, draft) {
  validateDraft(draft); const snapshot = JSON.parse(JSON.stringify(draft));
  if (!locks?.request) throw new Error('Без Web Locks безопасное сохранение недоступно. Используй современный браузер на localhost.');
  return locks.request(STORAGE_KEY, async () => {
    const current = readRecord(storage.getItem(STORAGE_KEY));
    if ((current?.revision ?? 0) !== expectedRevision) throw new Error('Конфликт сохранения: другой вкладкой сохранена новая версия. Твои правки не перезаписаны; загрузи сохранённую версию.');
    if (!Number.isSafeInteger(expectedRevision + 1)) throw new Error('Исчерпан диапазон версий; сохрани отдельный новый черновик');
    const r = { schemaVersion: 1, revision: expectedRevision + 1, draft: snapshot };
    storage.setItem(STORAGE_KEY, JSON.stringify(r)); return r;
  });
}

export async function replaceRecord(storage, locks, draft) {
  validateDraft(draft);
  if (!locks?.request) throw new Error('Нужен браузер с Web Locks');
  return locks.request(STORAGE_KEY, async () => {
    let previous = null; try { previous = readRecord(storage.getItem(STORAGE_KEY)); } catch { /* explicit user-confirmed replacement only */ }
    if (!Number.isSafeInteger((previous?.revision ?? 0) + 1)) throw new Error('Исчерпан диапазон версий');
    const r = { schemaVersion: 1, revision: (previous?.revision ?? 0) + 1, draft: JSON.parse(JSON.stringify(draft)) };
    storage.setItem(STORAGE_KEY, JSON.stringify(r)); return r;
  });
}
