# Studio — interfaz

Wallpaper dentro de un marco de móvil, tablet o monitor, un panel lateral (inspector) con todos los controles y la tira de guardados debajo. En un marco estrecho (≤760 px) el panel va bajo el wallpaper y agrupa los controles en pestañas Style / Colors / Adjust. Detalle y reglas en `CLAUDE.md`.

| Componente | Responsabilidad |
|---|---|
| `StudioShell.tsx` | Layout en rejilla (top, stage, panel, saved), entrada con scroll. Space/R solo con el Studio en pantalla. |
| `StudioTopBar.tsx` | Nombre de la paleta (Jost, minúsculas) + estilo, y el selector de dispositivo. |
| `DeviceStage.tsx` | Marco (iPhone con botones laterales, barra de estado, linterna y cámara), pantalla de bloqueo / barra de menú, reveal circular, drop de foto. |
| `ScreenMotion.tsx` | El mismo wallpaper moviéndose despacio en la pantalla del dispositivo (shader animado, t = 0 idéntico al fijo). Se esconde mientras pasa el reveal de un wallpaper nuevo. |
| `StudioInspector.tsx` | ‹ Shuffle › arriba; estilo (Mesh / Aurora / Liquid), paletas, colores y sliders en el medio (solo el medio hace scroll); guardar + Download abajo; toast. ‹ › recorren `useLookHistoryStore`. |
| `PaletteList.tsx` | Las 10 paletas por nombre, con su tira de colores. |
| `ColorEditor.tsx` | Los 4 colores como selectores de color propios + hex (clic = copiar). Una tanda de cambios graba un paso en el historial y ofrece "Back to <paleta>". |
| `AdjustPanel.tsx` | Sliders del motor + Reset y Remix. |
| `SaveButton.tsx`, `ExportButton.tsx` (tamaño y formato en el botón), `PaletteSwatches.tsx` | Piezas del panel. |
| `FavoritesStrip.tsx`, `FavoriteThumbnail.tsx` | Guardados persistentes (drag para ordenar). |
| `reveal.ts` | `useRequestReveal`: un botón indica de dónde nace el reveal del siguiente cuadro. |

El dibujo y la exportación pasan por `../engine` (`WallpaperEngine`); nada aquí importa `lib/gradient` ni `lib/download`.
