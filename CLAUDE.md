# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # Vite dev server on http://localhost:5173 (also registered in .claude/launch.json as "vite-dev")
npm run typecheck   # tsc -b --noEmit — run this before considering a change done. Builds 3 project refs (app/node/functions).
npm run build       # tsc -b && vite build — full prod bundle into dist/
npm run preview     # Serve dist/ locally to smoke-test a prod build
npm test            # vitest run — one-shot test run (see "Test infra" below)
npm run test:watch  # vitest in watch mode
npm run lint        # biome check src netlify
npm run format      # biome format --write src netlify
npm run check       # typecheck + lint + test — el "ready to commit" del proyecto
```

Test infra: **Vitest**. Default environment is `jsdom` (for React component tests with @testing-library); files under `netlify/**/*.test.ts` use `// @vitest-environment node` so jose / crypto / process behave as at runtime. The setup file `src/test-setup.ts` early-outs when `typeof window === "undefined"` so node-env tests don't crash importing DOM-ware. Snapshot files live next to the test under `__snapshots__/` and are committed — regression guard on the core gradient math.

## Current focus — Etsy (since 2026-09-24)

The active channel is the **Etsy shop `gradientwall.etsy.com`**, not the web store below. The web (Studio + Lemon Squeezy store) is parked, not deleted; `PROJECT_LAUNCH.md` is obsolete. Its future is an open decision — don't invest in it unless asked.

- Published packs: **Impasto** (10 acrylic, from `public/assets/packs/acrylic/`) and **Dessau** (6 Bauhaus, from `public/assets/packs/dessau/`). One listing doc per pack in `docs/etsy/<product>.md` (title, description, tags, attributes, listing id); shop policies in `docs/etsy/shop-policies.md`.
- `scripts/etsy-pack.sh <source> [product]` → upscale with Upscayl + export 4K/5K/phone JPGs + ZIPs into `etsy-out/<product>/` (gitignored). Two modes, auto-detected: **crop** (16:9 `NN.jpg` originals, phone cropped from the center — fine for texture) and **split** (`NN_<name>.png` 9:16 + `NN_<name>-desktop.png` 16:9 — for composed art). Upscayl model differs per mode; both validated visually, don't swap them.
- `scripts/etsy-listing/render.sh <product>` → the 6 listing photos (3000×2250) from `listing.html`; per-pack copy and image picks live in its `PACKS` object.
- Pack artwork is generated with GPT Image from per-piece prompts (AI use is declared on the listing). Code-generated art was tried for Dessau and rejected on quality.

## What this project is

GradientWall — an interactive wallpaper studio plus a digital store for curated wallpaper packs. Free Studio + paid packs (5.99€ each for the real ones, same as Etsy, VAT included; single payment, no account, email-delivered).

Architecture of information: **Nav → Hero (headline + floating phone with the live wallpaper + ‹ Shuffle ›) → Packs → Studio → Footer** on the home, with separate routes for `/packs/:slug`, `/packs/:slug/success`, `/recover`. The old "Gallery" of community-made wallpapers was removed in the Semana 1 refactor — its slot is now the Packs catalog.

The rendering math (mesh / blobs / liquid gradients, seeded PRNG, grain tile) was ported 1:1 from a vanilla prototype into `src/lib/gradient/` (pure) and `src/lib/download/` (composes the painted canvas + grain into a downloadable WebP/JPEG). Don't "clean up" that math unless you have a specific visual regression to fix — it's calibrated to output the designer already signed off on.

## Architecture — the core shape

Four concentric layers: **pure render → state → React views → backend functions**. Frontend imports flow strictly inward (views can call state and lib, lib never imports React).

### 1. Pure render layer (`src/lib/`)
- `gradient/`
  - `spec.ts` — pure, deterministic, no DOM. `buildGradientSpec(opts)` returns a `GradientSpec` (data-only). Also exports `mulberry32`, `hslToHex`, `seedToHex`, `randomColors`. **Core product math** — snapshot-tested.
  - `canvas2d.ts` — `paintSpecToCanvas(canvas, spec)`. Only file under `gradient/` that touches Canvas API.
  - `index.ts` — re-exports + `renderGradient(canvas, opts)` convenience facade.
