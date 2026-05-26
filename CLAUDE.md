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

Test infra: **Vitest**. Default environment is `jsdom` (for React component tests with @testing-library); files under `netlify/**/*.test.ts` use `// @vitest-environment node` so jose v5 / crypto / process behave as at runtime. The setup file `src/test-setup.ts` early-outs when `typeof window === "undefined"` so node-env tests don't crash importing DOM-ware. Snapshot files live next to the test under `__snapshots__/` and are committed — regression guard on the core gradient math.

## What this project is

GradientWall — an interactive wallpaper studio plus a digital store for curated wallpaper packs. Free Studio + paid packs (4.99€ each, single payment, no account, email-delivered).

Architecture of information: **Nav → Hero → Marquee → Studio → Packs → Footer** on the home, with separate routes for `/packs/:slug`, `/packs/:slug/success`, `/recover`. The old "Gallery" of community-made wallpapers was removed in the Semana 1 refactor — its slot is now the Packs catalog.

The rendering math (mesh / blobs / liquid gradients, seeded PRNG, grain tile) was ported 1:1 from a vanilla prototype into `src/lib/gradient/` (pure) and `src/lib/download/` (composes the painted canvas + grain into a downloadable WebP/JPEG). Don't "clean up" that math unless you have a specific visual regression to fix — it's calibrated to output the designer already signed off on.

## Architecture — the core shape

Four concentric layers: **pure render → state → React views → backend functions**. Frontend imports flow strictly inward (views can call state and lib, lib never imports React).

### 1. Pure render layer (`src/lib/`)
- `gradient/`
  - `spec.ts` — pure, deterministic, no DOM. `buildGradientSpec(opts)` returns a `GradientSpec` (data-only). Also exports `mulberry32`, `hslToHex`, `seedToHex`, `randomColors`. **Core product math** — snapshot-tested.
  - `canvas2d.ts` — `paintSpecToCanvas(canvas, spec)`. Only file under `gradient/` that touches Canvas API.
  - `index.ts` — re-exports + `renderGradient(canvas, opts)` convenience facade.
- `download/`
  - `compose.ts` — **single source of truth for "render a wallpaper onto a canvas"**. Exposes `paintWallpaper(canvas, opts)` for callers that already hold a canvas (Preview, gradient hooks, PackCover) and `composeWallpaper(opts, factory?)` for callers that need a fresh off-screen canvas (download flow, mockup shared canvas). Both internally call `paintWallpaper` so the gradient + grain pipeline is defined exactly once. If you ever need a watermark / blend mode tweak, this is the only file to touch.
  - `encode.ts` + `sink.ts` + `index.ts` — encode-with-fallback + browser blob download wiring used by the Studio's Download button.
- `palettes.ts` — `DEVICE_SIZES`, `PALETTES` (10 free curated decks), `GradientConfig` shape, `Device | Style | Colors4 | DEVICES | STYLES | ActiveMask` types and `activeColors` selector.
- `packs/` — pure data layer for the store. Types (`Pack`, `PackStyle`, `PackCover` discriminated union), `getPacks()`, `getPackBySlug(slug)`, `filterPacks(style)`, `availableStyles()`. Source of truth: build-time JSON manifest at `src/data/packs.json` (10 previews per pack, all `kind: "gradient"` until real R2 assets land — the discriminator lets us migrate pack-by-pack without touching callers).
- `checkout.ts` — lazy-loads `lemon.js` and opens the LS overlay with `pack_slug` in `custom_data`. `isCheckoutConfigured()` drives the Buy button's disabled state — false until `VITE_LEMONSQUEEZY_STORE` is set.
- `useGradientCanvas.ts` — `useGradientCanvas` (legacy fixed-size) + `useFittedGradientCanvas` (DPR + ResizeObserver + rAF coalesced). Both delegate to `paintWallpaper`.
- `color-extract.ts` — k-means color extraction for the Source-tab image upload.
- `motion.ts`, `mouseTrail.ts` — easing constants + small UI helpers.

These files import nothing from React, Zustand, or components. Keep them that way.

### 2. State (`src/store/`)
Cuatro Zustand stores + coordinator (Studio v2):
- `useConfigStore` — current Studio config (device, colors, active mask, style, blur, grain, seed, lightAngle, density, contrast, vibrance). Setters atómicos, `applySurprise()` (motor mejorado de Fase 1), `applyRemix()` (variación cercana), `randomize()` legacy `@deprecated`.
- `useFavoritesStore` — persistido en `localStorage` key `gw:favorites:v1`. API `pin/unpin/reorder/clear`, cap 24 FIFO. `migrateLegacyHistory()` (one-time) importa cualquier `gw_history` antiguo automáticamente.
- `useUIStore` — ephemeral UI state (active source tab, active palette index).
- `useRecentColorsStore` — ring buffer de colores recientes para el ColorHUD picker.
- `coordinator.ts` — `applyPalette(i)` (silent no-op para índices fuera de rango). Las operaciones legacy `save/loadHistoryItem/removeHistoryItem` se eliminaron en el cutover de Fase 5.

