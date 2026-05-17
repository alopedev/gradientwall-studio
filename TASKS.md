# TASKS — Rediseño del Studio (GradientWall)

> Checklist granular por fase. `[ ]` pendiente · `[x]` hecho · `🚧 BLOCKED: <razón>` si bloqueado. Cierra cada fase con un `npm run check` verde y `git push`.

Branch: `studio/redesign-v2` (desde `studio/mordible-pass`).
Feature flag durante dev: `?v2=1`.

---

## Fase 0 — Fundamentos ✅

- [x] Crear rama `studio/redesign-v2` desde `studio/mordible-pass`.
- [x] Crear `PRD.md` en raíz.
- [x] Crear `PLANNING.md` en raíz.
- [x] Crear `TASKS.md` en raíz (este archivo).
- [x] `npm i -D @biomejs/biome` y commit aparte.
- [x] `npx biome init` → editar `biome.json` (indent 2, line width 100, ignorar `dist/`, `node_modules/`, `**/__snapshots__/`, `**/*.css`).
- [x] Añadir scripts a `package.json`: `lint`, `format`, `check`.
- [x] `npm run format` y commit `style: apply biome formatting` aislado (59 archivos).
- [x] Crear carpeta `src/components/studio/v2/` con README de contrato.
- [x] Añadir a `src/index.css` `@theme` los tokens `--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-shadow-soft`, `--magnetic-ease`, `--strip-height`.
- [x] Añadir utilidad `@utility glass-modern { ... }`.
- [x] Actualizar `CLAUDE.md` con sección "Studio v2 — tooling y feature flag" (scripts, MCPs, feature flag, contrato del motor).
- [x] Relajar reglas de Biome para violations preexistentes (no se arregla deuda fuera del scope; código nuevo v2 sí respeta las reglas estrictas).
- [x] `npm run check` debe pasar verde — verificado, exit 0, 293/293 tests.
- [x] Capturar bundle baseline con `npm run build` + `du -sh dist/assets/*.js` y anotar abajo:

```
Bundle baseline (Fase 0 — commit 916e291, 2026-05-17):
  index-D5dNYX2w.css                 68 KB   (12.21 KB gzip)
  react-Ce0fzBPp.js                 112 KB   (38.28 KB gzip)
  index-BXwG5ZCJ.js                 472 KB  (156.67 KB gzip)
  color-extract.worker-ConO1II4.js    4 KB
  total dist/ (incluye video 42 MB):  50 MB

Objetivo Fase 5: delta ≤ 0 KB en main bundle (esperado reducir al eliminar v1).
```

**Commits objetivo**:
1. `docs: add PRD, PLANNING, TASKS for studio redesign`
2. `chore: add biome linter with project-specific config`
3. `style: apply biome formatting to existing src and netlify`
4. `chore(studio): scaffold v2 folder`
5. `feat(tokens): add modern liquid glass tokens to @theme`
6. `docs(claude): document v2 tooling, MCPs and feature flag`

---

## Fase 1 — Motor mejorado ✅

- [x] `src/lib/gradient/curated-seeds.ts`: lista inicial 80 seeds distribuidos con offset prime. `pickCuratedSeed(rng?)` + `pickCuratedSeedExcluding(prev, rng?)`.
- [ ] Revisión visual de los seeds (renderizar grid, eliminar los flojos) — **diferida a sesión manual post Fase 2**, requiere ojo humano + dev server.
- [x] `src/lib/gradient/palette-constraints.ts`: `randomHarmonicColors(rng): Colors4` con 4 esquemas (analogous / complementary / triadic / split-comp). Tests con 1000 muestras: cero violations sat [55,92] o light [42,78].
- [x] `src/lib/gradient/surprise.ts`: `generateSurprise(prevSeed?)`. Style weighted (liquid 35 / mesh 30 / aurora 25 / nebula 10). Defaults curados: grain=32, contrast=1, vibrance=1.05.
- [x] `src/lib/gradient/remix.ts`: `generateRemix(current)` — paleta y style intactos, jitter ±30° light / ±0.1 density / ±10 blur.
- [x] `useConfigStore`: añadir `applySurprise()` y `applyRemix()`. `randomize()` marcado `@deprecated` con nota de cutover en Fase 5.
- [x] Tests: 44 nuevos (curated-seeds, palette-constraints, surprise, remix), todos deterministas vía PRNG inyectable.
- [x] Verificado: snapshots del motor (`gradient/__snapshots__/spec.test.ts.snap`) cero diff.
- [x] `npm run check` verde — 337/337 tests pasan.

**Commits objetivo**:
1. `feat(gradient): add curated-seeds list and pickCuratedSeed`
2. `feat(gradient): add randomHarmonicColors with HSL constraints`
3. `feat(gradient): add generateSurprise composing curated config`
4. `feat(gradient): add generateRemix for nearby variations`
5. `feat(config-store): add applySurprise using new generator`
6. `test(gradient): cover surprise, remix, and palette constraints`

---

## Fase 2 — Surprise-first shell ✅

