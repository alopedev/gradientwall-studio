# PRD — GradientWall: Tienda de Packs + Rediseño de IA

## Context

GradientWall es hoy una landing + Studio interactivo para generar wallpapers gradient en el navegador (Vite + React + Tailwind v4 + Zustand, render math puro y validado). El producto está bien construido pero **monetiza cero** y arrastra ruido editorial (sección Gallery de "wallpapers de la comunidad" que el dueño no quiere mantener).

Este PRD documenta el salto del proyecto a **producto comercial**: tienda de packs curados de 10 wallpapers a 4.99€ con pago único Stripe-vía-Lemon-Squeezy, entrega digital sin cuenta de usuario, y un **rediseño de la arquitectura de información** del site para reducir ruido y dar protagonismo al modelo de venta. El Studio se mantiene gratis como hook de marketing, con un nudge suave hacia la tienda tras 3 descargas/día.

Outcome esperado: en ~4 semanas de trabajo a tiempo parcial, lanzar v1 con 5 packs en catálogo, checkout funcional y newsletter activa.

## Problem Statement

> Como persona que cuida la estética de mis devices (iPhone + Mac), encuentro frustrante el proceso actual de buscar wallpapers: las opciones gratuitas suelen tener marca de agua, fotografías sobreutilizadas o estética genérica; las premium están repartidas en muchos sitios distintos sin coherencia visual; los nativos del SO se quedan cortos. Quiero acceso rápido a wallpapers con estética cuidada, ya sea generándomelos yo en pocos clics o comprando colecciones curadas a precio razonable, sin tener que crear cuentas, sin marcas de agua, y con la garantía de que voy a sorprender visualmente cada vez que mire mi pantalla.

## Solution

> GradientWall es una web única que combina dos experiencias:
>
> 1. **Studio gratis** — generador interactivo de wallpapers gradient sin registro, con paletas curadas, ajustes de blur/grain/seed y descarga directa en alta resolución. Suficiente para cubrir la necesidad básica.
>
> 2. **Tienda de packs curados** — para cuando quiero una colección con identidad: packs temáticos de 10 wallpapers (Gradients, Acrylic, Fluted, Photo...) a 4.99€, pago único, sin cuenta. Compro, recibo email con link de descarga firmado, y los archivos son míos.
>
> El Studio es el hook gratuito que demuestra el gusto estético de la marca. Los packs son el upgrade para quien quiere variedad curada sin esfuerzo.

## User Stories

### Visitante / descubrimiento
1. Como visitante nuevo, quiero entender en menos de 5 segundos qué es GradientWall y qué puedo hacer aquí, para decidir si me quedo.
2. Como visitante, quiero ver de un vistazo el catálogo de packs disponibles desde la home, para decidir si me interesa comprar algo sin tener que navegar.
3. Como visitante, quiero filtrar el catálogo por estilo técnico (Gradients, Acrylic, Fluted, Photo), para encontrar rápido el tipo de wallpaper que busco.
4. Como visitante, quiero hacer click en un pack y ver una página dedicada con previews, descripción y precio, para evaluar la compra.
5. Como visitante, quiero ver previews de cada wallpaper del pack en mockups de device (iPhone, Mac), para imaginar cómo quedará en mi pantalla.
6. Como visitante, quiero ver thumbnails individuales de los 10 wallpapers del pack a baja resolución con grain, para tener idea del contenido sin que se me regale el producto.
7. Como visitante, quiero compartir el enlace de un pack concreto en redes y que se renderice OG tags relevantes (imagen + título + descripción), para que el link no quede genérico.

