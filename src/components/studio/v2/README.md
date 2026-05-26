# Studio v2 — surprise-first shell

Componentes del Studio activo. Tras el cutover de Fase 5 (commit `604b7f2`) v1 se eliminó y estos son el Studio único.

| Componente | Responsabilidad |
|---|---|
| `StudioShell.tsx` | Orquestador layout. Maneja `customizeOpen` y monta `<Preview>` (de `studio/`) tal cual sin tocar gestos. |
| `SurpriseCTA.tsx` | `ShimmerButton` magnético (shimmer-slide + spin-around conic incorporados). Bind global `Space`. |
| `ActionRow.tsx` | Save · Remix · Download (con `DevicePicker` integrado) · Customize. Bind global `R` para Remix. |
| `DevicePicker.tsx` | Popover Radix con iPhone / iPad / Desktop + labels de resolución. |
| `CustomizePanel.tsx` | Panel inline lateral (420 px desktop, stacked en mobile). Contiene `HarmonicWheel` + `PaletteCards` + sliders Softness y Grain. |
| `FavoritesStrip.tsx` + `FavoriteThumbnail.tsx` | Tira persistente abajo, `motion.Reorder`, thumbnails 64×112, scroll-snap en mobile. |

Hojas que viven en `studio/` (no en `v2/`) y consume el panel:

| Componente | Responsabilidad |
|---|---|
| `HarmonicWheel.tsx` | Arc-like color picker circular con 4 bullets sincronizados + anillo de luz exterior. Edita los 4 slots a la vez vía `computeHarmonicColors`. |
| `PaletteCards.tsx` | 4 paletas featured (Dusk / Tokyo / Forest / Mocha) con hover-expand reveal hex. |
| `UseMyPhotoButton.tsx` | Popover con `ImageSource` para extraer paleta de una foto subida. |
| `Preview.tsx` | Canvas + gestos (Alt+scroll, drag-drop). |
| `useColorEditing.ts` | Hook compartido (eyedropper) usado por `HarmonicWheel`. |

Documentos de proceso:
- `/PRD.md` — tesis del rediseño.
- `/PLANNING.md` — estado vivo por fase.
- `/TASKS.md` — checklist granular + Fase 6 (lint debt).
