// What sits behind the devices: a big disc behind the phone plus small floating
// pieces. Two looks — flat Bauhaus shapes (Dessau) or a round painted canvas with
// paint swatches (Impasto). Both expose the same surface to the timeline:
//   pieces  — objects with `s` (scale 0..1) tweened in and out
//   endHide — pieces that leave before the end card (they would crowd the type)
//   update(t, shown, swapState, S) — draw the disc for time t
import * as THREE from "three";
import { panel } from "./devices.js";
import { screenMaterial, screenAt, applyScreen } from "./screen.js";

const DISC_Z = -0.95;
// Shared layout: [x, y, z]; the first, second, fifth and sixth sit where the end-card type goes.
const SPOTS = [
  [0.25, 0.05, -1.45], [1.3, 0.92, -1.1], [-1.35, -0.72, -1.2],
  [1.2, -0.9, -1.6], [-1.08, 0.98, -0.6], [-1.5, 0.22, -1.8],
];
const END_HIDE = [0, 1, 4, 5];

function place(scene, mesh, spot, rot, spin) {
  mesh.position.set(...spot);
  scene.add(mesh);
  return { mesh, rot, spin, s: 0 };
}

function spinAll(pieces, t) {
  for (const p of pieces) {
    p.mesh.scale.setScalar(Math.max(0.0001, p.s));
    p.mesh.rotation.z = p.rot + p.spin * t;
  }
}

function discTransform(disc, S, pulse) {
  disc.scale.setScalar(Math.max(0.0001, S.disc * S.discS * (1 + pulse)));
  disc.position.set(S.discX, S.discY, DISC_Z);
}

export function bauhausBackdrop(scene, pack) {
  const flat = (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, side: THREE.DoubleSide });
  const P = pack.palette;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 96), flat(pack.disc[0]));
  scene.add(disc);
  const pieces = [
    [new THREE.PlaneGeometry(0.018, 4.4), P.black, 0.62, 0.018],
    [new THREE.CircleGeometry(0.2, 64), P.vermilion, 0, 0],
    [new THREE.PlaneGeometry(0.16, 0.95), P.mustard, -0.32, 0.03],
    [new THREE.CircleGeometry(0.44, 64, 0, Math.PI), P.cobalt, 0.4, 0.06],
    [new THREE.CircleGeometry(0.07, 48), P.black, 0, 0],
    [new THREE.RingGeometry(0.27, 0.3, 72), P.black, 0, 0],
  ].map(([geo, color, rot, spin], i) => place(scene, new THREE.Mesh(geo, flat(color)), SPOTS[i], rot, spin));

  return {
    pieces,
    endHide: END_HIDE.map((i) => pieces[i]),
    update(t, shown, ps, S) {
      // Hard colour switch (a blend of two primaries turns muddy), masked by a pulse.
      disc.material.color.set(t > 8.5 ? pack.discEnd : pack.disc[shown]);
      discTransform(disc, S, ps.swap && t < 8.5 ? Math.sin(ps.p * Math.PI) * 0.09 : 0);
      spinAll(pieces, t);
    },
  };
}

export function paintingBackdrop(scene, pack, textures, ease) {
  // Round canvas: a 16:9 desktop painting cropped to a circle, swapping with the phone.
  const mat = screenMaterial(1);
  mat.uniforms.uvRect.value.set((1 - 9 / 16) / 2, 0, 9 / 16, 1);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 96), mat);
  scene.add(disc);
  const pair = pack.pair;
  const last = pack.tour[pack.tour.length - 1];
  const discSwaps = [
    ...pack.tour.map((s) => ({ ...s, from: pair[s.from], to: pair[s.to] })),
    { t: 7.6, dur: 0.62, from: pair[last.to], to: pack.discEnd, mode: 3, dir: [-1, 0.4] },
  ];

  // Paint swatches: close crops of other designs, floating at depth.
  const crop = (idx, ox, oy, size) => {
    const tex = textures.desk[idx].clone();
    tex.repeat.set(size * (9 / 16), size);
    tex.offset.set(ox, oy);
    tex.needsUpdate = true;
    return new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide });
  };
  const pieces = [
    [new THREE.CircleGeometry(0.14, 64), crop(6, 0.2, 0.6, 0.18), 0, 0.03],
    [new THREE.CircleGeometry(0.22, 64), crop(1, 0.3, 0.4, 0.25), 0, 0.05],
    [panel(0.3, 0.9, 0.04), crop(9, 0.1, 0.05, 0.6), -0.32, 0.03],
    [new THREE.CircleGeometry(0.46, 64), crop(2, 0.5, 0.2, 0.35), 0.4, 0.04],
    [new THREE.CircleGeometry(0.08, 48), crop(3, 0.6, 0.5, 0.12), 0, 0],
    [new THREE.RingGeometry(0.27, 0.3, 72), new THREE.MeshBasicMaterial({ color: "#2a2622", toneMapped: false }), 0, 0],
  ].map(([geo, m, rot, spin], i) => place(scene, new THREE.Mesh(geo, m), SPOTS[i], rot, spin));

  return {
    pieces,
    endHide: END_HIDE.map((i) => pieces[i]),
    update(t, shown, ps, S) {
      applyScreen(mat, screenAt(t, pair[pack.tour[0].from], discSwaps, ease), textures.desk);
      discTransform(disc, S, ps.swap && t < 8.5 ? Math.sin(ps.p * Math.PI) * 0.05 : 0);
      spinAll(pieces, t);
    },
  };
}
