# Ywon — каноническое имя Архитектора

Пользователь подтвердил точное имя **Ywon** 2026-10-05. Оно заменяет Qevunara / Кевунара как актуальное display name общего ядра/Архитектора в Factory и Desktop Companion. Factory остаётся Ywoom. Новые пользовательские тексты и новые спецификации используют Ywon. Произношение и отдельная wake phrase пока не подтверждены: не придумывать их и не включать микрофон через переименование.
Qevunara / Кевунара и JEWEL сохраняются как historical/compatibility aliases одного ядра, а не отдельные продукты. Историю, архивы, task/operation IDs, версии/хеши контрактов, подписи, machine key `qevunara`, существующие пути/API/DB и ранее выданные approvals НЕ переименовывать косметически. Реальная external API/DB migration только отдельно, с версией, обратной совместимостью и rollback. Переименование не расширяет права, не меняет деньги, задачи или принятие продукта.

## Приоритет и продолжение
Этот файл — актуальный источник имени после owner confirmation. Старые amendments/handoffs могут говорить Qevunara или отмечать, что новое имя ещё не сообщено: это историческое состояние, не повод откатить Ywon. Их прочие архитектурные требования и gates сохраняются без изменений. Display name, stable technical IDs и optional wake phrase независимы. AGENTS.md/CLAUDE.md/README.md/INDEX.md и текущий voice contract ссылаются на эту запись; не создавать второго registry имени.

## Проверки нового имени
Ywon: domain/registrar/RDAP, официальные trademark registers/classes/jurisdictions, магазины приложений, handles и сходство названий NOT_CHECKED. Старый screening Qevunara ниже НЕ относится к Ywon. Ни уникальность, ни trademark clearance не заявлены. Перед публичным запуском проверить имя отдельно; название не блокирует внутренний прототип.
Docs-only update from f40939f5d4a8e59cb3d1a1061fb33d4a51e8cb62; runtime/SQLite/task registry/paid permission unchanged. Проверены точные replacements, совместимость aliases и равенство AGENTS/CLAUDE; runtime tests не перезапускались для этой docs-only правки. Evidence B-053/B-054 остаётся историческим scoped результатом.

## Historical Qevunara screening — 2026-10-03 (не проверка Ywon)

Browser setting disabled; использован публичный web search, не browser store interaction. Exact-name запрос и запросы с AI/software/app, site:play.google.com, site:apps.apple.com, trademark не выявили явного точного одноимённого продукта в возвращённых результатах. Поисковик расширял некоторые запросы и показывал нерелевантные результаты: отрицательное свидетельство слабое.
Кандидаты Qorvyn, Auvyro, Qelviro, Qoventra, Qavoryn отклонены из-за найденных существующих применений. Не утверждается, что JEWEL принадлежит Meta: это не проверено.
Qevunara: domain availability NOT_CHECKED; registrar/RDAP NOT_CHECKED; official trademark registers/classes/jurisdictions NOT_CHECKED; direct Google Play/App Store listing search NOT_RUN; social handles/phonetic similarity NOT_CHECKED. Имя не гарантированно уникально и не cleared trademark.
Перед публичным запуском: домены, official registers и сходные знаки в целевых software/entertainment classes, магазины/handles и юридический review. При конфликте меняется display name, не state/contracts.