- `gradient-v2/` — the v2 engine (WebGL2 shader, ported pixel-for-pixel from the approved prototype in `/mnt/project-files/web-plan/prototipo/`). Lives beside v1; `GradientConfig.engine` (`"v1" | "v2"`, absent = v1 via `engineOf`) picks the renderer per favorite, so items saved before v2 keep rendering as saved.
  - `shader.ts` — GLSL sources. Signed-off math like `spec.ts`; a sha256 snapshot guards it.
  - `params.ts` — pure mapping from `RenderParams` vocabulary to uniforms (compass light angle → math radians, grain 0..100 → 0..1, 2–4 colour ramp → 4 stops, v1 style names → `liquid | aurora | grain-mesh`).
  - `renderer.ts` — the only file here that touches the GPU. One shared WebGL2 context (`getSharedRendererV2`), `paintV2` blits into any 2D canvas, large sizes render in 512-row strips.
  - `shader-animated.ts` — `FRAG_ANIMATED`: `FRAG` plus a `uTime` drift, derived by two string edits so the signed-off shader stays untouched (zero drift at t = 0). Only `studio/v2/ScreenMotion` uses it, to drift the wallpaper inside the Studio device (`createRendererV2(canvas, { animated: true })`, `draw(..., { time })`). `backdrop.ts` — its pure helpers (`screenMotionSize`, when to run).
  - `export.ts` — `renderWallpaperV2(params, w, h)` → canvas for `encodeWithFallback`, or `null` when the GPU path can't run (caller falls back to v1 `composeWallpaper`).
- `download/`
  - `compose.ts` — **single source of truth for "render a wallpaper onto a canvas"**. Exposes `paintWallpaper(canvas, opts)` for callers that already hold a canvas (gradient hooks, PackCover) and `composeWallpaper(opts, factory?)` for callers that need a fresh off-screen canvas (download flow, mockup shared canvas). Both internally call `paintWallpaper` so the gradient + grain pipeline is defined exactly once. If you ever need a watermark / blend mode tweak, this is the only file to touch.
  - `export.ts` — `exportCanvas(render, { device, seed, sink, onProgress })`: the Download button's whole pipeline (formats, progress stages, encode, filename, sink). Each engine passes only its render step; a `null` canvas means "fall back". `encode.ts` + `sink.ts` + `filename.ts` are its parts.
