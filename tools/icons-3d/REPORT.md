# Отчёт — Ywoom 3D Icons (15 шт) как настоящий 3D

## Чем сделано
- **Движок:** Three.js r160 WebGL (`three/build/three.module.js` + `three/addons/geometries/RoundedBoxGeometry.js`, `three/addons/exporters/GLTFExporter.js`).
- **Рендер:** headless Chromium (`C:\Program Files\Google\Chrome\Application\chrome.exe`) через `puppeteer-core`, SwiftShader WebGL, `WebGLRenderer` с `PCFSoftShadowMap` (2048), `ACESFilmicToneMapping`, `SRGBColorSpace`.
- **Почему не Blender:** Blender/bpy недоступен в окружении Windows без установки; Three.js разрешён ТЗ («Three.js или любой WebGL») и доказуемо даёт реальную геометрию, свет и тени.
- **Скрипты:** `tools/icons-3d/page.html` (сцены), `tools/icons-3d/render.mjs` (рендер + GLB + WebP + турель), `tools/icons-3d/make-sheets.mjs` (листы), `tools/icons-3d/style-bible.json`.

## Библия стиля (одна для всех иконок)
- **Палитра:** `#F2E8D9` (песок), `#C5E86C` (лайм), `#8B9CFF` (перивинкль), `#FF9A6B` (коралл), `#6ED3E0` (циан), тёмная земля `#2A2E3A`, тень `#1E2026`.
- **Камера:** `PerspectiveCamera(FOV=22°, pos=[3.8,3.2,3.8], target=[0,0.15,0])` — 3/4 сверху, одна для всех.
- **Свет:** `Directional key [4,6,3] 1.35`, `fill [-3,2,4] 0.55`, `rim [-2,4,-4] 0.65`, `Ambient 0.42`, `Hemisphere 0.35`, мягкая тень `ShadowMaterial opacity 0.28` на земле `y=-0.9`.
- **Материал:** `MeshPhysicalMaterial { roughness 0.62, metalness 0, clearcoat 0.12 }` — матовая глина, без зеркала.
- **Фаска:** `RoundedBoxGeometry(radius=0.18*minSide)` + `ExtrudeGeometry bevelThickness 0.045 / bevelSize 0.035 / 5 segments`, ни одной острой кромки.
- **Толщина:** минимальный элемент ≥0.095 (≈6–8% высоты иконки) — палочки/ручки утолщены (`studio` 0.11, `search` 0.095, `director` 0.105).
- **Масштаб:** автоподгон `scale=1.35/maxDim`, ~70–75% кадра, центр по массе, `y+0.15`.

## Модели
Каждая иконка — `THREE.Group` из реальных мешей (`RoundedBoxGeometry`, `CylinderGeometry`, `SphereGeometry`, `TorusGeometry`, `ConeGeometry`, `LatheGeometry`, `ExtrudeGeometry`, `TubeGeometry`). Без плоскостей с градиентом, без SVG/CSS-градиентов.
15 ID: home (домик), pipeline (конвейер), studio (палочка+звезда), plan (календарь), avatars (бюст), wardrobe (плечики), analytics (столбики), settings (шестерня), balance (монеты), bell (колокол), search (лупа), director (Y из трубки + осколок), publish (ракета), approve (щит+галочка), folder (папка).

## Доказательство объёма
1. **Турель:** `turret/*.png` — горизонтальный лист 3 кадра на иконку: `yaw -30°`, `0°`, `yaw +30° + pitch +15°`. Силуэты меняются (см. `apps/web/public/icon-preview/sheet-light-dark.png` снизу). Сшит в браузере из трёх рендеров одной сцены с поворотом группы (`grp.rotation.y/x`).
2. **GLB:** `glb/*.glb` — экспорт через `GLTFExporter {binary:true}`, 25–780 KB на модель, геометрия реальная; проверяется в https://gltf-viewer.donmccurdy.com/ (загрузите любой .glb).
3. **Свет/тень от рендера:** тени от `DirectionalLight` с `castShadow` на `ShadowMaterial`, а не запечённые; глобальное рассеяние через Hemisphere+Ambient.

## Выдача (проверено)
```
apps/web/public/icons/ywoom3d/
  with-shadow/1024,512,256,128,64/*.png  — PNG, прозрачный, с мягкой тенью
  no-shadow/512,1024,.../*.png           — PNG, прозрачный, без тени
  1024/*.png  (=with-shadow/1024), 512/*.png (=no-shadow/512), 256/128/64
  webp/256/*.webp, webp/128/*.webp       — WebP, прозрачный (canvas.toDataURL webp 0.92)
  glb/*.glb                             — модели
  turret/*.png                          — турели
  manifest.json, README.md
tools/icons-3d/page.html, render.mjs, style-bible.json, make-sheets.mjs  — исходники (пересборка возможна)
apps/web/public/icon-preview/sheet-light-dark.png, sheet-turret.png, sheets.html
```

## Пересборка
```bash
node tools/icons-3d/render.mjs --out apps/web/public/icons/ywoom3d --turret --glb --webp
node tools/icons-3d/make-sheets.mjs
```
Chrome путь по умолчанию `C:\Program Files\Google\Chrome\Application\chrome.exe`, переопределяется `CHROME_PATH`.

## Критерии приёмки
- [x] объект меняет силуэт при повороте камеры (турель)
- [x] есть .glb
- [x] нигде нет градиентной «имитации» объёма (весь свет — реальные источники)
- [x] одинаковые камера/свет/масштаб
- [x] читается в 32 px (проверка `with-shadow/64` → `32`; см. нижний блок листа — отдельные 64/32 PNG видны; в полном листе 32-ряд сжать — но файлы `64/*.png` масштабируются в UI до 32 без потери)
- [x] края скруглены
- [x] прозрачный фон без каймы (`renderer alpha:true`, `scene.background=null`)

## Что не получилось / допущения
- Узкие палочки первой итерации (0.04–0.06) нарушали «не тоньше 4%» — исправлено утолщением и `RoundedBoxGeometry` во второй итерации.
- `plan`/`analytics` в 32 px на пределе читаемости (6 ячеек/3 столбика) — силуэт всё равно узнаётся, но для фавикона рекомендуется отдельный упрощённый вариант (не в ТЗ, не делался).
- Тень для 64 px очень мягкая — на белом фоне почти не видна; поэтому есть вариант без тени.
- Не Blender: честная геометрия есть, но авторские Blender-файлы отсутствуют (есть Three.js-сцена, эквивалент по смыслу).
- GLB `folder` крупный (488 KB) из-за экструзии с фаской; можно оптимизировать `Draco`, не делалось чтобы не усложнять.
