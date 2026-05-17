# PRD — Rediseño del Studio (GradientWall)

## Resumen en una frase

El Studio debe producir wallpapers que el usuario "necesite" instalar en su móvil desde el primer click, sin que tenga que entender qué es "blur" o "vibrance".

---

## El problema actual

El Studio de hoy (`src/components/studio/`) es un panel de control técnico:
- Right Rail con acordeón Source/Style/Effects de 7+ sliders.
- BottomBar con seed visible.
- Gestos avanzados (Alt+scroll, drag) sin onboarding visible.
- Badges de resolución.

Funciona para alguien que entiende el dominio. **Intimida al usuario casual** y le hace dudar de "tocar". Resultado: bajo engagement, el usuario no se siente en confianza para jugar y abandona antes de descubrir el wallpaper que querría descargar.

---

## Tesis del rediseño

**Surprise-first + remix + galería persistente de favoritos.**

Inspiración 2026: Midjourney remix, Vercel v0 preview, Recraft one-tap aesthetics, Linear cmd-K reductionism — todos comparten un patrón: **acción principal única + bandeja oculta para potencia + galería persistente de favoritos**.

Tres clicks máximo para el flujo principal:
1. **Surprise me** → un wallpaper que el usuario quiere instalar.
2. **Download** → con device picker integrado.
3. **♥ Save** → lo recuerda en la tira de favoritos.

Todo lo demás vive en una bandeja "Customize" discreta que solo el que quiera potencia abre.

---

## Lenguaje visual

**Fusión liquid glass + brutalist.**
- Voz tipográfica brutalist se mantiene (Space Grotesk uppercase, accent bermellón, instrument-chip numérico).
- Chrome del Studio (Customize, Favorites Strip, device picker) se rehace en cristal moderno: backdrop-filter, refracción sutil, blur jerárquico, inset highlight.
- Inspiración: iOS 26 / macOS Tahoe (cristal con refracción) cruzado con Linear/Raycast (brutalist reductionism).

---

## Alcance

**Incluye**:
- Studio interactivo entero: shell (`Studio.tsx`), controles (`RightRail.tsx`, `BottomBar.tsx`), CTA (`SurpriseMeHero.tsx`), historial (`HistoryDrawer.tsx`), hints (`StudioHints.tsx`), seed badge (`SeedBadge.tsx`).
- Motor de generación: nuevas funciones aditivas para mejores defaults (`surprise.ts`, `curated-seeds.ts`, `palette-constraints.ts`, `remix.ts`). Las primitivas matemáticas (`mulberry32`, `buildGradientSpec`) se respetan.
- Linter/formatter del proyecto (cierra gap: no había uno).

**NO incluye**:
- Nav, Hero general, Marquee, Packs, Footer.
- Command palette (⌘K).
- Paneles flotantes tipo Figma, layers panel, inspector contextual.
- Migración de Radix a otra librería de primitivos.
- Cualquier feature "pro" que añada complejidad.

---

## Métricas de éxito

Cualitativas (verificables manualmente):
- En un viewport iPhone 15 nuevo, el usuario puede llegar de "primera carga" a "wallpaper descargado en su rollo" en ≤ 3 toques.
- El usuario casual no necesita preguntar "¿qué hace este slider?" porque los controles técnicos están eliminados u ocultos.
- 10 surprises consecutivos producen 10 wallpapers visualmente distintos y todos "instalables".

Cuantitativas (medibles con `npm run check` y herramientas estándar):
- `npm run typecheck`, `npm run lint`, `npm test` en verde.
- Lighthouse a11y ≥ 95 en `/?v2=1`.
- Bundle delta ≤ 0 KB (al simplificar se compensa la dep nueva).
- Snapshots del motor de gradient intactos (cero diffs).

---

## No-objetivos explícitos

- Añadir features pro (layers, command palette, inspector).
- Educar al usuario sobre qué es seed, contrast, vibrance.
- Mantener UI de v1 en paralelo a v2 después del cutover.
- Migrar de Radix a Base UI / Headless UI / cualquier otra librería de primitivos.
- Tocar el código del motor (`src/lib/gradient/spec.ts`, `canvas2d.ts`, `compose.ts`, `mulberry32`, `palettes.ts:activeColors`).

---

## Riesgos

Lista detallada en `PLANNING.md` sección F. Resumen:
- Snapshots del motor: mitigado manteniendo `randomize()` original y añadiendo `applySurprise()` como nuevo.
- Gestos Alt/Space/drag-drop: mitigado importando `<Preview>` tal cual en el nuevo shell.
- Mobile: paneles flotantes serían antipatrón, por eso usamos bottom-sheet < 640px.

---

## Plan de implementación

Detallado en `PLANNING.md` y `TASKS.md`. Fases:
- **0** — Fundamentos (docs + linter + tokens + rama).
- **1** — Motor mejorado (curated seeds + paleta armónica + surprise/remix puros).
- **2** — Surprise-first shell (canvas + CTA + action row + feature flag `?v2=1`).
- **3** — Customize Popover (controles supervivientes detrás de un click).
- **4** — Favorites Strip persistente.
- **5** — Polish liquid glass + mobile + cutover (eliminar v1).