### Studio (free)
8. Como visitante curioso, quiero generar un wallpaper personalizado sin crear cuenta, para probar el producto sin compromiso.
9. Como usuario del Studio, quiero ajustar colores, blur, grain y seed, para personalizar el resultado a mi gusto.
10. Como usuario del Studio, quiero descargar el wallpaper en alta resolución compatible con mi device, sin marcas de agua, gratis.
11. Como usuario del Studio, quiero ver mi historial de wallpapers generados en la sesión, para volver a uno anterior si me arrepiento.
12. Como usuario que descarga el wallpaper número 4 del día desde el Studio, quiero ver un nudge amable que me sugiera mirar los packs curados, para descubrir esa parte del producto sin sentir que me bloquean nada.
13. Como visitante en mi tercera descarga del día, quiero seguir descargando sin ningún bloqueo duro, para que la promesa "free" se cumpla.

### Compra
14. Como visitante decidido, quiero comprar un pack en menos de 3 clicks desde la página del pack, para no perder el momento.
15. Como comprador, quiero pagar con tarjeta o métodos populares (Apple Pay, Google Pay) sin abandonar la web (overlay), para que la experiencia sea fluida.
16. Como comprador europeo, quiero ver el precio con IVA incluido y la factura correctamente emitida, sin tener que pedirla.
17. Como comprador, quiero recibir un email inmediato con el link de descarga del pack, para empezar a usarlo en cuanto pague.
18. Como comprador, quiero que el link de descarga sea seguro y no compartible públicamente (token firmado con caducidad), para que mi compra siga teniendo valor.
19. Como comprador que ha cerrado el email por accidente, quiero un mecanismo simple para re-recibir mi link metiendo solo mi email + ID de orden, para no tener que escribir a soporte.
20. Como comprador que paga con un email distinto del que uso normalmente, quiero recibir el link en el email del pago, para que no se pierda.

### Post-compra
21. Como cliente, quiero descargar el pack como un único archivo ZIP, para no gestionar 10 archivos sueltos.
22. Como cliente, quiero que el ZIP contenga los 10 wallpapers en máxima resolución, con nombres claros (ej. `gradientwall-midnight-velvet-01.jpg`), para usarlos sin renombrar.
23. Como cliente, quiero saber qué puedo y qué no puedo hacer con los wallpapers (uso personal sí, reventa no), para no infringir nada.
24. Como cliente, quiero poder volver a descargar el pack durante un periodo razonable (30 días, máx 5 descargas), por si cambio de device o pierdo los archivos.

### Newsletter
25. Como visitante interesado pero no listo para comprar, quiero suscribirme al newsletter para enterarme de futuros packs, sin pop-ups intrusivos.
26. Como usuario que acaba de descargar gratis, quiero ver un toast suave invitándome a unirme al newsletter, para mantenerme conectado si me ha gustado el producto.
27. Como suscriptor, quiero recibir email cuando hay un nuevo pack, sin spam.

### Mobile / responsive
28. Como visitante en iPhone, quiero que toda la web (Studio, catálogo, página de pack, checkout) funcione bien en móvil, porque es donde más uso wallpapers.
29. Como usuario en mobile, quiero poder previsualizar el pack en mockup de iPhone tamaño real, para validar que efectivamente se ve bien en mi pantalla.

### Accesibilidad y rendimiento
30. Como usuario con `prefers-reduced-motion` activado, quiero que las animaciones (video del Hero, transiciones) se desactiven o atenúen, para no marearme.
31. Como visitante con conexión lenta, quiero que la home cargue rápido (LCP < 2.5s), para no abandonar.

### Operación (Alex como dueño)
32. Como dueño, quiero poder añadir un nuevo pack al catálogo añadiendo entradas a un manifiesto JSON + subiendo assets, sin tener que tocar UI.
33. Como dueño, quiero ver métricas básicas (visitas, conversiones por pack, revenue, suscriptores) sin tener que abrir 5 dashboards.
34. Como dueño, quiero recibir notificación cuando una orden se completa, para tener pulse del negocio sin estar mirando dashboards.

### Legal / confianza
35. Como comprador, quiero ver Terms y Privacy claros antes de pagar, para confiar.
36. Como visitante europeo, quiero ver banner de cookies acorde a GDPR (si usamos analytics), sin barreras pesadas.

## Implementation Decisions

