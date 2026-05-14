# El Studio favorece exploración sobre configuración

El **Studio** optimiza para que el usuario llegue rápido y fácilmente a un wallpaper que le encante. La interacción central es **descubrir**, no **afinar**: la mejor UX baja barreras a *"encontrar el wallpaper bueno"* en vez de *"dialar el wallpaper bueno"*.

Esta dirección está anclada en investigación previa (sesión interna 2026-04, fuentes [LSE Psychological & Behavioural Science](https://blogs.lse.ac.uk/psychologylse/2024/06/03/swipe-right-for-love-how-your-brains-reward-system-powers-online-dating/) y [Headspace "Modern Love Addiction"](https://www.headspace.com/articles/modern-love-addiction)) sobre los loops dopaminérgicos del swipe culture. Tres hallazgos guían el diseño:

1. **Anticipación > reveal** — la dopamina sube más *esperando* la recompensa que recibiéndola. El cross-fade entre wallpapers, donde la siguiente paleta se insinúa, es donde vive el placer.
2. **Gesto motor adictivo** — la acción de "Surprise me / shuffle" debe sentirse físicamente bien (espacio en desktop, swipe-up en mobile, feedback haptic-visual).
3. **Refuerzo intermitente** — variedad del output mantiene el reward processing activo y aviva el deseo de seguir explorando.

## Implementado (PR #19–#21, abril–mayo 2026)

- **Surprise me** como tile destacado encima de la deck de Palettes (randomiza solo colores).
- **Reshuffle** en BottomBar (nuevo seed, colores conservados).
- Shortcuts: Espacio → Surprise me, R → Reshuffle, doble-click sobre el preview → reshuffle, Alt+wheel/drag sobre el canvas esculpe blur/light/density.
- Drop de imagen sobre el preview extrae paleta vía k-means en Web Worker.
- Palettes con thumbnails live del estilo actual.
- Right-rail abierto por defecto (descubribilidad > limpieza visual).

## Drops deliberados (alternativas consideradas y rechazadas)

- **Slider de Brightness** — solapaba con Vibrance, añadía ruido sin valor distinto.
- **Estilo Blobs** — Mesh/Liquid/Aurora/Nebula cubren el espacio expresivo.
- **Mockup de iPhone en el Studio** — desplazado a `PackPage` donde sí ayuda a vender. En el Studio compite con la propia exploración.
- **Acordeón single-open** (PR #14) — revertido a "todo visible" en PR #19. Progressive disclosure mata descubribilidad.
- **Closer section en home** — CTA redundante, doble cierre antes del footer.

## Pendiente (visión de la investigación, no implementado)

- `ShuffleButton` grande como CTA primaria con binding a espacio (desktop) y swipe-up (mobile).
- Cross-fade ~700ms entre wallpapers (con `prefers-reduced-motion` → corte instantáneo).
- `WowToolbar` que aparece tras heurística save/dwell con cuatro acciones: save, download, adjust, share.
- `CommandBar` (⌘K) que archive los controles avanzados (device, paleta manual, sliders, history, seed exacto).
- Auto-shuffle al primer load para mostrar el engine en movimiento.
- `DownloadLimitToast`: nudge suave al 4º render del día → "ve a packs" (heredado de la PRD comercial).

## Consecuencias

- El Studio es producto en evolución, con **roadmap propio**, distinto del de la tienda de Packs. No comparten PRD; el comercial los trata como dos productos paralelos.
- Reintroducir perillas (más sliders, modos manuales en la superficie principal) debe pasar por una revisión explícita: van *dentro* del `CommandBar` o del `AdjustPanel`, no en el right-rail.
