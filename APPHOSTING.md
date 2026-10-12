# App Hosting deploy (новый бесплатный домен)

## One-time
```bash
npm i -g firebase-tools
firebase login
firebase projects:create ywon-factory --display-name "Ywon Factory"
firebase apphosting:backends:create --project ywon-factory
# Секреты (не в git):
firebase apphosting:secrets:set Ywoom_SESSION_SECRET --project ywon-factory
firebase apphosting:secrets:set DATABASE_URL --project ywon-factory
firebase apphosting:secrets:set S3_ENDPOINT --project ywon-factory
firebase apphosting:secrets:set S3_BUCKET --project ywon-factory
firebase apphosting:secrets:set S3_ACCESS_KEY_ID --project ywon-factory
firebase apphosting:secrets:set S3_SECRET_ACCESS_KEY --project ywon-factory
# опционально: GEMINI_API_KEY, TELEGRAM_BOT_TOKEN, etc.
```

## Каждый деплой
`apphosting.yaml` уже в корне: `runCommand: node apps/api/src/server.ts`, `Ywoom_CLOUD=1` → сервер слушает `0.0.0.0:$PORT` и разрешает public same-origin (иначе `/api/offline/*` отдавал 403).

Подключи репо к App Hosting в консоли Firebase — каждый push в `main` деплоит и даёт URL вида `https://<backend>--ywon-factory.web.app`.

## Локально как в облаке
```
Ywoom_CLOUD=1 PORT=3000 node apps/api/src/server.ts
curl http://localhost:3000/api/health
```

## Что уже починено для шаринга
- `apps/api/src/server.ts`: `0.0.0.0` в cloud, health/storage без `isAllowedPreviewRequest` когда `Ywoom_CLOUD=1`, `PORT 1..65535`, `/api/auth/logout`
- `apps/api/src/local-request.ts`: same-origin в cloud, `isPublicCloud()`
- `apps/api/src/billing.ts`: персистентность файл + Postgres `ywoom_billing` (фолбек без Stripe по твоей просьбе)
- `Dockerfile` + `.dockerignore` + `apphosting.yaml` + `firebase.json` для App Hosting
- Мобилки/Stripe: отложено по твоей просьбе