- [x] `src/components/studio/v2/SurpriseCTA.tsx`: magnetic hover + fresh-state ring pulsante (motion, sin BorderBeam dep) + Sparkles icon (Lucide) + Space bind.
- [x] `src/components/studio/v2/ActionRow.tsx`: Save (disabled, Fase 4) / Remix (R bind) / Download (con DevicePicker) / Customize (disabled, Fase 3).
- [x] `src/components/studio/v2/DevicePicker.tsx`: usando Popover Radix por consistencia con el resto del Studio. iPhone / iPad / Desktop con etiquetas de resolución.
- [x] `src/components/studio/v2/StudioShell.tsx`: orquestador layout, importa `<Preview>` v1 tal cual. Nueva voz: "One tap. Done.".
- [x] Feature flag `?v2=1` o `localStorage.gw_studio_v2 === "true"` en `HomePage` (`App.tsx`).
- [x] `useConfigStore.applyRemix()` añadido (cableado en Fase 1, expuesto desde ActionRow).
- [x] Verificado visualmente: Space, R, click CTA, click Remix, DevicePicker, drag-drop imagen — todo funcional. Canvas re-pinta tras surprise/remix. Cero errores en consola.
- [x] Tests: 6 nuevos store (applySurprise / applyRemix contract) + 2 nuevos shell (mount + canvas) = 8 nuevos. Total 345/345.
- [x] `npm run check` verde — exit 0.

**Commits objetivo**:
1. `feat(studio-v2): add SurpriseCTA with magnetic hover and BorderBeam`
2. `feat(studio-v2): add ActionRow with Save Remix Download Customize`
3. `feat(studio-v2): add StudioShell orchestrator with feature flag`
4. `feat(config-store): add applyRemix using generateRemix`
5. `test(studio-v2): snapshot shell and verify remix store contract`

---

## Fase 3 — Customize Popover ✅

- [x] `src/components/studio/v2/CustomizePopover.tsx`: Radix Popover con `glass-modern`. Cinco bloques verticales.
- [x] Style picker: `StyleThumbnail` (96×64) usando `useGradientCanvas` con paleta actual; click setea style.
- [x] Reusa `<Swatches>` (con ColorHUD), `<UseMyPhotoButton>`, `<LightDial>` v1 sin tocar.
- [x] Sliders Radix renombrados "Density" (0..1) y "Softness" (10..120, antes "Blur").
- [x] NO incluye contrast, vibrance, grain, seed badge — superficie minimizada del editor.
- [x] grain/contrast/vibrance se congelan en defaults curados vía `applySurprise()` (ya en Fase 1).
- [x] Tests: 4 nuevos (open/close, controls present, controls absent, style switch). Total 349/349.
- [x] Verificado visualmente: popover abre, thumbnails muestran mini-canvases, click cambia style real (mesh→aurora confirmado en store), Density slider funciona (0.50→0.51), Escape cierra.
- [x] `npm run check` verde — exit 0.

**Commits objetivo**:
1. `feat(studio-v2): add CustomizePopover with style thumbnails`
2. `feat(studio-v2): wire Swatches LightDial sliders inside Customize`
3. `feat(config-store): freeze grain/contrast/vibrance to curated defaults`
4. `test(studio-v2): snapshot CustomizePopover variants`

---

## Fase 4 — Favorites Strip persistente ✅

- [x] `src/store/useFavoritesStore.ts`: zustand + `persist` v1, API `pin/unpin/reorder/clear`, cap 24 FIFO, `migrateLegacyHistory()` defensiva desde `gw_history`. Key `gw:favorites:v1`.
- [x] `src/components/studio/v2/FavoritesStrip.tsx` + `FavoriteThumbnail.tsx`: tira horizontal con motion `Reorder.Group axis="x"`, thumbnails 64×112 con `useGradientCanvas`, click carga config en `useConfigStore`, X hover unpin, empty state suave.
- [x] Wire Save button → `pin(currentConfig)` con motion spring (key change → remount heart, fill=currentColor tras primer save).
- [x] Tests: 12 store + 4 strip = 16 nuevos.
- [x] Verificado visualmente: 3 pin consecutivos producen 3 thumbnails, click carga seed (8327 → distinto), reload persiste los 3 items.
- [x] `npm run check` verde — 367/367 tests.

**Commits objetivo**:
1. `feat(favorites-store): add useFavoritesStore with versioned persist and history migration`
2. `feat(studio-v2): add FavoritesStrip with motion Reorder`
3. `feat(studio-v2): wire Save button to favorites with heart spring animation`
4. `test(favorites): cover pin/unpin/reorder/cap and migration from history`

---

## Fase 5 — Polish liquid glass + mobile + cutover

