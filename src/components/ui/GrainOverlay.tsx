/**
 * Film-grain overlay applied on top of a wallpaper surface. The visual
 * noise comes from the `wallpaper-grain` utility (SVG turbulence pattern
 * defined in index.css). Opacity is driven by the studio's grain slider
 * (0-100 → 0-1). `mix-blend-overlay` lets dark grain darken midtones and
 * light grain brighten them, matching film stock behavior.
 *
 * Used by Preview (main wallpaper stage) and IPhoneMockup (both lock and
 * home variants) — the single source of truth keeps the look consistent
 * across surfaces.
 */
export function GrainOverlay({ amount }: { amount: number }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none wallpaper-grain mix-blend-overlay"
      style={{ opacity: amount / 100 }}
    />
  );
}