- `look.ts` — `Look` (every field that draws a wallpaper) and the only place that converts between the live store, renderer params and favorites: `toRenderParams`, `toFavoriteConfig`, `fromFavorite`, `isSameLook`, `pickLook`. Adding a render parameter starts here (the compiler flags the functions that forget it).
- `color.ts` — hex/HSL/RGB conversions (`parseHex`, `hexToRgb`, `rgbToHex`, `hslToHex`, `hexToHsl`) and `clamp/lerp/wrapAngle`. `gradient/spec.ts` re-exports `hslToHex`/`hexToHsl` from here. Add colour helpers here, not in the file that first needs them.
- `fitted-canvas.ts` + `useFittedCanvas.ts` — how a live preview is sized and repainted: `fitCanvasSize` (CSS box × DPR, 2400 cap, native aspect), `pixelKey(params, "v1" | "v2")` (what changes the pixels per pipeline) and the hook that owns the ResizeObserver + rAF coalescer. Both `useFittedGradientCanvas` (v1) and the WebGL engine canvas use it; a new parameter that reaches the pixels goes in `pixelKey`.
- `palettes.ts` — `DEVICE_SIZES`, `PALETTES` (10 free curated decks), `GradientConfig` shape, `Device | Style | Colors4 | DEVICES | STYLES | ActiveMask` types and `activeColors` selector.
- `packs/` — pure data layer for the store. Types (`Pack`, `PackStyle`, `PackCover` discriminated union), `getPacks()`, `getPackBySlug(slug)`, `filterPacks(style)`, `availableStyles()`. Source of truth: build-time JSON manifest at `src/data/packs.json` (any number of pieces per pack; an image piece may carry a `desktop` render beside its phone one, as Dessau does — the discriminator lets us migrate pack-by-pack without touching callers).
- `store/checkout.ts` (the shop, not Zustand state) — lazy-loads `lemon.js` (a failed load is forgotten, so the next click retries) and opens the LS overlay with `pack_slug` in `custom_data`. `isCheckoutConfigured()` drives the Buy button's disabled state — false until `VITE_LEMONSQUEEZY_STORE` is set.
- `useGradientCanvas.ts` — `useFittedGradientCanvas` (DPR + ResizeObserver + rAF coalesced), the v1 live preview.
- `color-extract.ts` — k-means color extraction for a photo dropped on the Studio device (`DeviceStage`).
- `motion.ts` — easing constants.
- `page-transition.ts` — `runPageTransition`: a route change as a View Transition, with shared elements named on the old page before the snapshot and on the new one once it mounts. `PackCard` uses it so the front phone and the name fly into the pack page (`data-vt=pack-phone|pack-title`); BrowserRouter has no built-in hook, and browsers without the API just navigate. Durations live in `index.css` (`::view-transition-*`).

These files import nothing from React, Zustand, or components. Keep them that way.

### 2. State (`src/store/`)
Tres Zustand stores + coordinator (Studio v2):
- `useConfigStore` — current Studio config (device, colors, active mask, style, blur, grain, seed, lightAngle, density, contrast, vibrance). Setters atómicos, `applySurprise()` (motor mejorado de Fase 1), `applyRemix()` (variación cercana).
- `useFavoritesStore` — persistido en `localStorage` key `gw:favorites:v1`. API `pin/unpin/reorder/clear`, cap 24 FIFO. `migrateLegacyHistory()` existe pero **no está conectado** (nadie lo llama): importar el `gw_history` antiguo es una decisión pendiente.
- `useLookHistoryStore` — wallpapers que el visitante dejó atrás (cap 30, efímero): `record()` antes de un gesto que reemplaza el wallpaper, `back()/forward()` para los botones ‹ › del dock. Los sliders y la rueda de color no graban (un arrastre llenaría la lista).
- `coordinator.ts` — los gestos que reemplazan el wallpaper entero y graban antes en el historial: `shuffleWallpaper()`, `remixWallpaper()`, `loadLook(look)` y `applyPalette(i)` (silent no-op para índices fuera de rango). Las operaciones legacy `save/loadHistoryItem/removeHistoryItem` se eliminaron en el cutover de Fase 5.

### 3. React views (`src/components/`)
Thin. Pattern:

```tsx
const colors = useConfigStore((s) => s.colors);   // selector subscription
useEffect(() => { paintWallpaper(canvasRef.current!, { colors, ... }); }, [colors]);
```

