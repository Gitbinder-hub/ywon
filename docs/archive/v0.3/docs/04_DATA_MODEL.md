# 04. Модель данных — согласованные сущности

Это концептуальная схема, не миграция. Q-006 закрепляет точные типы/индексы/constraints в contracts и ADR.
Tenant-owned записи: workspace_id NOT NULL, FK с tenant consistency, created_at/updated_at/version.
users — глобальная identity; memberships(workspace_id,user_id,role) — связь. Не добавлять workspace_id в users механически.
System-wide каталоги отделены от tenant data и не наследуют доступ пользователя автоматически.

## Пользователь/онбординг
users(email,name,ui_language); workspaces(name,status); memberships(user_id,workspace_id,role).
genomes(owner_user_id) — модель человека, без self/twin/persona/faceless kind.
genome_facts(genome_id,key,value,tier:confirmed|inferred|experimental,confidence,source,valid_from,valid_to).
onboarding_sessions(user_id,project_id?,stage,answers,required_missing,friction,completed_at).
consents(subject_ref,kind:face|voice|data,scope,evidence_ref,granted_at,expires_at,revoked_at,policy_version).

## Иерархия и язык
projects(genome_id,goals); channels(project_id,platform,external_id,auth_ref,content_language,review_policy,storage_policy).
series(project_id,primary_channel_id,name,format,language_override,cadence).
series_channels(series_id,channel_id,distribution_role) — явная доставка, не неразличимый массив channels.
episodes(series_id,primary_channel_id,language,status,manifest_ref,accepted_manifest_version).
Язык: series override → primary channel. primary channel обязан быть связан с series, в том же project/workspace.
Для другого языка создаётся localization; для mirror — связанный эпизод/канал, не скрытая смена language.
bibles(scope_type:project|channel|series|episode,scope_id,version,content) — immutable versions.
Разрешение: project → primary channel → series → episode. Запреты верхнего уровня не ослаблять merge автоматически.
characters(project_id,bio,look_pack_ref); channel_presentations(channel_id,series_id?,kind:self|twin|persona|faceless,character_id?,identity_refs).
scenes(episode_id,idx,tier,duration,spec); shots(scene_id,idx,duration,spec,status).
localizations(episode_id,language,mode,script_ref,audio_ref,subs_ref,metadata,status).

## Медиа и навыки
assets(kind,uri,hash,byte_size,license_ref,consent_refs,provenance,retention_policy,availability,meta).
asset_dependencies(parent_asset_id,input_asset_id); manifest_versions(episode_id,version,json,hash,renderer_version).
skills(key,version,status:draft|canary|active|deprecated,scope,manifest); presets(kind,key,version,implementations,limitations).
skill_runs(skill_version,episode_id?,inputs,outputs,report,cost,qa,outcome).
identities(kind:face|voice|style,refs,model_ref,consent_ref,qa_calibration_ref).

## Durable provider operations и бюджет
provider_operations(operation_id,idempotency_key?,workspace_id,request_hash,provider,model,external_job_id?,
 status:intent|submitted|running|unknown|succeeded|failed|cancelled,attempt,deadline,lease,request_ref,result_ref).
generations(operation_id,shot_id?,asset_id?,seed?,model_version?,prompt_version,qa,error,billed_cost).
budget_reservations(operation_id,scope,period,amount,currency,state:held|settled|released,expires_at).
budgets(scope,period,limit,spent,reserved,currency); cost_ledger(operation_id?,agent_run_id?,unit,units,
 unit_price,billed_cost,pricing_version,generated_seconds,used_seconds,bill_status:estimate|pending|confirmed).
Used seconds: по уникальным использованным сегментам для waste, отдельно суммарная экранная длительность reuse.
Zero kept → waste undefined/infinite, не 0. Учёт списаний не append-only запись с меняющейся ценой: corrections отдельными строками.

## Доставка и обучение
publications(episode_id,channel_id,manifest_version,external_id?,status,idempotency_key,approval_ref,upload_operation_id).
metrics_observations(publication_id,window,source,imported_at,values,availability,sample_size?) — не все метрики доступны.
metrics_daily — нормализованная проекция с NULL для отсутствующих данных.
golden_items(scope,language,market,type,content,provenance,quality_evidence,audience_evidence,expires_at).
experiments(hypothesis,primary_metric,assignment,eligible_cohort,min_sample,max_window,status,result,uncertainty).
insights(scope,text,evidence,tier). Не хранить inferred как confirmed.

## Управление
commands/events append-only; approvals(actor,scope,artifact_version,decision,time); decisions(question,choice,reason).
policies(scope,action,limits,version); agent_roles(key,version,tools,model_policy); agent_runs(role,task,model,tokens,cost,outcome).
secrets/auth refs — только ссылки, ключи вне БД в открытом виде.
