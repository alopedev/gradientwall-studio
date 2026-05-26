# GradientWall — contrato de lanzamiento

**Fecha objetivo: 2026-06-09 (lunes)**

Plan cerrado de aquí al go-live. La regla operativa es: **lo que no esté en este checklist NO se toca**. Si aparece un impulso de iterar fuera del scope (re-rediseñar Studio, reescribir Hero, generar 3 packs más, "limpiar" el copy otra vez), la respuesta por defecto es *post-launch*.

## Por qué este contrato existe

Llevo un mes desarrollando. El proyecto está objetivamente listo para validar:
- Studio v2 cerrado (Fases 0-5 completas + cleanup post-rediseño + lint a `error`).
- 331/331 tests verde, typecheck OK, lint 0 errors.
- 5 packs en `packs.json`, 1 con assets reales (acrylic).
- Backend Lemon Squeezy + R2 + Loops implementado y testeado.
- 4 ADRs documentadas.

El bloqueo no es código. Es perfeccionismo difuso sin forcing function. Este documento es la forcing function (junto con Things tasks externas).

## Scope que ENTRA

### A — Cableado backend (1-2 días)
- [ ] Crear cuenta + Store en [Lemon Squeezy](https://lemonsqueezy.com). Configurar Merchant of Record para IVA UE.
- [ ] Crear los 5 productos en LS (acrylic, solar-drift, nordic-quiet, citrus-fog, pacific-pulse) a 4.99€. `Custom Data: pack_slug = <slug>`.
- [ ] Anotar los 5 `variantId` en `src/data/packs.json` campo `lemonSqueezyVariantId`.
- [ ] Crear webhook LS apuntando a `https://gradientwall.com/.netlify/functions/lemon-squeezy-webhook`. Solo evento `order_created`. Copiar `Signing Secret` → `LS_WEBHOOK_SECRET`.
- [ ] Crear API key LS → `LS_API_KEY`.
- [ ] Anotar dominio LS → `VITE_LEMONSQUEEZY_STORE`.
- [ ] Crear cuenta [Loops](https://loops.so). Crear template transaccional "Your pack is ready" con `{{packName}}` + `{{downloadUrl}}`. Copiar ID → `LOOPS_TRANSACTIONAL_ID`. API key → `LOOPS_API_KEY`.
- [ ] Crear bucket privado `gw-packs` en Cloudflare R2. Anotar `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_PACKS=gw-packs`.
- [ ] Subir ZIP del pack acrylic a R2 en key `packs/acrylic/acrylic.zip`.
- [ ] Generar `JWT_SECRET` con `openssl rand -hex 32`.
- [ ] Set `PUBLIC_SITE_URL=https://gradientwall.com`.
- [ ] Meter las 9 env vars en Netlify dashboard (Production + Deploy Previews).

Runbook detallado: [docs/SETUP-WEEK2.md](docs/SETUP-WEEK2.md).

### B — Pack #2 + assets restantes (en paralelo a A)
- [ ] Generar pack #2 (slug, name, tagline, description, 10 wallpapers high-res, cover).
- [ ] Empaquetar como `<slug>.zip` y subir a R2 en `packs/<slug>/<slug>.zip`.
- [ ] Actualizar `src/data/packs.json` con metadata + `lemonSqueezyVariantId`.
- [ ] **Regla blanda**: si llega a tiempo, entra. Si no, se publica con 1 pack real (acrylic) + 4 gradients. **NO bloquea launch.**

### C — Smoke test end-to-end (½ día)
- [ ] Deploy a producción con todas las env vars cableadas.
- [ ] Comprar el pack acrylic con tarjeta real (€4.99 propios) desde una ventana de incógnito.
- [ ] Verificar webhook LS → orden persistida en Netlify Blobs.
- [ ] Verificar email de Loops llegado al inbox real.
- [ ] Clic en link de descarga → 302 → ZIP descargado.
- [ ] Refundear tu propia compra en LS (botón "Refund").

### D — Páginas legales (½ día)
- [ ] Generar Terms / Privacy / Refund usando plantillas Lemon Squeezy (incluidas en LS Store).
- [ ] Publicar en `/terms`, `/privacy`, `/refund` (o subdominio si LS los hostea).
- [ ] Verificar que los enlaces del Footer apuntan a las URLs reales.

### E — A11y baseline (1h)
- [ ] Correr Lighthouse a11y manual en `/` con DevTools. Target ≥ 90.
- [ ] Si <90, fixes mínimos solo de a11y crítica (color contrast, missing aria-label). NO redesign.

## Scope que NO entra

❌ Rediseño visual del Studio. *Está cerrado.*
❌ Más copy iterativo. *La pasada del 2026-05-26 es la última pre-launch.*
❌ Packs adicionales más allá del #2.
❌ Nueva sección de marketing.
❌ Optimización de bundle JS.
❌ Refactor del backend.
❌ "Limpiar" cosas porque "ahora que estoy aquí…".
❌ Newsletter (descartada en [ADR-0004](docs/adr/0004-newsletter-removed.md)).

## Criterio go/no-go (2026-06-09 por la mañana)

**GO si**:
- A completa + C completa + D completa + E completa.
- Pack acrylic descargable end-to-end con orden real.

**NO-GO si**:
- Falla la verificación de C (webhook, email, o descarga).
- Falta alguna env var crítica.
- Lighthouse a11y < 70 (estructural).

**Pack #2 (B)** NO bloquea go/no-go.

## Riesgo principal

El único riesgo real es **volver al modo "iterar otra cosa"**. Cada vez que aparezca una decisión "¿hago X antes de launch?", la respuesta por defecto es **NO** salvo que X esté en este documento.

Si el impulso de tocar algo es muy fuerte, **anotarlo en `POST_LAUNCH.md`** (a crear post-launch) y seguir.

## Forcing function

1. Este documento, visible cada vez que abras el repo.
2. Things tasks con due dates por bloque (A, B, C, D, E).
3. Pregunta automática en cada sesión Claude entre hoy y 2026-06-09: *"¿cómo va el cableado?"*

---

Última revisión: 2026-05-26.