### 3. React views (`src/components/`)
Thin. Pattern:

```tsx
const colors = useConfigStore((s) => s.colors);   // selector subscription
useEffect(() => { paintWallpaper(canvasRef.current!, { colors, ... }); }, [colors]);
```

Component layout:
- `Nav.tsx`, `Hero.tsx`, `Marquee.tsx`, `Footer.tsx` — the editorial chrome.
- `studio/v2/` (Fase 5 cutover) — el Studio activo: `StudioShell` (orquestador), `SurpriseCTA` (ShimmerButton magnético + spin-around conic en fresh-state), `ActionRow` (Save/Remix/Download+DevicePicker/Customize), `CustomizePanel` (inline lateral 420 px con `HarmonicWheel` circular + `PaletteCards` + Softness + Grain), `FavoritesStrip` + `FavoriteThumbnail` (galería persistente con motion Reorder + scroll-driven reveal CSS nativo), `DevicePicker`.
- `studio/` (hojas reutilizadas por v2) — `Preview` (canvas con prop `framed`), `HarmonicWheel` (color picker armónico + anillo de luz), `PaletteCards` (4 paletas featured con hover-expand), `useColorEditing` (subset eyedropper para HarmonicWheel), `ImageSource`, `UseMyPhotoButton`.
- `packs/` — store components: `PacksSection` (home), `PackCard`, `PackFilters`, `PackPage` (route `/packs/:slug`), `PackPurchaseSuccess` (route `/packs/:slug/success`), `PackCover` (renders gradient-kind via `paintWallpaper`, image-kind via `<img>`).
- `RecoverForm.tsx` — route `/recover`; POSTs `{email, orderId}` to the recover-link Function.
- `ui/` — design-system primitives: `Framed`, `Reveal`, `Stagger`, `GrainOverlay`, `MagneticButton`.

### 4. Backend (`netlify/functions/`)
Netlify Functions v2 (Web Request/Response). Handlers are intentionally thin — domain logic lives in pure `_lib/` modules with dependency injection so they're testable without spinning up Blobs/R2/Loops.

