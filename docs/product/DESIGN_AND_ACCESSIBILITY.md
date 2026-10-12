# Простая, цельная оболочка

## Принципы
Result-first, progressive disclosure, одна терминология, предсказуемая навигация, сохранение контекста.
Главный экран отвечает: что создаём, что готово, что ждёт меня, сколько стоит, что дальше.
Чат — один способ управления, не единственная навигация. Форматные пресеты объясняются примерами.
Дизайн-токены (типографика/цвет/отступы/motion), общие компоненты task/result/cost/approval,
единые loading/empty/error/offline states. Нет визуального шума из имён моделей и четырёх агентов.
Цена/отказ/согласие не спрятаны; отсутствуют dark patterns и гарантии вирусности.

## Адаптивность
Desktop: canvas + contextual tools + assistant, timeline при видео.
Tablet: изменяемые панели; phone: одна основная поверхность, tabs/sheets, focused tools,
zoom/select и числовые поля вместо обязательного точного drag. Landscape опционален, не обход доступности.
Small viewport не выключает workflow: смета, brief, upload, generation, review, edits, export доступны.
Тяжёлый рендер на сервере, proxy/lazy thumbnails/virtualized timeline на клиенте.

## Доступность
Цель WCAG 2.2 AA ключевых journeys; проверка keyboard/screen reader/contrast/focus/reduced motion.
Drag/rotate/trim имеют кнопки/числовые альтернативы; canvas layers доступны в структурном списке.
Ошибки связаны с полями; status announcements не засоряют screen reader.
Размеры касаний проектируются под mobile, большие шрифты/200% zoom не ломают approve/cost controls.
Locale/RTL/длинные строки/IME проверяются, формат цвета не единственный сигнал статуса.

## Acceptance
Q-038 задаёт дизайн-систему и базовый responsive workflow; Q-041 проверяет реальные novice journeys.
Viewport matrix и performance budgets выбираются в ADR с устройствами/сетью и baseline; числа не выдумывать
до prototype measurement. Product acceptance включает usability, не только screenshot similarity.
