// Optional B-003 deep link. Existing studio.js workflow remains unchanged.
'use strict';
const requestedJourneyProject = new URLSearchParams(window.location.search).get('projectId');
if (requestedJourneyProject) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(requestedJourneyProject)) {
    message('Некорректная ссылка на проект. Выбери проект из списка.');
  } else {
    void action(async () => {
      await refreshProjects();
      const p = await api('/projects/' + requestedJourneyProject);
      clearResult(); apply(p); await refreshProjects(); await history();
      message('Загружен подготовленный план. Добавь свои изображения и готовую озвучку; AI-генерации здесь нет.');
    });
  }
}
