// Procedural device models for the listing video: an iPhone 16 Pro-style phone
// and a Studio Display-style monitor. Units: the phone screen is 0.70 wide, so
// 1 unit ≈ 92 mm. Proportions follow the real devices; nothing is loaded.
import * as THREE from "three";

export function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}

// Flat rounded panel with 0..1 UVs across its bounding box (screens take the wallpaper this way).
export function panel(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 32);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return g;
}

// Slab of overall size w × h × d whose sides are rounded by the bevel (the soft
// band you see around a phone or a display enclosure).
function slab(w, h, r, d, bevel) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - 2 * bevel, h - 2 * bevel, Math.max(0.002, r - bevel)), {
    depth: d - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 10, curveSegments: 40,
  });
  g.translate(0, 0, -(d - 2 * bevel) / 2);
  return g;
}

const mat = {
  titanium: new THREE.MeshPhysicalMaterial({ color: "#3b3936", metalness: 1, roughness: 0.34, clearcoat: 0.25, clearcoatRoughness: 0.3 }),
  backGlass: new THREE.MeshPhysicalMaterial({ color: "#2d2c2a", metalness: 0.15, roughness: 0.62 }),
  blackGlass: new THREE.MeshPhysicalMaterial({ color: "#020202", metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.3 }),
  lens: new THREE.MeshPhysicalMaterial({ color: "#07080a", metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 }),
  aluminium: new THREE.MeshPhysicalMaterial({ color: "#e4e2de", metalness: 1, roughness: 0.3 }),
  flash: new THREE.MeshPhysicalMaterial({ color: "#d9d2c2", metalness: 0, roughness: 0.25 }),
  ink: new THREE.MeshBasicMaterial({ color: "#050505" }),
};

function castAll(group) {
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return group;
}

// iPhone: 0.70 × 1.521 screen (the 1320 × 2868 wallpaper), 1.2 mm-equivalent bezel.
export const PHONE = { sw: 0.7, sh: 1.521, w: 0.748, h: 1.569, d: 0.088 };

export function buildPhone(screenMaterial, clockMaterial) {
  const { sw, sh, w, h, d } = PHONE;
  const front = d / 2;
  const g = new THREE.Group();

  g.add(new THREE.Mesh(slab(w, h, 0.118, d, 0.016), mat.titanium));

  const glass = new THREE.Mesh(panel(w - 0.024, h - 0.024, 0.106), mat.blackGlass);
  glass.position.z = front + 0.0004;
  const screen = new THREE.Mesh(panel(sw, sh, 0.096), screenMaterial);
  screen.position.z = front + 0.0009;
  const island = new THREE.Mesh(panel(0.184, 0.054, 0.027), mat.ink);
  island.position.set(0, sh / 2 - 0.05, front + 0.0014);
  const clock = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.15), clockMaterial);
  clock.position.set(0, sh / 2 - 0.25, front + 0.0012);
  g.add(glass, screen, island, clock);

  // Side buttons: action + volume on the left, side button + Camera Control on the right.
  const button = (x, y, len, m = mat.titanium) => {
    const b = new THREE.Mesh(slab(0.02, len, 0.009, 0.03, 0.006), m);
    b.rotation.y = Math.PI / 2;
    b.position.set(x, y, 0);
    g.add(b);
  };
  const edge = w / 2 + 0.003;
  button(-edge, 0.5, 0.055);
  button(-edge, 0.36, 0.11);
  button(-edge, 0.22, 0.11);
  button(edge, 0.3, 0.16);
  button(edge, -0.2, 0.085, mat.lens);

  // Back: frosted glass, camera plateau top-left (seen from behind) with three lenses.
  const back = new THREE.Mesh(panel(w - 0.024, h - 0.024, 0.106), mat.backGlass);
  back.rotation.y = Math.PI;
  back.position.z = -front - 0.0004;
  g.add(back);
  const plateau = new THREE.Mesh(slab(0.33, 0.33, 0.075, 0.018, 0.006), mat.backGlass);
  const px = w / 2 - 0.2, py = h / 2 - 0.2;
  plateau.position.set(px, py, -front - 0.006);
  g.add(plateau);
  const lensAt = (dx, dy) => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.06, 0.02, 48), mat.titanium);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(px + dx, py + dy, -front - 0.022);
    const glassLens = new THREE.Mesh(new THREE.CircleGeometry(0.045, 48), mat.lens);
    glassLens.rotation.y = Math.PI;
    glassLens.position.set(px + dx, py + dy, -front - 0.0325);
    g.add(ring, glassLens);
  };
  lensAt(0.07, 0.072);
  lensAt(0.07, -0.072);
  lensAt(-0.07, 0);
  const flash = new THREE.Mesh(new THREE.CircleGeometry(0.018, 32), mat.flash);
  flash.rotation.y = Math.PI;
  flash.position.set(px - 0.075, py + 0.105, -front - 0.0156);
  g.add(flash);

  return { group: castAll(g), screen };
}

// Studio Display: 27", 16:9 panel 2.3 × 1.294, black glass front, tilt stand.
export const MONITOR = { sw: 2.3, sh: 1.294, w: 2.4, h: 1.395, d: 0.1 };

export function buildMonitor(screenMaterial) {
  const { sw, sh, w, h, d } = MONITOR;
  const g = new THREE.Group();
  g.add(new THREE.Mesh(slab(w, h, 0.045, d, 0.012), mat.aluminium));
  const glass = new THREE.Mesh(panel(w - 0.022, h - 0.022, 0.035), mat.blackGlass);
  glass.position.z = d / 2 + 0.0004;
  const screen = new THREE.Mesh(panel(sw, sh, 0.006), screenMaterial);
  screen.position.z = d / 2 + 0.0009;
  g.add(glass, screen);

  // Stand: one bent aluminium arm from the back of the display down to the foot.
  const footY = -h / 2 - 0.42;
  const arm = new THREE.Mesh(slab(0.42, 0.98, 0.02, 0.034, 0.008), mat.aluminium);
  arm.position.set(0, -h / 2 + 0.03, -d / 2 - 0.13);
  arm.rotation.x = 0.26;
  const foot = new THREE.Mesh(slab(0.56, 0.64, 0.08, 0.016, 0.005), mat.aluminium);
  foot.rotation.x = -Math.PI / 2;
  foot.position.set(0, footY, -d / 2 - 0.18);
  g.add(arm, foot);
  return { group: castAll(g), screen };
}