- [ ] Aplicar `glass-modern` en Customize, Favorites, DevicePicker.
- [ ] Magnetic hover con `useMotionValue` + `useSpring`.
- [ ] BorderBeam solo en estado fresh, desktop.
- [ ] Save heart fill + scale spring + particle.
- [ ] Remix rotate 360°.
- [ ] Mobile <640px: canvas full-screen + safe-area, CTA fija, ActionRow → bottom-sheet trigger, Favorites snap-scroll.
- [ ] A11y pass: tab order, Escape, `prefers-reduced-motion` desactiva delight, focus rings visibles.
- [ ] Quitar feature flag.
- [ ] Eliminar v1: `Studio.tsx`, `RightRail.tsx`, `BottomBar.tsx`, `SurpriseMeHero.tsx`, `StudioHints.tsx`, `HistoryDrawer.tsx`, `SeedBadge.tsx`.
- [ ] Bundle delta: `du -sh dist/assets/*.js` y comparar con baseline (objetivo ≤ 0 KB).
- [ ] Actualizar `CLAUDE.md` y `CONTEXT.md` con la nueva arquitectura.
- [ ] Lighthouse a11y ≥ 95 en `/`.
- [ ] Marcar `PLANNING.md` con "✅ Cerrado el <fecha>".

**Commits objetivo**:
1. `feat(studio-v2): polish liquid glass on Customize Favorites DevicePicker`
2. `feat(studio-v2): magnetic CTA fresh-state BorderBeam and Save heart spring`
3. `feat(studio-v2): mobile bottom-sheet ActionRow and snap-scroll Favorites`
4. `feat(studio-v2): a11y pass with reduced-motion and focus rings`
5. `refactor(studio): remove v1 Studio RightRail BottomBar SeedBadge HistoryDrawer StudioHints SurpriseMeHero`
6. `docs: update CLAUDE.md and CONTEXT.md with v2 architecture`
7. `chore: close TASKS.md and mark PLANNING.md complete`

---

## Fase 6 — Lint debt cleanup (post-cutover)

> Trabajo de deuda técnica heredada de antes de añadir Biome. Durante Fase 0 estas reglas se relajaron a `warn` para que el baseline arrancase verde, **pero deben resolverse**. La razón para diferirlo: el código nuevo de v2 ya las respeta y muchas violations viven en componentes v1 que se eliminan en Fase 5 — así reducimos antes el trabajo.

**Cuándo**: tras el cutover de Fase 5 (cuando v1 esté borrada). Algunas violations habrán desaparecido solas; el resto se arregla en commits granulares por regla.

**Inventario completo** (Fase 0, commit `916e291`, 62 violations en 66 ubicaciones):

| Regla | Violations | Estrategia | FIXABLE auto |
|---|---|---|---|
| `lint/style/useTemplate` | 14 | Reemplazar concatenación por template literals | Sí (`biome check --write`) |
| `lint/complexity/noForEach` | 11 | Convertir `forEach` a `for...of` | Manual (afecta semántica de control flow) |
| `lint/suspicious/useIterableCallbackReturn` | 8 | Asegurar return explícito en callbacks de map/filter | Manual |
| `lint/suspicious/noArrayIndexKey` | 7 | Cambiar `key={i}` por id estable | Manual (requiere id real) |
| `lint/correctness/useExhaustiveDependencies` | 6 | Añadir deps faltantes a useEffect/useMemo | Manual (riesgo de bucles) |
| `lint/complexity/useIndexOf` | 5 | Reemplazar `findIndex(x => x === y)` por `indexOf(y)` | Sí |
| `lint/style/noParameterAssign` | 3 | Crear variable local antes de mutar parámetro | Manual |
| `lint/suspicious/noAssignInExpressions` | 2 | Separar assignment de expression | Manual |
| `lint/complexity/noUselessSwitchCase` | 2 | Eliminar case redundante de switch | Sí |
| `lint/style/useImportType` | 1 | Añadir `import type` cuando solo es type | Sí |
| `lint/style/useExponentiationOperator` | 1 | `Math.pow(x, y)` → `x ** y` | Sí |
| `lint/complexity/useOptionalChain` | 1 | `a && a.b` → `a?.b` | Sí |
| `lint/complexity/useArrowFunction` | 1 | Function expression → arrow function | Sí |

**Plan de ataque**:
1. Re-correr inventario tras Fase 5 (muchas violations en `RightRail`, `HistoryDrawer`, `SeedBadge` se irán solas).
2. Aplicar fixes automáticos: `npx biome check src netlify --write --unsafe` (revisa el diff antes del commit).
3. Para violations no automáticas, un commit por regla — más fácil de revisar.
4. Endurecer biome.json: subir cada regla resuelta a `error`.
5. `npm run check` debe seguir verde tras cada commit.

**Commits objetivo** (depende del inventario final post-cutover):
- `fix(lint): auto-fix useTemplate, useIndexOf, useExponentiationOperator, useOptionalChain, useArrowFunction, useImportType`
- `fix(lint): manual fix noForEach in pure loops`
- `fix(lint): give stable keys to map callbacks`
- `fix(lint): complete useEffect dependency arrays`
- `fix(lint): split noAssignInExpressions and noParameterAssign`
- `fix(lint): handle useIterableCallbackReturn cases`
- `chore(biome): promote resolved rules from warn to error`
