# GradientWall

Studio gratuito de wallpapers gradient + tienda de packs curados (4.99€, pago único, sin cuenta, entrega por email). Este glosario fija el vocabulario que comparten frontend (`src/`) y backend (`netlify/functions/`); todo lo que no esté aquí es jerga local.

## Language

### Studio

**Studio**:
Herramienta gratuita de creación de wallpapers gradient. El usuario llega, **explora**, encuentra algo que le encanta, **lo descarga**. La descarga es el resultado deseado del flujo — el Studio no es un "vibe demo" ni un escaparate de marca; es un creator tool funcional. Roadmap **independiente** del comercial (tienda de Packs); no comparte PRD.
_Avoid_: tratar al Studio como "demo" — produce un archivo que el usuario se lleva, igual que un Pack.

**Surprise me**:
Acción first-class del Studio: randomiza **solo los colores** de la paleta activa, dejando el resto del estado intacto. Distinto de **Reshuffle** (BottomBar): Reshuffle mantiene colores y rebobina el seed. Surprise me es el gesto motor central de la filosofía exploration-first (ver ADR-0003).

**Reshuffle**:
Acción del BottomBar: nuevo seed sobre la paleta y estilo actuales. Genera una variante distinta del mismo "look" sin cambiar la decisión cromática del usuario.

### Render pipeline (Studio)

**Render**:
Pintar un gradient en un canvas a partir de un `GradientSpec`. Operación pura, sin red, sin estado de negocio. El botón "Download" del Studio es realmente *Render → Encode → Save-to-disk*.
_Avoid_: "Download" (a secas) para referirse al pipeline del Studio — colisiona con la entrega del ZIP.

**RenderStyle**:
Algoritmo de pintado del gradient: `mesh` / `liquid` / `aurora` / `nebula`. En código vive como `Style` en `src/lib/palettes.ts:6`; el glosario lo refiere como **RenderStyle** para distinguirlo de **PackCategory**.
_Avoid_: "Style" sin calificador — es ambiguo (ver Flagged ambiguities).

### Tienda (catálogo y compra)

**Pack**:
Colección curada de 10 wallpapers vendida como una sola unidad a 4.99€. Identificado por `slug` estable.

**PackCategory**:
Género visual de un Pack, usado como filtro del catálogo. Valores actuales: `gradient` / `acrylic` / `fluted` / `photo`. En código aparece como el campo `style` de `Pack` y como `PackStyle` (`src/lib/packs/types.ts:4`); el glosario lo refiere como **PackCategory** para no chocar con **RenderStyle**. La etiqueta `gradient` es **transitoria**: hoy todos los packs son gradients, así que la categoría solo cobra utilidad cuando entren packs con assets externos (acrylic/fluted/photo). Revisar el set de valores en ese momento.
_Avoid_: "Style" sin calificador.

**PackCover**:
Imagen representativa de un pack o de uno de sus 10 wallpapers. Discriminated union `{ kind: "gradient" | "image" }` para soportar migración pack-a-pack del catálogo (gradient = pintado en cliente; image = URL de R2).

**Order**:
Registro persistido en Netlify Blobs tras un `order_created` de Lemon Squeezy. Shape: `{ orderId, lsOrderId, packSlug, email, downloadsRemaining, expiresAt, createdAt }`.
- **`orderId`** = UUID nuestro, clave primaria del store. Es el ID que el JWT lleva en su payload. Opaco para el comprador.
- **`lsOrderId`** = el ID que Lemon Squeezy nos manda en el webhook y que el comprador ve en su email de LS. Es lo que pega en `/recover`. Indexado en un puntero secundario `lsOrderId → orderId` en Blobs.
_Avoid_: Purchase, Transaction (no se usan en código).

### Derechos sobre los archivos

