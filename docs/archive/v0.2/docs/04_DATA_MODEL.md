# 04. Модель данных (ядро)

Все таблицы: `id uuid`, `workspace_id`, `created_at`, `updated_at`, `version`. Доступ — строго по workspace (тест обязателен).

## Люди и доступ
- `users(email, name, ui_language)`
- `workspaces(name, plan)`; `memberships(user_id, workspace_id, role)`

## Creator Genome (docs/07)
- `genomes(owner_user_id, kind: self|twin|persona|faceless)`
- `genome_facts(genome_id, key, value jsonb, tier: confirmed|inferred|experimental, confidence 0..1, source, valid_from, valid_to, context)`

## Онбординг
- `onboarding_sessions(user_id, project_id?, stage, answers jsonb, required_missing[], started_at, completed_at, friction jsonb /*время на этап, возвраты, жалобы*/)`

## Иерархия контента
- `projects(name, genome_id, goals jsonb, autonomy_level, budget_monthly)`
- `channels(project_id, platform, external_id, handle, auth_ref, content_language NOT NULL /*BCP-47, без default*/, secondary_languages[], localization_mode: single|subtitled|dubbed|mirror_channels, ai_video_share_max, review_mode, storage_target)`
- `series(project_id, channel_ids[], name, format: short|long|carousel|story, cadence, language_override?)`
- `bibles(scope_type: project|series|episode, scope_id, content jsonb, version)` — наследование сверху вниз
- `characters(project_id, name, bio jsonb, voice_ref, look_pack_id)`
- `episodes(series_id, status, planned_at, language /*вычисляется и фиксируется*/, manifest jsonb, cost_estimate, cost_actual, review_mode)`
- `localizations(episode_id, language, mode: subtitles|dub|mirror, script_ref, audio_ref, subs_ref, metadata jsonb, status)`
- `scenes(episode_id, idx, tier: T0..T4, duration_s, spec jsonb)`
- `shots(scene_id, idx, spec jsonb, status)`

## Ассеты и генерации
- `assets(kind: image|video|audio|subtitle|3d|thumbnail|final, uri, storage_tier, hash, meta jsonb, is_golden bool)`
- `generations(shot_id?, asset_id?, provider, model, capability, request jsonb, request_hash, seed, status, attempts, cost_usd, latency_ms, qa_scores jsonb, error)` — `request_hash` для кэша

## Студия и навыки (docs/15)
- `skills(key, version, status: draft|canary|active|deprecated, manifest jsonb, scope: system|workspace, parent_version)`
- `skill_runs(skill_id, skill_version, episode_id?, shot_id?, inputs jsonb, outputs jsonb, delivery_report jsonb, cost_usd, qa_scores jsonb, outcome)`
- `presets(kind: camera|vfx|genre|look|transition|rig, key, version, params jsonb, impls jsonb /*blender|prompt[model_family]|ffmpeg*/, stats jsonb)`
- `identities(project_id, kind: face|voice|style, refs jsonb, model_ref, consent_ref, qa_threshold)`

## Расходы
- `cost_ledger(generation_id?, agent_run_id?, provider, model, unit: second|token|image|char|minute, units, unit_price_usd, resolution, with_audio, cost_usd, seconds_generated, seconds_kept, episode_id?, skill_run_id?)`

## Публикация и аналитика
- `publications(episode_id, channel_id, external_id, status, scheduled_at, idempotency_key)`
- `metrics_daily(publication_id, date, views, ctr, avd_s, apv, subs_delta, retention_curve jsonb)`

## Обучение и память
- `golden_items(type: prompt|hook|scene_pattern|edit_pattern|thumbnail|title|skill_diff, content jsonb, embedding vector, scope, language, market, score, uses, wins)`
- `experiments(hypothesis, variant_a, variant_b, metric, status, result)`
- `insights(scope, text, evidence jsonb, tier)`

## Управление
- `commands(actor_type: user|agent, actor_id, type, payload, parent_id, status, cost_usd)` — append-only
- `decisions(question, options jsonb, chosen, reason, context)` — история решений владельца (питает Genome владельца)
- `budgets(scope, period, limit_usd, spent_usd)`
- `policies(scope, action, autonomy_level, limits jsonb)`
- `agent_runs(role, task_ref, model, tokens_in, tokens_cached, tokens_out, cache_hit_rate, cost_usd, billing: api|subscription, outcome)`
