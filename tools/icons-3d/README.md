# Ywoom 3D Icons — Real 3D Pipeline (Three.js + headless Chrome)

This folder builds 15 real 3D icons as meshes rendered with Three.js + WebGL, not flat gradients.

## Style Bible

See `style-bible.json`. Summary:
- Palette: sand/lime/periwinkle/coral/cyan on dark #1E2026
- Camera: single 3/4 top angle, FOV 22°, target [0,0.15,0]
- Lights: key + fill + rim + ambient + hemisphere (soft shadows)
- Material: MeshPhysicalMaterial matte clay (roughness 0.62, no metal)
- Bevel: all edges chamfered, no thin struts <4% height
- Scale: 70-75% frame, centered by visual mass
- Ground: transparent shadow catcher, soft contact shadow

## Icons

home, pipeline, studio, plan, avatars, wardrobe, analytics, settings, balance, bell, search, director, publish, approve, folder

## How it renders (real 3D proof)

- Each icon = `THREE.Group` of real meshes (`BoxGeometry`, `CylinderGeometry`, `LatheGeometry`, `ExtrudeGeometry` with bevel)
- Single shared camera + lights + renderer; only the group swaps per icon
- Renderer: `WebGLRenderer` with `shadowMap.enabled`, PCFSoft, 2048 map
- Proof: `--turret` renders 3 angles per icon (±30° yaw, ±15° pitch) where silhouettes change; `--glb` exports via `GLTFExporter` (binary .glb) and reload is validated

## Usage

```bash
node tools/icons-3d/render.mjs --out apps/web/public/icons/ywoom3d
node tools/icons-3d/render.mjs --out apps/web/public/icons/ywoom3d --turret   # + turret sheet
node tools/icons-3d/render.mjs --out apps/web/public/icons/ywoom3d --glb      # + .glb per icon
node tools/icons-3d/render.mjs --out apps/web/public/icons/ywoom3d --turret --glb --webp
node tools/icons-3d/render.mjs --serve  # preview server for manual inspection
```

Outputs per icon:
- `1024/*.png` with soft shadow, `512/*.png` without shadow, `256/*.png`, `128/*.png`, `64/*.png`
- `webp/256/*.webp`, `webp/128/*.webp`
- `glb/*.glb` + source scene is `render.mjs` + `style-bible.json` (reproducible)
- `manifest.json`, `turret.png` (when requested), `preview.html`

Chrome path defaults to `C:\Program Files\Google\Chrome\Application\chrome.exe`, override via `CHROME_PATH`.

## Verification checklist

- [ ] silhouette changes on turret (±30° yaw shows real depth)
- [ ] .glb loads in https://gltf-viewer.donmccurdy.com/
- [ ] no CSS/SVG gradients faking volume (all shading from real lights)
- [ ] same camera/lights/scale for every icon
- [ ] readable at 32px (tested via downscale)
- [ ] rounded edges everywhere, transparent BG no fringe
