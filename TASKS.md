# TASKS — Rediseño del Studio (GradientWall)

> Checklist granular por fase. `[ ]` pendiente · `[x]` hecho · `🚧 BLOCKED: <razón>` si bloqueado. Cierra cada fase con un `npm run check` verde y `git push`.

Branch: `studio/redesign-v2` (desde `studio/mordible-pass`).
Feature flag durante dev: `?v2=1`.

---

## Fase 0 — Fundamentos

- [x] Crear rama `studio/redesign-v2` desde `studio/mordible-pass`.
- [x] Crear `PRD.md` en raíz.
- [x] Crear `PLANNING.md` en raíz.
- [x] Crear `TASKS.md` en raíz (este archivo).
- [ ] `npm i -D @biomejs/biome` y commit aparte.
- [ ] `npx @biomejs/biome init` → editar `biome.json` (indent 2, line width 100, ignorar `dist/`, `node_modules/`, `**/__snapshots__/`).
- [ ] Añadir scripts a `package.json`: `lint`, `format`, `check`.
- [ ] `npm run format` y commit `style: apply biome formatting` aislado.
- [ ] Crear carpeta `src/components/studio/v2/` vacía.
- [ ] Añadir a `src/index.css` `@theme` los tokens `--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-shadow-soft`, `--magnetic-ease`, `--strip-height`.
- [ ] Añadir utilidad `@utility glass-modern { ... }`.
- [ ] Actualizar `CLAUDE.md` con sección "Studio v2 — tooling y feature flag" (scripts, MCPs, feature flag, contrato del motor).
- [ ] `npm run check` debe pasar verde.
- [ ] Capturar bundle baseline con `npm run build` + `du -sh dist/assets/*.js` y anotar abajo:

```
Bundle baseline (Fase 0):
(pendiente medir)
```

**Commits objetivo**:
1. `docs: add PRD, PLANNING, TASKS for studio redesign`
2. `chore: add biome linter with project-specific config`
3. `style: apply biome formatting to existing src and netlify`
4. `chore(studio): scaffold v2 folder`
5. `feat(tokens): add modern liquid glass tokens to @theme`
6. `docs(claude): document v2 tooling, MCPs and feature flag`

---

## Fase 1 — Motor mejorado

- [ ] `src/lib/gradient/curated-seeds.ts`: lista inicial 60–80 seeds. `pickCuratedSeed(rng?)`.
- [ ] Revisión visual de los seeds (renderizar grid, eliminar los flojos).
- [ ] `src/lib/gradient/palette-constraints.ts`: `randomHarmonicColors(rng): Colors4`. Tests con 1000 muestras (cero paletas con sat<55 o light>78).
- [ ] `src/lib/gradient/surprise.ts`: `generateSurprise(prevSeed?)`. Style weighted (liquid 35 / mesh 30 / aurora 25 / nebula 10).
- [ ] `src/lib/gradient/remix.ts`: `generateRemix(current)`.
- [ ] `useConfigStore`: añadir `applySurprise()`. Marcar `randomize()` como `@deprecated`.
- [ ] Tests de surprise, remix y palette constraints.
- [ ] Verificar snapshots del motor (gradient/canvas2d/compose/palettes) intactos.
- [ ] `npm run check` verde.

**Commits objetivo**:
1. `feat(gradient): add curated-seeds list and pickCuratedSeed`
2. `feat(gradient): add randomHarmonicColors with HSL constraints`
3. `feat(gradient): add generateSurprise composing curated config`
4. `feat(gradient): add generateRemix for nearby variations`
5. `feat(config-store): add applySurprise using new generator`
6. `test(gradient): cover surprise, remix, and palette constraints`

---

## Fase 2 — Surprise-first shell

- [ ] `src/components/studio/v2/SurpriseCTA.tsx`: magnetic hover + BorderBeam fresh-state + AnimatedShinyText + Space bind.
- [ ] `src/components/studio/v2/ActionRow.tsx`: Save / Remix / Download (con DevicePicker) / Customize.
- [ ] `src/components/studio/v2/DevicePicker.tsx`: DropdownMenu Radix con iPhone/iPad/Desktop.
- [ ] `src/components/studio/v2/StudioShell.tsx`: orquestador layout, importa `<Preview>` tal cual.
- [ ] Feature flag `?v2=1` en punto de montaje del Studio.
- [ ] `useConfigStore`: añadir `applyRemix()`.
- [ ] Verificar manualmente Space + drag-drop imagen + gestos Alt siguen funcionando.
- [ ] Tests `applyRemix` + snapshot `StudioShell`.
- [ ] `npm run check` verde.

**Commits objetivo**:
1. `feat(studio-v2): add SurpriseCTA with magnetic hover and BorderBeam`
2. `feat(studio-v2): add ActionRow with Save Remix Download Customize`
3. `feat(studio-v2): add StudioShell orchestrator with feature flag`
4. `feat(config-store): add applyRemix using generateRemix`
5. `test(studio-v2): snapshot shell and verify remix store contract`

---

## Fase 3 — Customize Popover

- [ ] `src/components/studio/v2/CustomizePopover.tsx`: Radix Popover con `glass-modern`.
- [ ] Style picker (4 thumbnails grandes con `useFittedGradientCanvas`).
- [ ] Reusar `<Swatches>` + `<ColorHUD>` + `<UseMyPhotoButton>` + `<LightDial>`.
- [ ] Sliders Radix renombrados "Density" y "Softness".
- [ ] NO incluir contrast, vibrance, grain, seed badge.
- [ ] En `useConfigStore` fijar grain/contrast/vibrance a defaults curados.
- [ ] Tests snapshot del Popover.
- [ ] `npm run check` verde.

**Commits objetivo**:
1. `feat(studio-v2): add CustomizePopover with style thumbnails`
2. `feat(studio-v2): wire Swatches LightDial sliders inside Customize`
3. `feat(config-store): freeze grain/contrast/vibrance to curated defaults`
4. `test(studio-v2): snapshot CustomizePopover variants`

---

## Fase 4 — Favorites Strip persistente

- [ ] `src/store/useFavoritesStore.ts`: zustand + `persist` v1, API `pin/unpin/reorder/clear`, cap 24, migration desde `gw_history`.
- [ ] `src/components/studio/v2/FavoritesStrip.tsx`: tira horizontal `motion.Reorder`, thumbnails 64×112, click carga.
- [ ] Wire Save button → `pin(currentConfig)` con heart spring.
- [ ] Tests store (pin/unpin/reorder/cap/migration) + strip (render N items, click loads).
- [ ] `npm run check` verde.

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
