# PLANNING — Rediseño del Studio (GradientWall)

> Documento vivo. Refleja la arquitectura actual del rediseño v2. Si cambia el enfoque, **se actualiza aquí** (no se reescriben commits ni planes anteriores). El plan completo y aprobado está en `/Users/alexolive/.claude/plans/vamos-a-afrontar-el-polymorphic-fiddle.md`.

## Estado actual

| Fase | Estado | Notas |
|---|---|---|
| 0 — Fundamentos | ✅ cerrada | Branch, docs raíz, Biome configurado, tokens `glass-modern`, `npm run check` verde. 7 commits. |
| 1 — Motor mejorado | ✅ cerrada | `surprise.ts`, `remix.ts`, `curated-seeds.ts`, `palette-constraints.ts`. 44 tests nuevos. 337/337 verde. Snapshots motor intactos. 6 commits. Visual review de seeds diferida. |
| 2 — Surprise-first shell | ✅ cerrada | `StudioShell`, `SurpriseCTA`, `ActionRow`, `DevicePicker` en `studio/v2/`. Feature flag `?v2=1` activo. Save/Customize disabled (Fase 3/4). 8 tests nuevos. 345/345 verde. Verificado visualmente: Space/R/Remix funcionan, canvas re-pinta, cero errores. 4 commits. |
| 3 — Customize Popover | ✅ cerrada | `CustomizePopover` + `StyleThumbnail` mini-canvas (5 bloques: Style/Colors/Light/Density/Softness). Glass-modern. 4 tests nuevos. 349/349 verde. Verificado: click cambia style real, slider Density funciona, contrast/vibrance/grain ausentes. 4 commits. Refactor a inline panel (animación layout) en commit aparte. |
| 4 — Favorites Strip | ✅ cerrada | `useFavoritesStore` persistido + migración legacy + `FavoritesStrip` con motion Reorder + `FavoriteThumbnail`. Save button cableado con heart spring. 16 tests nuevos. 367/367 verde. Verificado: pin → thumbnail aparece, click thumbnail carga config, reload persiste. 4 commits. |
| 5 — Polish + mobile + cutover | ✅ cerrada | Glass refinement + OKLCH tokens, BorderBeam conic, heart-burst particles, kinetic typography hero, scroll-driven reveals nativos CSS, mobile responsive stacked, cutover de v1 (eliminadas 7 componentes + tests + useHistoryStore). Bundle delta main +60K (esperado por v2 más rica). 330/330 verde. 6 commits. |
| 5b — Rediseño CustomizePanel | ✅ cerrada | Reemplazo de Swatches+ColorHUD por `HarmonicWheel` circular (4 bullets armónicos + anillo de luz absorbiendo `lightAngle`). `PaletteCards` con hover-expand sustituyen la chip list. Style picker eliminado (style hardcoded a "liquid"). Density slider eliminado (no producía cambio en Canvas2D). Grain expuesto como slider. 33 tests nuevos. 362/362 verde. Snapshots motor intactos. Dead code post-rediseño limpiado en commit `6ad28c0` (-910 LOC, -31 tests, CSS -5 KB). |
| 6 — Lint debt cleanup | 🚧 en curso | Resolver violations heredadas (warns en Fase 0). Inventario inicial en `TASKS.md`. Muchas violations vivían en componentes eliminados — re-inventariar antes de atacar. |

Branch base: `studio/redesign-v2` desde `studio/mordible-pass` (no desde `main`, porque mordible-pass tiene los últimos refactors del Studio v1 que sirven de baseline visual).

---

## Decisiones cerradas con el usuario

1. **Alcance**: solo Studio interactivo.
2. **Modelo de interacción**: surprise-first + remix + galería persistente de favoritos.
3. **Controles**: híbrido smart eliminando los más técnicos (fuera contrast, vibrance, grain editable, seed visible).
4. **Visual**: fusión liquid glass + brutalist.
5. **Engagement**: tira persistente de favoritos.
6. **Motor**: revisable para mejores defaults — primitivas matemáticas (`mulberry32`, `buildGradientSpec`) intocables, capa de generación encima sí mejora.
7. **Docs**: raíz del repo (no `docs/`, no `.claude/`).

---

