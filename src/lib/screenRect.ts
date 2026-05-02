/**
 * Geometry for laying a wallpaper canvas inside a photographed device
 * mockup. Pure: no DOM, no canvas, no React. The IPhoneMockup component
 * passes hard-coded corners (measured from the asset PNG) and consumes the
 * CSS-ready output.
 *
 * Sign convention is the **CSS rotate convention**: positive degrees =
 * clockwise (visually, screen y-down). Mismatching this with the
 * detection-time math is exactly the bug that produced a wallpaper rotated
 * the wrong way; the tests below pin the convention so it cannot regress.
 */

export interface Corner {
  x: number;
  y: number;
}

export interface ScreenRectCSS {
  /** Left edge as percentage of image width (0–100). */
  leftPct: number;
  /** Top edge as percentage of image height (0–100). */
  topPct: number;
  /** Width as percentage of image width (0–100). */
  widthPct: number;
  /** Height as percentage of image height (0–100). */
  heightPct: number;
  /**
   * Rotation in degrees, CSS convention (positive = CW visually). Apply via
   * `transform: rotate(${rotateDeg}deg)` with `transform-origin: center`.
   */
  rotateDeg: number;
  /**
   * Horizontal corner radius as percentage of element WIDTH. Combined with
   * `borderRadiusYPct` produces visually-circular corners regardless of the
   * element's aspect ratio (CSS interprets `border-radius: X% / Y%` where
   * X is % of width and Y is % of height).
   */
  borderRadiusXPct: number;
  /** Vertical corner radius as percentage of element HEIGHT. */
  borderRadiusYPct: number;
}

export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Given the 4 corners and axis-aligned bounding box of a rotated rect (in
 * image coordinates, y-down) plus the image dimensions, return the
 * CSS-ready rect properties.
 *
 * **Why two inputs**: the screen has rounded corners. Extreme-pixel corner
 * detection (`min/max of x±y`) returns *tangent points on the curves*,
 * which sit INSIDE the geometric corners — their AABB underestimates the
 * rect's real width and height. The flood-filled region's AABB, by
 * contrast, is tangent to the rect's straight edges (the long flat parts
 * between curves) and gives the right dimensions. Pass the corner-pixel
 * AABB if both inputs come from the same extreme-pixel detection, or pass
 * a separately measured flood-fill AABB for accuracy.
 *
 * - Rotation comes from the average of the two long side edges (left &
 *   right). The short edges are noisier when the rect has rounded corners.
 * - Width/height are back-solved from the AABB and rotation angle:
 *     AABB_w = W·|cosθ| + H·|sinθ|
 *     AABB_h = W·|sinθ| + H·|cosθ|
 *   Closed-form inversion uses cos(2θ) which stays positive for |θ| < 45°.
 * - Corner radius is estimated from the average Euclidean distance between
 *   each detected corner-extreme pixel and the rect's geometric corner. For
 *   a rounded rect with radius r, the diagonal inset from the geometric
 *   corner to the curve's tangent point at 45° is `r·(√2 − 1)` ≈ 0.414·r,
 *   so `r = inset / (√2 − 1)`. Averaged across 4 corners to dampen noise.
 */
