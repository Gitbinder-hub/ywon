# Ywoom 3D Icons — настоящий 3D набор (15 шт)

**Генератор:** `tools/icons-3d/` — Three.js r160 WebGL + headless Chrome, без 2D-градиентов.
**Библия стиля:** `tools/icons-3d/style-bible.json` — одна камера, один свет, один материал.

## Что входит
- `with-shadow/{1024,512,256,128,64}/*.png` — PNG, прозрачный фон + мягкая контактная тень (для 1024/512 видна, для мелких — тонкая)
- `no-shadow/{1024,512,256,128,64}/*.png` — PNG, прозрачный фон без тени
- `1024/*.png`, `512/*.png`, `256/*.png`, `128/*.png`, `64/*.png` — быстрые алиасы (1024 = with-shadow, 512 = no-shadow)
- `webp/256/*.webp`, `webp/128/*.webp` — WebP, прозрачный
- `glb/*.glb` — реальные меши (проверяется в https://gltf-viewer.donmccurdy.com/)
- `turret/*.png` — турель 3 ракурса на иконку (доказательство объёма)
- `manifest.json` — манифест
- Исходники: `tools/icons-3d/page.html`, `render.mjs`, `style-bible.json`

## Правила применения
- Используйте `no-shadow/512` (или `512/`) для UI-чипа/навигации на тёмном `#3a3c45` или светлом `#F6F0E6` фоне. `with-shadow/1024` — для лендингов/превью.
- Не перекрашивайте PNG фильтрами. Для перекраски пересоберите: поменяйте цвет в `page.html` → `palette` или в `style-bible.json`, запустите `node tools/icons-3d/render.mjs --out apps/web/public/icons/ywoom3d --turret --glb --webp`.
- Не растягивайте иконку анизотропно. Масштаб уже 70–75% кадра, края скруглены (фаска 0.035).
- Alt-тексты — в `manifest.json`. Один смысл — одна иконка, не дробите.
- При добавлении новой иконки — добавьте билдер в `page.html: builders.xxx`, сохраните камеру/свет/материал/масштаб.

## Пересборка
```bash
node tools/icons-3d/render.mjs --out apps/web/public/icons/ywoom3d --turret --glb --webp
node tools/icons-3d/make-sheets.mjs   # листы Light/Dark + турель
```

## Проверка объёма
Турель: `turret/*.png` — три кадра `yaw -30°`, `0°`, `yaw +30°/pitch +15°` силуэт меняется (см. `apps/web/public/icon-preview/sheet-light-dark.png`). GLB грузится повторно и рендерится идентично.