### Stack y proveedores
- **Frontend**: Vite + React 18 + TypeScript + Tailwind v4 + Zustand (mantener). Sin migración a SSR.
- **Hosting frontend**: Netlify (decisión del usuario por familiaridad).
- **Backend**: Netlify Functions en TypeScript. 4 endpoints — webhook, download, newsletter-subscribe, recover-link.
- **Storage de packs**: Cloudflare R2 (sin egress fees, crítico para descargas pesadas). Bucket privado para originales, bucket público para previews.
- **Pago**: Lemon Squeezy como Merchant of Record. Hosted overlay checkout, webhooks firmados, IVA UE gestionado por LS.
- **Email**: Loops para newsletter + transaccional. Audiences separadas (`customers`, `newsletter_subscribers`).
- **Analytics**: Plausible (privacy-friendly, evita banner de cookies pesado).

### Routing
- Introducir `react-router-dom` (~10 KB).
- Rutas: `/`, `/packs/:slug`, `/packs/:slug/success`, `/recover`, `/legal/terms`, `/legal/privacy`.
- `_redirects` en Netlify para SPA fallback.
- Path alias `@/*` ya existente (mantener sincronizado en `tsconfig.app.json` y `vite.config.ts`).

### Catálogo de packs (data layer)
- Nuevo módulo `src/lib/packs/`, **puro y sin React**:
  - Tipos: `Pack`, `PackStyle` (`'gradient' | 'acrylic' | 'fluted' | 'photo' | ...`), `WallpaperPreview`.
  - Funciones: `getPacks()`, `getPackBySlug(slug)`, `filterPacks(style)`.
  - Source: manifiesto JSON estático en `src/data/packs.json` (build-time, sin fetch en runtime).
- Cada pack en el manifiesto referencia URLs absolutas a R2 para `coverImageUrl`, `wallpaperPreviews[]`, `mockupImageUrl`, y un `lemonSqueezyVariantId` para el overlay.
- Operación: el dueño añade packs editando manifiesto + subiendo assets a R2 (proceso documentado en README).

### Componentes nuevos (frontend)
- `PacksSection` (en home) — grid responsive de cards con `PackFilters` sticky.
- `PackCard` — preview en mockup + título + estilo + precio.
- `PackFilters` — pills por style.
- `PackPage` (route `/packs/:slug`) — layout editorial: hero con cover en mockup, descripción, grid de thumbnails con grain, CTA "Buy 4.99€" → overlay LS.
- `MockupFrame` — componente reusable que recibe `imageUrl` + `device` (`iphone | mac | ipad`) y renderiza el wallpaper dentro del marco. Reutiliza el `IPhoneMockup` existente y se extiende.
- `NewsletterForm` — input + submit, llama Netlify Function que reenvía a Loops API.
- `DownloadLimitToast` — toast/modal mostrado al alcanzar el 4º intento de descarga del Studio en un día.
- `RecoverForm` (en `/recover`) — form para re-emitir link de descarga.
- `MarkdownPage` — wrapper simple que renderiza markdown estático para `/legal/*`.

### Componentes modificados
- `Nav` — añadir links a `#packs` y `/recover` en footer del nav.
- `Hero` — copy revisado para reflejar dual narrativa (Studio + Tienda) sin sobrecargar.
- `Footer` — incluir `NewsletterForm`, links legales, año, atribución.
- `Preview` (Studio) — invocación a `useDownloadLimitStore` antes de descargar; mostrar `DownloadLimitToast` al hit (la descarga sí completa — solo nudge).

### Componentes eliminados
- `Gallery.tsx`, `GalleryFeatured.tsx`.
- `GALLERY_SEEDS` en `palettes.ts` — eliminar o reciclar como starting points dentro del Studio (decisión menor en implementación).

### Stores nuevos
- `useDownloadLimitStore` — Zustand con `persist` middleware, `localStorage` key `gw_download_limit`. Estructura `{ date: 'YYYY-MM-DD', count: number }`. Reset automático al detectar día distinto. Acción `tryConsume(): { allowed: true; shouldShowNudge: boolean }`.

