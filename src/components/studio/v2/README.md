# Studio — interfaz

Wallpaper dentro de un marco de móvil, tablet o monitor, un dock de cristal con todos los controles y la tira de guardados debajo. Detalle y reglas en `CLAUDE.md`.

| Componente | Responsabilidad |
|---|---|
| `StudioShell.tsx` | Layout, estado de "Adjust", entrada con scroll. Space/R solo con el Studio en pantalla. |
| `StudioTopBar.tsx` | Nombre de la paleta (serif) + estilo, y el selector de dispositivo. |
| `DeviceStage.tsx` | Marco, pantalla de bloqueo / barra de menú, reveal circular, drop de foto. |
| `StageHalo.tsx` | Resplandor con los colores de la paleta detrás del dispositivo. |
| `StudioDock.tsx` | Shuffle, estilo, paletas, guardar, Adjust, Download, toast. |
| `AdjustPanel.tsx` | Sliders del motor + Reset, Remix y el popover Colors (HarmonicWheel). |
| `SaveButton.tsx`, `ExportButton.tsx`, `PaletteSwatches.tsx` | Piezas del dock. |
| `FavoritesStrip.tsx`, `FavoriteThumbnail.tsx` | Guardados persistentes (drag para ordenar). |
| `reveal.ts` | `useRequestReveal`: un botón indica de dónde nace el reveal del siguiente cuadro. |

El dibujo y la exportación pasan por `../engine` (`WallpaperEngine`); nada aquí importa `lib/gradient` ni `lib/download`.