## Arquitectura objetivo

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   ╔════════════════════════════════════════════════════╗           │
│   ║              CANVAS PREVIEW (intocable)            ║           │
│   ╚════════════════════════════════════════════════════╝           │
│                                                                    │
│              ╭────────────────────────────╮                        │
│              │  ✨  Surprise me   (Space) │  ← CTA hero magnética  │
│              ╰────────────────────────────╯                        │
│                                                                    │
│      [♥ Save]   [↻ Remix]   [⬇ Download · 📱iPhone]   [Customize]  │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  ❤ FAVORITES  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  →          │
└────────────────────────────────────────────────────────────────────┘
```

Detalle completo en `~/.claude/plans/vamos-a-afrontar-el-polymorphic-fiddle.md` (secciones B, E, I).

---

## Stack y librerías

- React 18.3.1, Vite 5, Tailwind v4 (CSS-first, sin `tailwind.config.js`).
- Zustand 4.5 + `persist` middleware.
- Radix UI (Popover, Dialog, Slider, DropdownMenu, Tabs, Accordion ya integrados).
- `motion` v12 (Framer Motion rebrand).
- Lucide React 0.460 — a explotar más.
- Magic UI snippets (ShimmerButton ya copiado, ampliar con BorderBeam y AnimatedShinyText en Fase 2).
- **Única dep nueva**: `@biomejs/biome` (dev) — linter + formatter.
- Cero deps runtime nuevas.

---

## Mejoras del motor (Fase 1)

Sin tocar `spec.ts`, `canvas2d.ts`, `compose.ts`, `mulberry32` ni `palettes.ts:activeColors`:

| Archivo nuevo | Responsabilidad |
|---|---|
| `src/lib/gradient/curated-seeds.ts` | Lista de 60–80 seeds que han producido buenos outputs. `pickCuratedSeed(rng?)`. |
| `src/lib/gradient/palette-constraints.ts` | `randomHarmonicColors(rng): Colors4` con HSL constreñido (sat 55–92%, light 42–78%, dist hue ≥ 25°). |
| `src/lib/gradient/surprise.ts` | `generateSurprise(prevSeed?): GradientConfig` que combina los anteriores + style weighted + lightAngle/density curados. |
| `src/lib/gradient/remix.ts` | `generateRemix(current): GradientConfig` mantiene paleta y style, varía seed + light + density en rango cercano. |

`useConfigStore` añade `applySurprise()` y `applyRemix()` como métodos atómicos. `randomize()` se mantiene como `@deprecated` por retrocompat de tests.

---

## Controles que sobreviven, mueren o cambian

**Sobreviven** (migran de contenedor):
- `useColorEditing`, `ImageSource`, `UseMyPhotoButton`.

**Eliminados Fase 5 (cutover de v1)**:
- `RightRail.tsx`, `BottomBar.tsx`, `SurpriseMeHero.tsx` actual, `HistoryDrawer.tsx`, `StudioHints.tsx`, `SeedBadge.tsx`.

**Eliminados en el rediseño del CustomizePanel (commit `3dda9c5` + cleanup `6ad28c0`)**:
- `Swatches.tsx` + `ColorHUD.tsx` → reemplazados por `HarmonicWheel` (un wheel circular con 4 bullets armónicamente sincronizados).
- `Palettes.tsx` chip list → reemplazado por `PaletteCards` (4 paletas featured con hover-expand).
- `LightDial.tsx` standalone → absorbido por el anillo perimetral exterior del `HarmonicWheel`.
- `PillTabs.tsx` → no se usaba ya en v2.
- `StyleThumbnail.tsx` → ver style picker más abajo.

**Eliminados de la UI** (valores fijados a defaults curados):
- Slider de **contrast** (default `1.0`).
- Slider de **vibrance** (default `1.05`).
- **Style picker**: style hardcoded a `"liquid"` en `generateSurprise`. El motor sigue soportando mesh/aurora/nebula para favoritos guardados antes del cambio.
- **Density slider**: no producía cambio visual en Canvas2D (solo afectaba a Nebula WebGL).
- **Seed badge** visible (el usuario ya no piensa en seeds).
- **StudioHints** one-shot (UI autoexplicativa).

**Renombrados / añadidos**:
- `Blur` → `Softness`.
- `Grain` (antes congelado a `32` en defaults curados) ahora **expuesto como slider** en el footer del CustomizePanel.

---

## Feature flag durante desarrollo

`?v2=1` en URL (o `localStorage.gw_studio_v2 === "true"`) monta `StudioShell`, sino `Studio` original. Punto de montaje pendiente de identificar al inicio de Fase 2.

---

## Métricas y verificación

Comandos canónicos:
```bash
npm run typecheck   # tsc -b --noEmit
npm run lint        # biome check src netlify
npm test            # vitest run
npm run check       # typecheck + lint + test (compuesto, Fase 0)
npm run build       # tsc -b && vite build
```

Bundle baseline tomado en Fase 0 con `du -sh dist/assets/*.js`. Objetivo en Fase 5: delta ≤ 0 KB.

---

## Plan de reversión

- Toda la implementación vive en `studio/redesign-v2`. No se mergea a `main` hasta Fase 5 completa.
- v2 coexiste con v1 detrás de feature flag durante Fases 1–4. v1 se elimina en commit explícito de Fase 5.
- Rollback granular con `git revert` por fase. **Nunca** `git reset --hard` ni rebase destructivo sobre la rama.
- Motor base (`spec.ts`, `canvas2d.ts`, `compose.ts`, `mulberry32`, `activeColors`) blindado por snapshots intocados — cualquier rollback deja el motor verde.

Detalle completo en el plan aprobado: `~/.claude/plans/vamos-a-afrontar-el-polymorphic-fiddle.md`.