Component layout:
- `Nav.tsx` (frameless on the hero; once the page scrolls, one floating paper strip with a soft shadow and no ink edge), `Footer.tsx` (ends with a wordmark filled with the Studio palette) — the editorial chrome. `hero/Hero` is the first screen and carries the H1: a cut-out phone photo (`public/assets/hero/phone.webp`, transparent screen) floating over the paper (`animate-float`, motion-safe only) with the engine canvas behind the screen hole, plus ‹ Shuffle › and the palette name. It is kept short so the packs show under it; the screen box in `Hero.tsx` is measured on that photo. `StudioShell` comes after the packs with an h2. Inside the Studio, `ScreenMotion` in `DeviceStage` shows the same wallpaper drifting slowly on the device screen (own small WebGL context, ~30 fps, created when idle; renders nothing without WebGL2, with reduced motion, data saver or a v1 favorite). It hides while a new wallpaper's reveal plays and starts at t = 0, which matches the still render.
- `studio/engine/` — the seam between the Studio UI and whatever draws wallpapers. `WallpaperEngine` (`types.ts`) declares styles, adjustment sliders (with defaults), a live `Canvas` component, `paintThumbnail`, `exportFormat()` ("WebP", or "JPEG" without a WebP encoder; the Download button shows it) and `exportWallpaper(params, device, onProgress)`. `webgl-engine.tsx` is the default engine (v2 shader); it hands favorites saved with v1 and browsers without WebGL2 to `canvas2d-engine.tsx`, which wraps `lib/gradient` + `lib/download`. `EngineProvider` / `useWallpaperEngine` swap it. The UI never imports `lib/gradient` or `lib/download` directly, so a WebGL engine plugs in by implementing this interface.
- `studio/v2/` — el Studio activo: `StudioShell` (orquestador: rejilla con marco, panel y tira), `StudioTopBar` (nombre de la paleta + selector de dispositivo), `DeviceStage` (marco de móvil/tablet/monitor con pantalla de bloqueo y reveal circular desde el botón pulsado; el iPhone lleva botones laterales, barra de estado, linterna y cámara), `StudioInspector` (panel lateral con todo a la vista: ‹ Shuffle/Space › arriba, estilo, `PaletteList` (10 paletas), `ColorEditor` (4 selectores de color propios + hex, "Back to <paleta>"), `AdjustPanel`, y guardar + Descargar abajo; en un marco ≤760 px va bajo el wallpaper con pestañas Style / Colors / Adjust), `AdjustPanel` (sliders declarados por el motor + Reset / Remix), `SaveButton`, `ExportButton` (progreso por fases), `PaletteSwatches`, `FavoritesStrip` + `FavoriteThumbnail`, `reveal.ts` (`useRequestReveal`: los botones avisan al marco de dónde nace el reveal; `revealDurationMs`: 420 ms, 240 ms si los Shuffle se encadenan), `PrintSweep` + `print.ts` (al descargar, la pantalla del dispositivo se vuelve papel y el fondo se "imprime" de arriba abajo; `ExportButton` emite start/done/fail).
- `packs/` — store components: `PacksSection` (home), `PackCard` (catalog cover: a stack of phones that fans open on hover, focus or, on touch screens, when in view; the pieces come from `fanPieces`), `PackFilters`, `PackPage` (route `/packs/:slug`; ends with `MorePacks`: the other packs plus a live Studio card, so the page is never a dead end), `PackShowcase` (device carousel of a pack page), `PackSpecs` (spec block), `DeviceFrames` (CSS phone/laptop bezels, sized in %), `PackPurchaseSuccess` (route `/packs/:slug/success`), `PackCover` (renders gradient-kind via `paintWallpaper`, image-kind via `<img>`). What each piece looks like on a device (`pieceRenders`, `coverRenders`) and the spec numbers (`packSpecs`) are pure functions in `lib/packs/showcase.ts`: a landscape-only piece shows on the phone as a centre crop, as its real phone file is cut.
- `RecoverForm.tsx` — route `/recover`; POSTs `{email, orderId}` to the recover-link Function.
- `ui/` — design-system primitives: `InkButton`, `SegmentedControl`, `Reveal`, `MotionToggle` (pauses the hero float and the screen drift everywhere; state in `store/useMotionStore`, WCAG 2.2.2).

### 4. Backend (`netlify/functions/`)
Netlify Functions v2 (Web Request/Response). Handlers are intentionally thin — domain logic lives in pure `_lib/` modules with dependency injection so they're testable without spinning up Blobs/R2/Loops.