### Backend — contratos de Netlify Functions
1. **`POST /.netlify/functions/lemon-squeezy-webhook`**
   - Verifica firma HMAC (header `X-Signature`).
   - Si event `order_created`: extrae `orderId`, `customerEmail`, `custom_data.pack_slug`.
   - Genera JWT (HS256) con payload `{ orderId, packSlug, exp: now + 30d, downloadsRemaining: 5 }`.
   - Persiste contador en Netlify Blobs (key = `orderId`).
   - Llama Loops API enviando email "Your pack is ready" con link `https://gradientwall.com/.netlify/functions/download?token=...`.
2. **`GET /.netlify/functions/download?token=...`**
   - Valida JWT (firma + exp).
   - Lee contador en Blobs; si agotado → 403.
   - Genera presigned URL R2 (caducidad 5 min) para `packs/{slug}/{slug}.zip`.
   - Decrementa contador, persiste, redirige (302) a la presigned URL.
3. **`POST /.netlify/functions/newsletter-subscribe`**
   - Body: `{ email, source }`.
   - Llama Loops API añadiendo a audience `newsletter_subscribers`.
4. **`POST /.netlify/functions/recover-link`**
   - Body: `{ email, orderId }`.
   - Verifica en Lemon Squeezy API que la orden existe y email coincide.
   - Re-genera JWT (caducidad 7 días, contador heredado), reenvía email.
- Módulo puro reutilizable `signed-token` (generation + validation) compartido entre los handlers.

### Storage R2 — estructura
- Bucket privado `gw-packs/`: `packs/{slug}/{slug}.zip` (10 wallpapers JPG q92, nombres `gradientwall-{slug}-01.jpg` ... `-10.jpg`, incluye `LICENSE.txt`).
- Bucket público `gw-previews/`: `packs/{slug}/cover.jpg`, `thumb-01.jpg` ... `-10.jpg` (~800px con grain extra), `mockup-iphone.jpg`, `mockup-mac.jpg`.

### Integración Lemon Squeezy
- 1 store, N products (uno por pack), todos a 4.99 EUR flat.
- `custom_data` por product incluye `pack_slug` que se propaga al webhook.
- Checkout overlay vía script oficial de LS.
- Webhook configurado contra Netlify Function.
- Tax handling automático activado (LS gestiona IVA UE).

### SEO y metadata
- Cada `PackPage` setea `<title>`, `<meta name="description">`, OG tags (`og:title/description/image`).
- `index.html` con favicon, `manifest.json`, OG defaults.
- `sitemap.xml` generado en build con todas las rutas de packs.
- `robots.txt` permitiendo indexación.

### Nudge del Studio (límite suave)
- Contador en `localStorage` (esquivable trivialmente — aceptado como gentle nudge, no anti-fraud).
- Al alcanzar 3 descargas del día, la 4ª descarga **sí completa**, pero en paralelo se muestra `DownloadLimitToast` con CTA a `#packs`.
- Decisión consciente: no bloquear la descarga.

### Legal
- `Terms` y `Privacy` en markdown estático bajo `src/legal/`.
- Cláusula de licencia: uso personal en cualquier device del comprador, prohibido reventa, redistribución y uso comercial.

### Arquitectura de información del site (post-rediseño)
Orden de secciones en home: **Nav → Hero → Marquee → Packs → Studio → Closer → Footer**.
- Gallery: eliminada.
- Marquee: mantenido como decoración editorial entre Hero y Packs (decisión del usuario).
- Closer: mantenido como cierre estético sin CTA (decisión del usuario).
- Hero: copy revisado para narrativa dual.
- Packs: nueva sección, ocupa el espacio de la antigua Gallery.

## Testing Decisions

Buen test = invocar el comportamiento externo del módulo y aserciar el resultado, sin acoplarse a internals. Snapshot tests donde la salida es estable y representa contrato visual.

