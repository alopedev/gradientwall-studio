# Studio v2 — surprise-first shell

Componentes del rediseño del Studio. Vive en paralelo a `src/components/studio/` (v1) detrás de feature flag `?v2=1` durante Fases 1–4. En Fase 5 (cutover) v1 se elimina y estos componentes se convierten en el Studio único.

Contrato esperado (al cerrar el rediseño):

| Componente | Responsabilidad |
|---|---|
| `StudioShell.tsx` | Orquestador layout. Monta `<Preview>` tal cual (de v1) sin tocar gestos. |
| `SurpriseCTA.tsx` | CTA hero magnética + BorderBeam fresh-state. Bind global Space. |
| `ActionRow.tsx` | Save · Remix · Download (con DevicePicker integrado) · Customize. |
| `DevicePicker.tsx` | DropdownMenu Radix con iPhone / iPad / Desktop. |
| `CustomizePopover.tsx` | Bandeja con Style picker (thumbnails) + Swatches + LightDial + Density + Softness. |
| `FavoritesStrip.tsx` | Tira persistente abajo, `motion.Reorder`, thumbnails 64×112. |

Plan completo en `~/.claude/plans/vamos-a-afrontar-el-polymorphic-fiddle.md`.
Decisiones vivas en `/PLANNING.md` y `/TASKS.md`.