- `_lib/signed-token.ts` — JWT HS256 with `jose` v5. Token payload = `{orderId, packSlug, email}`. `iat` is injectable so the JWT exp aligns with `expiresAt` written to the order store (using deps' clock instead of `Date.now()` directly — important for testability and for keeping JWT vs. store consistent on retry).
- `_lib/lemon-squeezy.ts` — timing-safe HMAC verification of `X-Signature` + parser for `order_created` events (filters out non-paid + non-our event types).
- `_lib/catalog.ts` — backend view of `src/data/packs.json` (`slug`, `name`, `lemonSqueezyVariantId`). `resolveOrderPack` (in `lemon-squeezy.ts`) maps the **paid variant** to a pack; the buyer-editable `custom_data.pack_slug` is never trusted. A paid order whose variant isn't in the manifest returns 422, not a silent 200.
- `_lib/orders-store.ts` — `OrderStore` (what `order.ts` uses: `get`/`put`/`consumeDownload`/`extendDeadline`) and `kvOrderStore`, its key/value implementation over the `KVBackend` interface (`get`/`set` plus `getVersioned`/`setIf` compare-and-set) with two implementations: `netlifyBlobsBackend()` for prod (strong consistency, ETag via `onlyIfMatch`/`onlyIfNew`), `inMemoryBackend()` for tests. `consumeDownload` and `extendDeadline` are atomic: they retry read-decide-write on a lost race, so N parallel downloads never grant more than the allowance (`conflict` after repeated contention → download answers 503). `isExpired` is the one deadline check (`expiresAt <= now`, same as JWT `exp`). Order record = `{orderId, packSlug, email, downloadsRemaining, expiresAt, createdAt}`.
- `_lib/supabase-orders.ts` — the same `OrderStore` over Supabase Postgres: each operation is one PostgREST RPC to a SQL function in `supabase/migrations/*_orders.sql`, where the download count and deadline are decided under a row lock. `_lib/prod-order-store.ts` picks it when `SUPABASE_URL` is set (then `SUPABASE_SECRET_KEY` is required), Netlify Blobs otherwise. `order-store-contract.test.ts` runs one suite against both stores, the SQL one on in-process Postgres (PGlite). Setup in `docs/supabase.md`.
- `_lib/loops.ts` — minimal fetch client (`sendTransactional` only). `_lib/supabase-subscribers.ts` — the email list (`public.subscribers`, one RPC `subscribe_email`; see ADR-0005, which replaces ADR-0004; no double opt-in, nothing is sent from it). Frontend: `components/EmailCapture.tsx` + `lib/newsletter/`, hidden until `VITE_NEWSLETTER_ENABLED=true`.
- `_lib/r2.ts` — Cloudflare R2 presigned GET URL via `@aws-sdk/client-s3`. `packZipKey(slug)` = `packs/{slug}/{slug}.zip`.
- `_lib/ls-api.ts` — `fetchOrderEmail(orderId, apiKey)` for /recover validation.
- `_lib/order.ts` — the whole order lifecycle in one module, pure orchestration with deps inject: `createOrder` (webhook, 30d, resets allowance), `recoverOrder` (7d, never shortens the deadline, keeps allowance), `redeemDownload`. Shares the policy constants, the rule "JWT `exp` = stored `expiresAt`" and the link-building/email step. The handlers compose the prod deps and call these.
- `_lib/env.ts` — boundary for env vars: one reader per function (`readDownloadEnv`, `readWebhookEnv`, `readRecoverEnv`), each throwing `MissingEnvError` for only the variables that function uses. Read per request, not at import time.

The handlers (download, webhook, recover, plus `subscribe-handler.ts` for the email capture) are tiny files that wire prod deps into a factory in `_lib/` (`download-handler.ts`, `webhook-handler.ts`, `recover-handler.ts`; `createXHandler(deps)` with env, store, Loops, LS and presign injected, so each has handler-level tests with fakes). Unexpected failures answer `500 {ok:false, reason:"misconfigured" | "internal_error"}` via `_lib/http.ts` (cause only in logs).
- `lemon-squeezy-webhook.ts` POST → verify HMAC → parse → `createOrder` → 200. A failure after the signature check is a 500 so LS retries.
- `download.ts` GET → `redeemDownload(token)` → 302 to presigned R2 URL or 401/403 with `reason`.
- `subscribe.ts` POST `{email, source, website, consentText}` → validate (honeypot `website`) → Supabase `subscribe_email` → 200/400; never logs the address.
- `recover-link.ts` POST → validates against LS API + store → re-issues 7d token + email. Returns generic 200 regardless to prevent enumeration, including when Loops/Blobs fail (logged, not leaked); only missing config is a 500.

`netlify/functions/_lib/**` is conventionally not exposed as Functions because the directory starts with underscore.

## Routing

`react-router-dom` with `BrowserRouter` in `App.tsx`:
- `/` — `HomePage` (full landing). Scrolls to `#hash` on mount via `useLocation` to support cross-route nav (e.g. `/#packs` from PackPage).
- `/packs/:slug` — `PackPage`.
- `/packs/:slug/success` — `PackPurchaseSuccess`.
- `/recover` — `RecoverForm`.
- `*` — `<Navigate to="/" replace />`.

Hosting: every public route is prerendered (see "SEO / prerender" below), so Netlify serves real files and unknown paths get a real 404 (`404.html`, whose React app redirects home). Only `/packs/:slug/success` has no file and uses the SPA fallback. `public/_redirects` and the `[[redirects]]` block in `netlify.toml` must stay in sync.

## SEO / prerender

The app is still a client-rendered SPA (`createRoot`, no SSR). `seoPlugin` in `vite.config.ts` post-processes the build: it takes the built `index.html` as a template and writes `dist/<route>/index.html` for the home, each pack in `src/data/packs.json`, `/recover`, plus `404.html` and `sitemap.xml`. Each file has its own title, description, canonical, robots, Open Graph/Twitter and JSON-LD, plus a visually hidden h1/intro inside `#root` that React replaces on mount.

- Source of truth: `src/lib/seo/pages.ts` (pure; used by the plugin **and** by `PageMeta` at runtime) and `render.ts` (HTML/sitemap rendering). Change copy there, not in `index.html`: the block between `<!--seo:start-->` and `<!--seo:end-->` is generated.
- Pack pages are indexable once the pack can be bought: an `etsyUrl` (today; the Product `Offer.url` then points at the Etsy listing) or a `lemonSqueezyVariantId`.
- URLs carry a trailing slash (`packPath(slug)` → `/packs/impasto/`, `/privacy/`): Netlify serves `dir/index.html` there and 301-redirects the slashless form, so canonicals, sitemap and internal links use the slash. Impasto's old `/packs/acrylic` 301s to `/packs/impasto/` (`_redirects` + `netlify.toml`); its R2 ZIP key follows the slug (`packs/impasto/impasto.zip`) when the own store opens.
- Plan and research: `/mnt/project-files/web-plan/seo-2026-10-20/`.
- Per-page copy is English. `public/og-default.jpg` (1200×630) is the default share image.

## Design system — non-obvious rules

Tokens live in `src/index.css` inside `@theme { ... }` (Tailwind v4 CSS-first config). **There is no `tailwind.config.js`** — don't create one. Add tokens to `@theme`.

Identity B, "Dessau paper" (chosen 2026-10-12): grey paper (`--color-paper`), black ink, no glass, no brand accent colour. Colour on the page comes only from the wallpapers and the three Bauhaus shapes. `src/lib/theme/identity.test.ts` guards it: no `backdrop-blur`, gold, serif or Space Grotesk in components, and white only in files that paint on top of a wallpaper (its `ON_WALLPAPER` list). `paper-tokens.test.ts` guards the contrast of the token pairs.

Custom utilities: `tactile` (a small ink-edged key), `focus-ring` (the one keyboard focus ring, Bauhaus red `--color-accent`; the accent is for focus only, never a surface) and `display-head`.

**Critical Tailwind v4 gotcha**: base resets (e.g. `a { color: inherit; }`) **must** be wrapped in `@layer base { ... }`. Otherwise they end up in the implicit layer that comes *after* utilities, and things like `text-[#171717]` silently lose the cascade war. This bit us during the initial migration.

Typography:
- `font-sans` → Albert Sans (body, labels, buttons).
- `font-display` → Jost, set lowercase by `display-head` — headlines and the palette name. No second accent face.
- Labels use `font-sans` 500 with wide tracking (`tracking-[0.18em]` or `tracking-[0.22em]` uppercase), in `text-ink-dim`. Don't use `text-ink/50`-style fades for text: use `text-ink-dim`, which is contrast-tested.

Buttons and controls:
- `InkButton` in `components/ui/` (variants `primary` black with paper text, `round` the black Shuffle circle, `ghost` 2px ink outline, `icon`, `quiet`). Corners are `rounded-sharp` (4px); circles for icon buttons.
- Segmented controls and tabs: 2px ink outline, the selected option filled ink with paper text (`SegmentedControl`).
- Primary (`--color-primary`) is ink; rose (`--color-rose`) marks "saved"; good (`--color-good`) a finished download.

Site-wide paper grain: `body::before` (fixed, z-index 100, `mix-blend-mode: multiply`, low opacity).

## Path alias `@/*`

Defined in three places that must stay in sync:
- `tsconfig.app.json` → `paths: { "@/*": ["src/*"] }` (frontend types)
- `tsconfig.functions.json` → not used (functions don't use the alias)
- `vite.config.ts` → `resolve.alias` with `fileURLToPath` (the bundler)

If imports resolve in the editor but Vite fails to build, suspect this.

## Project references (TypeScript)

`tsconfig.json` has three references:
- `tsconfig.app.json` — frontend (`src/**`)
- `tsconfig.node.json` — vite config
- `tsconfig.functions.json` — backend (`netlify/**/*.ts`)

`npm run typecheck` builds all three. Add new top-level dirs as their own ref if you ever need different lib/types.

## Video asset

The home no longer ships a background video (the 41 MB hero loop was removed); the first screen is the floating-phone hero on plain paper. `specimenGem*.mp4` in `public/assets/backgroundVideos/` are unused leftovers.

## Accessibility and motion

`src/index.css` includes a `@media (prefers-reduced-motion: reduce)` block that caps animation durations. New animations inherit this — opt out explicitly only if there's a strong reason.

## Backend operations

- **Env vars**: see `.env.example`. Required for prod: `VITE_LEMONSQUEEZY_STORE`, `PUBLIC_SITE_URL`, `JWT_SECRET`, `LS_WEBHOOK_SECRET`, `LS_API_KEY`, `LOOPS_API_KEY`, `LOOPS_TRANSACTIONAL_ID`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_PACKS`. Optional: `SUPABASE_URL` + `SUPABASE_SECRET_KEY` to store orders in Supabase instead of Blobs. Set in Netlify dashboard.
- **Pack assets**: each pack ships as `gw-packs/packs/{slug}/{slug}.zip` in Cloudflare R2 (private bucket). The download Function presigns a 5-minute GET URL.
- **Setup runbook**: `docs/SETUP-WEEK2.md` is the step-by-step for Lemon Squeezy + Loops + R2 + Netlify wiring. Treat as the authoritative source for any account-side configuration.
- **Adding a pack**: edit `src/data/packs.json`, upload the ZIP to R2 at the canonical key, add `lemonSqueezyVariantId` once the LS product exists. PackPage's Buy button enables automatically when both the variant ID and `VITE_LEMONSQUEEZY_STORE` are present.

## Running the dev server from Claude Code

`.claude/launch.json` is configured so that `preview_start` with `name: "vite-dev"` works out of the box. Use it instead of running `npm run dev` in Bash when verifying changes.

For backend Functions during local dev, use `netlify dev` (Netlify CLI) — it proxies the Vite server and runs Functions on the same origin so frontend `fetch('/.netlify/functions/...')` calls resolve correctly.

## Studio v2 — surprise-first shell (Fase 5 cerrada)

El Studio v2 es ahora el único Studio (cutover Fase 5 completado). Mini-framework histórico en raíz: `PRD.md`, `PLANNING.md`, `TASKS.md`. Plan completo en `~/.claude/plans/vamos-a-afrontar-el-polymorphic-fiddle.md`.

**Tesis**: surprise-first + remix + galería persistente. Tres clicks máximo del primer load a wallpaper instalado. Potencia detrás de "Customize". Lenguaje visual: papel Dessau (identidad B, 2026-10-12; ver "Design system").

**Interfaz (inspector, 2026-10-12)** — fondo dentro del marco del dispositivo, un panel lateral con todos los controles a la vista y la tira de guardados debajo. Shuffle (o Space) es el gesto principal. Space y R solo actúan mientras el Studio está en pantalla y el foco no está en un botón o campo. Los controles llevan `aria-pressed` / `aria-expanded`; la animación respeta `prefers-reduced-motion` (`MotionConfig` + el reveal se omite). Detalle de componentes arriba (sección 3).

**Stores**:
- `useConfigStore` — `applySurprise()`, `applyRemix()`, setters atómicos.
- `useFavoritesStore` — persist `gw:favorites:v1`, API pin/unpin/reorder/clear, migración one-time desde `gw_history` legacy.

**Motor de generación (capa nueva, Fase 1)** en `src/lib/gradient/`:
- `curated-seeds.ts` — 80 seeds aprobados. `pickCuratedSeed(rng?)`, `pickCuratedSeedExcluding(prev, rng?)`.
- `palette-constraints.ts` — `randomHarmonicColors(rng)` con 4 esquemas armónicos + constraints HSL.
- `surprise.ts` — `generateSurprise(prevSeed?)`. Devuelve style `"liquid"`, pero `applySurprise` del store lo ignora y conserva el estilo elegido por el usuario; el motor sigue soportando los 4 styles para favoritos guardados.
- `remix.ts` — `generateRemix(current)` paleta intacta, varía seed/light/density.
- `harmonic-edit.ts` — sin uso desde que se retiró el `HarmonicWheel` (2026-10-20); se conserva porque `lib/gradient/` no se toca sin permiso.

**Intocables** (matemática firmada, snapshots blindan): `src/lib/gradient/spec.ts`, `canvas2d.ts`, `compose.ts`, `mulberry32`, `palettes.ts:activeColors`. Si un snapshot del motor falla tras un cambio, **revertir, no regenerar**.

**Controles**: Style picker (Mesh / Aurora / Liquid, en ese orden: lo fija `engine.styles`), sliders Grain / Light en Adjust (los declara el motor v2; Softness / Contrast / Vibrance solo existen en el motor Canvas2D), y los 4 selectores de color de `ColorEditor`. `applySurprise` y `applyRemix` respetan estilo, grain, contrast y vibrance del usuario. Siguen eliminados: Density (sin efecto visible en Canvas2D), SeedBadge, StudioHints, Swatches grid + ColorHUD, PaletteCards y LightDial standalone (la luz es el slider Light).

**Tendencias 2026 aplicadas (Fase 5; el cristal y los tokens OKLCH se retiraron con la identidad B)**:
- BorderBeam conic-gradient con mask trick (CSS pure, `motion-safe:` para reduced-motion).
- Heart-burst particles con CSS custom property `--angle` inyectada inline (4 direcciones equiespaciadas).
- Kinetic typography (`SplitWords kinetic` — scale spring por palabra al hover).
- Scroll-driven CSS reveals (`animation-timeline: view()` nativo, dentro de `@supports + @media no-preference`).
- Mobile responsive: stacked layout <640px.

**Tooling del proyecto**:
- Linter: Biome (config en `biome.json`, indent 2 espacios, line width 100). CSS deshabilitado porque Tailwind v4 `@theme/@utility` no es CSS estándar aún soportado.
- `npm run check` (typecheck + lint + test) — el "ready to commit".
- Lint debt pendiente: 62 violations en código preexistente registradas en `TASKS.md` Fase 6 (cleanup post-cutover).
