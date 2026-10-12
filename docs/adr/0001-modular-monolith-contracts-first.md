# ADR 0001: Модульный монолит и contracts-first
Статус: accepted 2026-10-06; concrete stack pinned в ADR 0007 (proposed→decided до Q-006 scaffold). Q-005G DONE (GO conditional P0/P1).
Модульный TS монолит + Python media workers; Postgres data/queue (pg-boss); private S3; minimal VPS. P0 spike 9-live завершён (Q-002..Q-005 + gate). Выбор auth/queue/UI/hosting зафиксирован ADR 0007 в составе Q-006 — без изобретённых дефолтов. Не обещаем scale на миллионы; вынос по измеренной нагрузке.

