# ADR 0001: Модульный монолит и contracts-first
Статус: retained design direction; concrete stack selection pending P1.
Модульный TS монолит + Python media workers; Postgres data/queue; object storage.
P0 CLI spike перед full scaffold. Критические choices auth/queue/UI зафиксировать отдельным ADR.
Не обещаем бесшовный перенос на миллионы пользователей; вынос компонентов по измеренной нагрузке.