### Mantener (ya existen)
- Snapshot tests del gradient math en `src/lib/gradient/spec.ts`. **No tocar** — protegen output que el diseñador firmó.

### Tests nuevos prioritarios
1. **`useDownloadLimitStore`** — reset al cambiar de día, increment correcto, `tryConsume()` devuelve `shouldShowNudge=false` las 3 primeras veces y `true` en la 4ª. Test puro de Zustand sin React.
2. **`signed-token`** — generación de JWT con payload correcto; validación rechaza firma alterada; validación rechaza tokens expirados. Test puro de la función.
3. **`packs catalog`** — `getPackBySlug` devuelve pack correcto / undefined; `filterPacks(style)` filtra correctamente; manifiesto JSON valida contra el schema TypeScript.
4. **Lemon Squeezy webhook handler** — mocks de la firma HMAC; con firma válida genera JWT + dispara Loops; con firma inválida devuelve 401.

### Out of scope para tests automatizados
- E2E del checkout (validación manual con tarjeta de test de LS al final del MVP).
- E2E del flujo de email (manual: comprar → revisar inbox → click link).
- Tests visuales de mockups y catálogo en UI (cobertura por integración manual).

### Prior art
- `src/lib/gradient/__snapshots__/` ya establece el patrón "test puro determinista del módulo core".
- Mantener mismo estilo: Vitest, `environment: node`, sin React Testing Library cuando la lógica es pura.

## Out of Scope

Explícitamente fuera de este PRD, queda como follow-up:
- **Studio v2** — mejoras de capacidad de creación, rediseño UI y mejora de las paletas premium del Studio (decisión del usuario: "para más adelante").
- **Cuenta de usuario** — biblioteca personal, login, OAuth, recovery por password.
- **Licencia comercial / extended license**.
- **Suscripción mensual / All-Access Pass**.
- **Bundles / promos / códigos de descuento / programa de afiliados** — solo precio flat 4.99€.
- **Filtros avanzados** — solo filtro por estilo técnico; sin mood/color/season/popularity en MVP.
- **Multi-currency** — solo EUR (LS convierte automáticamente para el comprador).
- **Drops mensuales con tooling especial** — el usuario eligió catálogo amplio día 1; los drops futuros son operación manual.
- **App móvil nativa**.
- **CMS / panel admin** — gestión de packs vía manifiesto JSON + R2.
- **Reviews / ratings** de packs.
- **Gallery de wallpapers de la comunidad** — eliminada del scope.

## Verification

Cómo testear el resultado end-to-end antes de declarar "listo":

