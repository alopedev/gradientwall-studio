# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # Vite dev server on http://localhost:5173 (also registered in .claude/launch.json as "vite-dev")
npm run typecheck   # tsc -b --noEmit — run this before considering a change done
npm run build       # tsc -b && vite build — full prod bundle into dist/
npm run preview     # Serve dist/ locally to smoke-test a prod build
```

There are no tests yet. When adding test infra, prefer Vitest (already compatible with the Vite pipeline) over Jest.

## What this project is

A single-page marketing + interactive "studio" for GradientWall — a cinematic wallpaper generator. One landing with Nav → Hero → Marquee → Studio → Gallery → Footer. No router; section nav is anchor-based (`#studio`, `#gallery`).

The project was migrated from a single-file vanilla HTML/CSS/JS prototype. The rendering math (mesh / blobs / liquid gradients, seeded PRNG, download-to-PNG with grain tile) was ported **1:1** into `src/lib/gradient.ts` + `src/lib/download.ts`. Don't "clean up" that math unless you have a specific visual regression to fix — it's calibrated to produce output the designer already signed off on.

## Architecture — the core shape

The app separates concerns along three axes: **pure render → store → React views**. Understanding this split is the fastest way to make correct changes.

### 1. Pure render layer (`src/lib/`)
- `gradient.ts` — framework-agnostic. `renderGradient(canvas, opts)` takes a canvas ref and options; paints pixels. Also exports `mulberry32` (seeded PRNG), `hslToHex`, `seedToHex`, `randomColors`.
- `palettes.ts` — all constant data: `DEVICE_SIZES`, `PALETTES` (2 free + 4 locked premium), `GALLERY_SEEDS`, plus the `Device | Style | Colors4 | Palette | GallerySeed` types that the rest of the app imports.
- `download.ts` — composes `renderGradient` + a grain-noise tile to produce a full-resolution PNG download.

These files import **nothing** from React, Zustand, or components. Keep them that way.

### 2. State (`src/store/useStudioStore.ts`)
Zustand store with `persist` middleware. Key points:
- `partialize` saves **only `history`** to `localStorage` under key `gw_history`. Everything else (colors, style, blur, grain, seed, device, activeTab, activePalette) is ephemeral per session.
- Actions encapsulate all mutations — components should never `set(...)` directly; call `setColor`, `applyPalette`, `randomize`, `save`, `loadGallerySeed`, etc.
- `applyPalette(i)` silently no-ops for locked palettes; the shake animation on locked click lives in the `Palettes` component, not the store.

### 3. React views (`src/components/`)
Components are thin. The pattern is:

```tsx
const colors = useStudioStore((s) => s.colors);   // selector subscription
useEffect(() => {
  renderGradient(canvasRef.current!, { colors, ... });
}, [colors, ...]);
```

`Preview.tsx` additionally uses `useLayoutEffect` + `ResizeObserver`-style window listener to aspect-fit the wallpaper inside the stage when the device changes. `History.tsx` and `Gallery.tsx` each mount their own canvas per item and render once on mount (or when the item changes).

## Design system — non-obvious rules

Tokens live in `src/index.css` inside `@theme { ... }` (Tailwind v4 CSS-first config). **There is no `tailwind.config.js`** — don't create one. Add tokens to `@theme`.

Custom utilities are declared with `@utility liquid { ... }` etc. The three tiers of "liquid glass" are `.liquid` (strong, for panels), `.liquid-subtle` (for cards and secondary surfaces), `.liquid-pill` (for over-image chrome like device pills).

**Critical Tailwind v4 gotcha**: base resets (e.g. `a { color: inherit; }`) **must** be wrapped in `@layer base { ... }`. If they're not, they end up in the implicit layer that comes *after* utilities, and things like `text-[#171717]` silently lose the cascade war to the element selector. This bit us during the initial migration — the button text rendered as white because `a { color: inherit }` was outside any layer.

Typography:
- `font-sans` → Barlow (300/400/500/600/700)
- `font-serif` → Instrument Serif (italic 400) — reserved for **accents only** (second line of a two-line headline, "calmer screens" style poetic emphasis). Never use it for body copy.
- No monospace: mono-styled labels use Barlow 500 with wide tracking (`tracking-[0.18em]` or `tracking-[0.22em]` uppercase).

Buttons:
- **Sharp 2px rect** (`rounded-[2px]`) for CTAs and destructive/primary actions.
- **Pill rounded-full** for toggles (tabs, mode switchers). Don't "unify" these — they're intentionally different.

The site-wide grain overlay is `body::before` (fixed, z-index 100, `mix-blend-mode: overlay`). The hero has its own second grain layer (`.hero-grain`) that composes with the video.

## Path alias `@/*`

Defined in **both places** — they must stay in sync:
- `tsconfig.app.json` → `paths: { "@/*": ["src/*"] }` (for TypeScript)
- `vite.config.ts` → `resolve.alias` with `fileURLToPath` (for the bundler)

If you add imports that resolve in the editor but Vite fails to build, suspect this.

## Video asset

`public/assets/backgroundVideos/gradientBackground2.mp4` (≈42 MB). Vite serves `public/` at the root, so the runtime URL is `/assets/backgroundVideos/gradientBackground2.mp4`. Don't import it from `src/` — it won't be hashed/bundled correctly and the big file would end up inlined.

## Accessibility and motion

`src/index.css` includes a `@media (prefers-reduced-motion: reduce)` block that kills the hero video and caps animation durations. If you add a new animation, it will inherit this — if it shouldn't, opt out explicitly.

## Running the dev server from Claude Code

`.claude/launch.json` is configured so that `preview_start` with `name: "vite-dev"` works out of the box. Use it instead of running `npm run dev` in Bash when verifying changes.