**License**:
Derecho personal, perpetuo y no exclusivo del comprador a usar los wallpapers del Pack en sus propios devices. Prohibida reventa, redistribución y uso comercial. Vive en el `LICENSE.txt` que se incluye dentro del ZIP — **no tiene representación en código**, pero existe como concepto del dominio: la License es perpetua aunque la Order ya esté expirada o agotada. _Si un comprador pierde los archivos pasada la Deadline, perdió la entrega — no la License — pero la política operativa es estricta: no re-emitimos fuera de plazo (se le invita a recomprar)_.

### Entrega del pack (post-compra)

**Delivery**:
Acto de servir el ZIP del pack al comprador: el endpoint `download.ts` valida el token, decrementa el cupo y redirige (302) a una URL presigned de R2. Es lo que cuenta contra el cupo.
_Avoid_: "Download" para referirse a este flujo — es ambiguo con el Render del Studio.

**Allowance**:
Cupo restante de Deliveries que tiene una Order. Empieza en 5 (`DEFAULT_DOWNLOADS_ALLOWED` en `process-order.ts:6`) y se decrementa en cada Delivery. Cuando llega a 0, el endpoint responde 403.
_Avoid_: "downloads remaining" en chat (es el nombre del campo, no del concepto).

**Deadline**:
Fecha tras la cual el Allowance de una Order deja de ser canjeable. Empieza en `createdAt + 30d`. Recovery puede extenderla — nunca acortarla.
_Avoid_: "expiration", "TTL" (la Deadline es del Order; el TTL del JWT es otro reloj — coinciden por construcción pero conceptualmente son cosas distintas).

**Recovery**:
Flujo de re-emisión del link de descarga para una Order existente, iniciado por el comprador desde `/recover` con `{email, orderId}`. **No es un Token distinto** ni un Allowance nuevo: usa el mismo `DownloadTokenPayload` y respeta el Allowance vigente. Solo puede extender la Deadline, no acortarla.
_Avoid_: "Recovery Token" como tipo aparte — no existe.

## Relationships

- Un **Pack** se compra → genera una **Order** (1:N — la misma persona puede comprar el mismo pack varias veces, cada compra es una Order independiente).
- Una **Order** concede una **License** perpetua sobre los archivos del Pack, y un **Allowance** inicial de 5 **Deliveries** durante una **Deadline** de 30d. License y Allowance son vidas paralelas: la License sobrevive a la Order.
- Cada **Delivery** consume 1 unidad del **Allowance** de su **Order**, y solo se sirve si `now < Deadline` y `Allowance > 0`.
- Un **Recovery** sobre una Order: respeta su Allowance, y solo ajusta la Deadline si el resultado es posterior a la actual (nunca acorta).
- **Render** vive en otra dimensión: no toca **Order**, **Delivery**, **Allowance**, **Deadline** ni **License** (es Studio gratuito).

## Example dialogue

> **Dev:** "Cuando un comprador clica el link del email, ¿qué pasa con su **Allowance**?"
> **Alex:** "Es una **Delivery** — bajamos el **Allowance** en 1. Si llegó a 0, no hay redirección a R2."
> **Dev:** "¿Y si descomprime el ZIP en otro Mac y vuelve a clicar el link al día siguiente?"
> **Alex:** "Sigue siendo una **Delivery** nueva — el comprador no sabe si extrajo el ZIP o no, nosotros solo sabemos que pidió el archivo. Por eso le damos 5."

## Flagged ambiguities

- **"Download"** se estaba usando para tres cosas distintas en el código: el Render del Studio, la Delivery del ZIP, y el Allowance. Resuelto separando los tres términos en este glosario. La copy UI sigue diciendo "Download" en ambos sitios (Studio y email) porque para el usuario es una sola idea; la separación es interna.
- **"Style"** es polisémico: `Style` en `palettes.ts` es el algoritmo de render del Studio (**RenderStyle**), `PackStyle` en `packs/types.ts` es la categoría/género del catálogo (**PackCategory**). Son ejes ortogonales — un Pack de cualquier PackCategory puede contener wallpapers pintados con cualquier RenderStyle. Nunca usar "Style" sin calificador.