1. **Local dev**:
   - `npm run dev` (Vite, http://localhost:5173). Verificar Hero/Marquee/Packs/Studio/Closer/Footer renderizan.
   - Navegar a `/packs/<slug>` y verificar layout, mockups, thumbnails.
   - Abrir Studio, descargar 4 veces consecutivas: la 4ª debe completar + mostrar `DownloadLimitToast`.
   - Cambiar fecha del sistema (o mockear) → contador se resetea.
   - Subscribe newsletter → verificar 200 + entry en Loops audience.
2. **Backend (Netlify dev)**:
   - `netlify dev` para emular Functions localmente.
   - Forzar webhook con curl + payload firmado correctamente → debe persistir en Blobs y enviar email.
   - Forzar webhook con firma inválida → debe devolver 401.
   - Llamar `/download?token=<jwt>` con token válido → 302 a R2 presigned URL.
3. **Staging (Netlify deploy preview)**:
   - Comprar con tarjeta de test de LS (4242...) → verificar email recibido en <30s.
   - Click en link del email → ZIP se descarga correctamente.
   - Repetir 5 veces → 6ª descarga devuelve 403.
   - Probar `/recover` con email + orderId reales.
4. **Mobile real** (no DevTools): iPhone físico, recorrer toda la web, comprar, descargar el ZIP, abrirlo, asignar wallpaper a uno y verificar resolución correcta.
5. **Tests**: `npm test` debe pasar. `npm run typecheck` y `npm run build` sin errores.
6. **Lighthouse**: home en mobile, LCP < 2.5s, accessibility ≥ 95.

## Critical Files to Modify

Frontend:
- `src/App.tsx` (introducir router, eliminar import de Gallery)
- `src/components/Nav.tsx`, `src/components/Hero.tsx`, `src/components/Footer.tsx` (modificar)
- `src/components/Gallery.tsx`, `src/components/GalleryFeatured.tsx` (eliminar)
- `src/components/studio/Preview.tsx` (integrar download limit)
- `src/lib/palettes.ts` (eliminar `GALLERY_SEEDS` o reciclar)
- `src/lib/packs/` (nuevo módulo: `index.ts`, `types.ts`)
- `src/data/packs.json` (nuevo)
- `src/store/useDownloadLimitStore.ts` (nuevo)
- `src/components/packs/PacksSection.tsx`, `PackCard.tsx`, `PackFilters.tsx`, `PackPage.tsx` (nuevos)
- `src/components/MockupFrame.tsx` (nuevo, generaliza `IPhoneMockup`)
- `src/components/NewsletterForm.tsx`, `DownloadLimitToast.tsx`, `RecoverForm.tsx`, `MarkdownPage.tsx` (nuevos)
- `src/legal/terms.md`, `src/legal/privacy.md` (nuevos)
- `index.html` (OG defaults, favicon, manifest)
- `vite.config.ts`, `tsconfig.app.json` (verificar alias siguen sincronizados)
- `package.json` (añadir `react-router-dom`, `@aws-sdk/client-s3` o equivalente para R2 en functions, `jose` o `jsonwebtoken`)

Backend:
- `netlify/functions/lemon-squeezy-webhook.ts` (nuevo)
- `netlify/functions/download.ts` (nuevo)
- `netlify/functions/newsletter-subscribe.ts` (nuevo)
- `netlify/functions/recover-link.ts` (nuevo)
- `netlify/functions/_lib/signed-token.ts` (módulo puro reusable)
- `netlify/functions/_lib/loops.ts`, `r2.ts`, `lemon-squeezy.ts` (clients)
- `netlify.toml` (config functions + redirects)
- `_redirects` (SPA fallback)

Tests:
- `src/store/useDownloadLimitStore.test.ts`
- `src/lib/packs/packs.test.ts`
- `netlify/functions/_lib/signed-token.test.ts`
- `netlify/functions/lemon-squeezy-webhook.test.ts`

Docs / config:
- `README.md` (proceso de añadir packs)
- `.env.example` (vars: `LEMON_SQUEEZY_WEBHOOK_SECRET`, `JWT_SECRET`, `LOOPS_API_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_PACKS`, `R2_BUCKET_PREVIEWS`, `R2_ACCOUNT_ID`)
- `CLAUDE.md` (actualizar para reflejar nueva arquitectura post-implementación)

## Further Notes

- **Compra de dominio**: pendiente confirmar `gradientwall.com` (o equivalente) está adquirido. Recomendado antes de lanzar.
- **Calendario sugerido (orientativo, ~4 semanas a tiempo parcial)**:
  - Semana 1: routing + data layer de packs + catálogo en home + página de pack (sin pago).
  - Semana 2: integración Lemon Squeezy + webhook + email transaccional + R2.
  - Semana 3: Studio download limit + newsletter + páginas legales + SEO + metadata.
  - Semana 4: producción de los 5 packs iniciales (assets + previews + mockups), QA en mobile real, soft launch.
- **Cumplimiento UE**: con LS como MoR, el alta como autónomo NO es estrictamente necesario en algunos países; en España consultar asesor — LS factura como vendedor.
- **Riesgo técnico bajo**: stack ya conocido y render math validado. El mayor riesgo es operacional (producir 5 packs de calidad antes de lanzar).
- **Métrica clave de éxito sugerida**: conversión visit → pack purchase ≥ 0.5% en los primeros 30 días post-lanzamiento.