- `_lib/signed-token.ts` — JWT HS256 with `jose` v5. Token payload = `{orderId, packSlug, email}`. `iat` is injectable so the JWT exp aligns with `expiresAt` written to the order store (using deps' clock instead of `Date.now()` directly — important for testability and for keeping JWT vs. store consistent on retry).
- `_lib/lemon-squeezy.ts` — timing-safe HMAC verification of `X-Signature` + parser for `order_created` events (filters out non-paid + non-our event types).
- `_lib/orders-store.ts` — `KVBackend` interface (`get`/`set`) with two implementations: `netlifyBlobsBackend()` for prod, `inMemoryBackend()` for tests. `consumeDownload` does read-check-write; not transactional, but acceptable for the 5-allowance budget. Order record = `{orderId, packSlug, email, downloadsRemaining, expiresAt, createdAt}`.
- `_lib/loops.ts` — minimal fetch client (`sendTransactional` only — newsletter / contact list removed, see ADR-0004).
- `_lib/r2.ts` — Cloudflare R2 presigned GET URL via `@aws-sdk/client-s3`. `packZipKey(slug)` = `packs/{slug}/{slug}.zip`.
- `_lib/ls-api.ts` — `fetchOrderEmail(orderId, apiKey)` for /recover validation.
- `_lib/process-order.ts`, `_lib/process-download.ts` — pure orchestration with deps inject. The handlers compose the prod deps and call these.
- `_lib/env.ts` — boundary for env vars; throws on missing vars at import time.

The 3 handlers:
- `lemon-squeezy-webhook.ts` POST → verify HMAC → parse → `processOrderCreated` → 200.
- `download.ts` GET → `processDownload(token)` → 302 to presigned R2 URL or 401/403 with `reason`.
- `recover-link.ts` POST → validates against LS API + store → re-issues 7d token + email. Returns generic 200 regardless to prevent enumeration.

`netlify/functions/_lib/**` is conventionally not exposed as Functions because the directory starts with underscore.

## Routing

`react-router-dom` with `BrowserRouter` in `App.tsx`:
- `/` — `HomePage` (full landing). Scrolls to `#hash` on mount via `useLocation` to support cross-route nav (e.g. `/#packs` from PackPage).
- `/packs/:slug` — `PackPage`.
- `/packs/:slug/success` — `PackPurchaseSuccess`.
- `/recover` — `RecoverForm`.
- `*` — `<Navigate to="/" replace />`.

SPA fallback: `public/_redirects` (`/*  /index.html  200`) and a mirror block in `netlify.toml`.

## Design system — non-obvious rules

Tokens live in `src/index.css` inside `@theme { ... }` (Tailwind v4 CSS-first config). **There is no `tailwind.config.js`** — don't create one. Add tokens to `@theme`.

Custom utilities are declared with `@utility liquid { ... }` etc. The three tiers of "liquid glass" are `.liquid` (strong, for panels), `.liquid-subtle` (cards), `.liquid-pill` (over-image chrome).

**Critical Tailwind v4 gotcha**: base resets (e.g. `a { color: inherit; }`) **must** be wrapped in `@layer base { ... }`. Otherwise they end up in the implicit layer that comes *after* utilities, and things like `text-[#171717]` silently lose the cascade war. This bit us during the initial migration.

Typography:
- `font-sans` → Barlow (300/400/500/600/700)
- `font-serif` → Instrument Serif (italic 400) — accents only (second line of two-line headlines, "calmer screens" emphasis). Never body copy.
- Mono-styled labels use Barlow 500 with wide tracking (`tracking-[0.18em]` or `tracking-[0.22em]` uppercase).

Buttons:
- **Sharp 2px rect** (`rounded-[2px]`) for CTAs and primary actions.
- **Pill rounded-full** for toggles (tabs, mode switchers). Don't unify them — they're intentionally different.

Site-wide grain: `body::before` (fixed, z-index 100, `mix-blend-mode: overlay`). The hero has its own second grain layer (`.hero-grain`).

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

`public/assets/backgroundVideos/gradientBackground2.mp4` (≈42 MB). Vite serves `public/` at root, so the runtime URL is `/assets/backgroundVideos/gradientBackground2.mp4`. Don't import it from `src/` — it won't be hashed/bundled correctly and the big file would inline.

## Accessibility and motion

`src/index.css` includes a `@media (prefers-reduced-motion: reduce)` block that kills the hero video and caps animation durations. New animations inherit this — opt out explicitly only if there's a strong reason.

## Backend operations

- **Env vars**: see `.env.example`. Required for prod: `VITE_LEMONSQUEEZY_STORE`, `PUBLIC_SITE_URL`, `JWT_SECRET`, `LS_WEBHOOK_SECRET`, `LS_API_KEY`, `LOOPS_API_KEY`, `LOOPS_TRANSACTIONAL_ID`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_PACKS`. Set in Netlify dashboard.
- **Pack assets**: each pack ships as `gw-packs/packs/{slug}/{slug}.zip` in Cloudflare R2 (private bucket). The download Function presigns a 5-minute GET URL.
- **Setup runbook**: `docs/SETUP-WEEK2.md` is the step-by-step for Lemon Squeezy + Loops + R2 + Netlify wiring. Treat as the authoritative source for any account-side configuration.
- **Adding a pack**: edit `src/data/packs.json`, upload the ZIP to R2 at the canonical key, add `lemonSqueezyVariantId` once the LS product exists. PackPage's Buy button enables automatically when both the variant ID and `VITE_LEMONSQUEEZY_STORE` are present.

## Running the dev server from Claude Code

`.claude/launch.json` is configured so that `preview_start` with `name: "vite-dev"` works out of the box. Use it instead of running `npm run dev` in Bash when verifying changes.

For backend Functions during local dev, use `netlify dev` (Netlify CLI) — it proxies the Vite server and runs Functions on the same origin so frontend `fetch('/.netlify/functions/...')` calls resolve correctly.

## Studio v2 — surprise-first shell (Fase 5 cerrada)

El Studio v2 es ahora el único Studio (cutover Fase 5 completado). Mini-framework histórico en raíz: `PRD.md`, `PLANNING.md`, `TASKS.md`. Plan completo en `~/.claude/plans/vamos-a-afrontar-el-polymorphic-fiddle.md`.

**Tesis**: surprise-first + remix + galería persistente. Tres clicks máximo del primer load a wallpaper instalado. Potencia detrás de "Customize". Lenguaje visual: liquid glass moderno (iOS 26 / macOS Tahoe inspired) + brutalist tipográfico.

**Arquitectura de componentes en `src/components/studio/v2/`**:
- `StudioShell` — orquestador layout. Maneja `customizeOpen` state. Anima canvas/panel con motion `layout` (desktop side-by-side, mobile stacked).
- `SurpriseCTA` — `ShimmerButton` magnético (shimmer-slide + spin-around conic incorporados) + bind Space.
- `ActionRow` — Save (heart-burst particles) · Remix (R) · Download+DevicePicker · Customize (toggle inline panel).
- `CustomizePanel` — panel inline 420 px con `HarmonicWheel` (colores + luz absorbida en el anillo perimetral) + `PaletteCards` + sliders de Softness y Grain. Glass-modern. Sin Style picker ni Density slider.
- `FavoritesStrip` + `FavoriteThumbnail` — galería persistente, motion Reorder, scroll-driven CSS reveal.
- `DevicePicker` — primitivo (iPhone / iPad / Desktop).

Hojas reutilizadas en `src/components/studio/`:
- `HarmonicWheel` (500 LOC) — Arc-like color picker circular con 4 bullets (focal + 3 satélites) sincronizados por `computeHarmonicColors`. Anillo concéntrico exterior con handle dorado absorbe `lightAngle`. Eyedropper Pipette + ColorSelector dots para cambiar slot focal.
- `PaletteCards` — 4 paletas featured (Dusk / Tokyo / Forest / Mocha) en stack vertical estilo ravikatiyar hover-expand.
- `Preview`, `ImageSource`, `UseMyPhotoButton`, `useColorEditing` — primitivos compartidos.

**Stores**:
- `useConfigStore` — `applySurprise()`, `applyRemix()`, setters atómicos.
- `useFavoritesStore` — persist `gw:favorites:v1`, API pin/unpin/reorder/clear, migración one-time desde `gw_history` legacy.

**Motor de generación (capa nueva, Fase 1)** en `src/lib/gradient/`:
- `curated-seeds.ts` — 80 seeds aprobados. `pickCuratedSeed(rng?)`, `pickCuratedSeedExcluding(prev, rng?)`.
- `palette-constraints.ts` — `randomHarmonicColors(rng)` con 4 esquemas armónicos + constraints HSL.
- `surprise.ts` — `generateSurprise(prevSeed?)`. Style hardcoded a `"liquid"` tras el rediseño del CustomizePanel; el motor sigue soportando los 4 styles para favoritos guardados antes del cambio.
- `remix.ts` — `generateRemix(current)` paleta intacta, varía seed/light/density.
- `harmonic-edit.ts` — capa pura (sin React) para el `HarmonicWheel`: spread angular, derivación de 4 colores armónicos desde `(anchorHue, anchorLight, spread, focalSlot)`, inversión (`inferAnchor`) para reposicionar el wheel cuando una palette card sobrescribe colores.

**Intocables** (matemática firmada, snapshots blindan): `src/lib/gradient/spec.ts`, `canvas2d.ts`, `compose.ts`, `mulberry32`, `palettes.ts:activeColors`. Si un snapshot del motor falla tras un cambio, **revertir, no regenerar**.

**Controles eliminados** (decisión consciente): sliders de contrast/vibrance (defaults curados en motor), Style picker (style siempre `liquid`), Density slider (no producía cambio visual en Canvas2D), SeedBadge visible, StudioHints one-shot, Swatches grid + ColorHUD popover (reemplazados por HarmonicWheel), Palettes chip list (reemplazado por PaletteCards), LightDial standalone (absorbido por el anillo del HarmonicWheel). Grain sí se expone (slider en el footer del panel).

**Tendencias 2026 aplicadas (Fase 5)**:
- Liquid glass refinement: backdrop-filter `blur+saturate+brightness`, double-inset highlight, gradient background, `contain: paint`.
- OKLCH tokens (`--accent-oklch`, `--ink-oklch`, `--bg-oklch`) + `color-mix` variants para hovers consistentes.
- BorderBeam conic-gradient con mask trick (CSS pure, `motion-safe:` para reduced-motion).
- Heart-burst particles con CSS custom property `--angle` inyectada inline (4 direcciones equiespaciadas).
- Kinetic typography (`SplitWords kinetic` — scale spring por palabra al hover).
- Scroll-driven CSS reveals (`animation-timeline: view()` nativo, dentro de `@supports + @media no-preference`).
- Mobile responsive: stacked layout <640px vía `useIsMobile()` hook.

**Tooling del proyecto**:
- Linter: Biome (config en `biome.json`, indent 2 espacios, line width 100). CSS deshabilitado porque Tailwind v4 `@theme/@utility` no es CSS estándar aún soportado.
- `npm run check` (typecheck + lint + test) — el "ready to commit".
- Lint debt pendiente: 62 violations en código preexistente registradas en `TASKS.md` Fase 6 (cleanup post-cutover).
