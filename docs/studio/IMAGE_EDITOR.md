# Редактор изображений: слои и точечные AI-правки

## Базовый editor loop (P2 Q-039/Q-040)
Canvas содержит base image + editable text/image/shape overlays. Transform: x/y, width/height,
rotation, opacity; z-order, align/snap, safe areas; layer lock, group, duplicate, delete.
Crop/reframe поддерживает aspect ratio и не растягивает объект. Local changes не вызывают AI API.
Undo/redo, autosave draft, immutable revisions, before/after и восстановление принятого варианта.
Текст: font family/weight/style/size, line-height/letter-spacing, alignment, color, stroke,
shadow/backplate; доступные шрифты и права, glyph coverage проверены renderer/preview.
Логотипы, badges, CTA и формы остаются отдельными слоями. Generated lettering внутри raster
помечается baked/noneditable: перенос требует удаления/восстановления фона или layered re-layout.

Export: documented PNG/JPEG profiles; прозрачность только поддерживаемыми профилями;
resolution/color handling и font output проверяются. Проект/исходники сохраняются для дальнейшей правки.
Размер и safe areas берутся из pinned platform profile; «для площадки» не означает её approval рекламы.

## Расширения P5, по capability / отдельному eval
Masks/background removal; brand kit/bulk variants; inpaint/outpaint/relight/restyle/upscale/artifact repair;
protected regions/product; format-aware re-layout с review. Не объявлять все tool actions универсальными.

## Edit region by intent
1. Select region/object/layer (brush/box/polygon как доступно); показать, что именно выбрано.
2. Комментарий + protected areas + target version.
3. Проверка прав/capability, delta estimate и подтверждение до paid submit.
4. Job создаёт новый candidate asset и document branch, не перезаписывает исходник.
5. Before/after; outside-mask drift и product/identity checks; accept/reject.
Unknown outcome → reconcile, fail сохраняет исходную версию. Regeneration недетерминирована;
«остальное сохранить» — intent/QA, не абсолютная гарантия.

## AC / edge cases
Edit→save→reload→export совпадает в пределах declared renderer tolerance; drag имеет keyboard/numeric alternative.
Missing font/source, rotated layer crop, transparency, CJK/RTL, long words, low-memory phone покрываются.
При stale version — conflict/branch, не silent last-write wins. Local undo не отменяет paid calls.
При flatten import редактор не обещает автоматическое выделение всех прежних объектов в editable layers.