export function detectScreenRect(
  corners: { tl: Corner; tr: Corner; bl: Corner; br: Corner },
  aabb: AABB,
  imgW: number,
  imgH: number,
): ScreenRectCSS {
  const { tl, tr, bl, br } = corners;

  // Side-edge angle, CSS-CW-positive:
  //   - axis-aligned: TL.x === BL.x → numerator 0 → angle 0
  //   - CW (top tilts right): BL is to the LEFT of TL → numerator (TL.x - BL.x) > 0 → positive
  //   - CCW (top tilts left): BL is to the RIGHT of TL → numerator < 0 → negative
  const leftAngle = Math.atan2(tl.x - bl.x, bl.y - tl.y);
  const rightAngle = Math.atan2(tr.x - br.x, br.y - tr.y);
  const angleRad = (leftAngle + rightAngle) / 2;
  const angleDeg = (angleRad * 180) / Math.PI;

  const aabbW = aabb.maxX - aabb.minX;
  const aabbH = aabb.maxY - aabb.minY;
  const cx = (aabb.minX + aabb.maxX) / 2;
  const cy = (aabb.minY + aabb.maxY) / 2;

  // Use absolute values: AABB equations are sign-independent (a rect
  // tilted ±θ has the same axis-aligned bounding box).
  const absC = Math.abs(Math.cos(angleRad));
  const absS = Math.abs(Math.sin(angleRad));
  const det = absC * absC - absS * absS; // = cos(2θ), positive for |θ| < 45°
  const W = (aabbW * absC - aabbH * absS) / det;
  const H = (aabbH * absC - aabbW * absS) / det;

  const leftPct = ((cx - W / 2) / imgW) * 100;
  const topPct = ((cy - H / 2) / imgH) * 100;
  const widthPct = (W / imgW) * 100;
  const heightPct = (H / imgH) * 100;

  // Compute the rect's geometric corners after applying the same CSS rotate
  // we'll emit. The detected corner-extreme pixels sit on the rounded
  // curves, INSIDE these geometric corners; the average diagonal inset
  // tells us the corner radius.
  const geom = rectCornersAfterCSSRotate(
    { leftPct, topPct, widthPct, heightPct, rotateDeg: angleDeg },
    imgW,
    imgH,
  );
  const insetMean =
    (Math.hypot(tl.x - geom.tl.x, tl.y - geom.tl.y) +
      Math.hypot(tr.x - geom.tr.x, tr.y - geom.tr.y) +
      Math.hypot(bl.x - geom.bl.x, bl.y - geom.bl.y) +
      Math.hypot(br.x - geom.br.x, br.y - geom.br.y)) /
    4;
  const r = insetMean / (Math.SQRT2 - 1);

  return {
    leftPct,
    topPct,
    widthPct,
    heightPct,
    rotateDeg: angleDeg,
    borderRadiusXPct: (r / W) * 100,
    borderRadiusYPct: (r / H) * 100,
  };
}

/**
 * Convenience helper: compute the AABB of an array of corners. Use only
 * when corners are GEOMETRIC corners (sharp rect); for rounded-corner
 * detections, prefer measuring the AABB from the flooded source region.
 */
export function aabbOfCorners(corners: { tl: Corner; tr: Corner; bl: Corner; br: Corner }): AABB {
  const xs = [corners.tl.x, corners.tr.x, corners.bl.x, corners.br.x];
  const ys = [corners.tl.y, corners.tr.y, corners.bl.y, corners.br.y];
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/**
 * Apply `transform: rotate(rotateDeg)` to the rect's 4 corners around its
 * center, returning the rotated corner positions in image coordinates.
 *
 * CSS rotate matrix (screen y-down, CW-positive):
 *   x' = x·cosθ − y·sinθ
 *   y' = x·sinθ + y·cosθ
 *
 * Used by tests to round-trip `detectScreenRect`'s output and assert it
 * reconstructs the input AABB; pins the rotation matrix so a sign error in
 * either function would surface immediately.
 */
export function rectCornersAfterCSSRotate(
  rect: Pick<ScreenRectCSS, "leftPct" | "topPct" | "widthPct" | "heightPct" | "rotateDeg">,
  imgW: number,
  imgH: number,
): { tl: Corner; tr: Corner; bl: Corner; br: Corner } {
  const left = (rect.leftPct / 100) * imgW;
  const top = (rect.topPct / 100) * imgH;
  const w = (rect.widthPct / 100) * imgW;
  const h = (rect.heightPct / 100) * imgH;
  const cx = left + w / 2;
  const cy = top + h / 2;
  const rad = (rect.rotateDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const rotate = (lx: number, ly: number): Corner => ({
    x: cx + lx * c - ly * s,
    y: cy + lx * s + ly * c,
  });
  return {
    tl: rotate(-w / 2, -h / 2),
    tr: rotate(+w / 2, -h / 2),
    bl: rotate(-w / 2, +h / 2),
    br: rotate(+w / 2, +h / 2),
  };
}
