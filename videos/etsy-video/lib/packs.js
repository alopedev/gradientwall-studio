// Per-pack data for the listing video. Design indices are 0-based into `ids`.
// Timings are shared: act 1 (tour) swaps on the phone alone, act 2 (duo) swaps
// phone and monitor together under the end card.

const TOUR_T = [2.0, 3.05, 4.1, 5.15, 6.2];
const DUO_T = [9.05, 9.45, 9.85, 10.25, 10.65];
const chain = (times, seq, dur, looks) =>
  times.map((t, i) => ({ t, dur, from: seq[i], to: seq[i + 1], ...looks[i] }));

const BAUHAUS = { cobalt: "#1e50c9", vermilion: "#e54128", black: "#161616", mustard: "#f9b522" };

export const PACKS = {
  dessau: {
    ids: ["01", "02", "03", "04", "05", "06"],
    names: ["Kreise", "Rot", "Schwarz", "Gelb", "Sonne", "Halbkreise"],
    darkClock: [3],
    backdrop: "bauhaus",
    // Disc colour behind the phone for each design on screen; `discEnd` once the end card is up.
    disc: [BAUHAUS.mustard, BAUHAUS.cobalt, BAUHAUS.vermilion, BAUHAUS.cobalt, BAUHAUS.black, BAUHAUS.vermilion],
    discEnd: BAUHAUS.vermilion,
    palette: BAUHAUS,
    tour: chain(TOUR_T, [0, 1, 2, 3, 4, 5], 0.62, [
      { mode: 0, origin: [0.0, -0.35], accent: BAUHAUS.mustard },
      { mode: 1, dir: [0.55, 1.0], accent: BAUHAUS.cobalt },
      { mode: 2, origin: [0.0, 0.1], accent: BAUHAUS.vermilion },
      { mode: 0, origin: [1.0, 1.0], accent: BAUHAUS.black },
      { mode: 1, dir: [-1.0, 0.25], accent: BAUHAUS.vermilion },
    ]),
    duo: chain(DUO_T, [5, 1, 2, 3, 4, 0], 0.34, [
      { mode: 0, origin: [0, 0], accent: BAUHAUS.mustard },
      { mode: 1, dir: [1, 0.3], accent: BAUHAUS.cobalt },
      { mode: 0, origin: [-1, 1], accent: BAUHAUS.vermilion },
      { mode: 1, dir: [-0.4, 1], accent: BAUHAUS.black },
      { mode: 0, origin: [0, -1], accent: BAUHAUS.vermilion },
    ]),
    title: "Dessau",
    sub: "12 Bauhaus <em>modern</em> wallpapers",
    chips: ["6 × iPhone", "6 × Mac · PC", "4K + 5K"],
  },

  impasto: {
    ids: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"],
    names: ["Sorbet", "Ember", "Linen", "Nebula", "Lilac", "Gilded", "Blush", "Lagoon", "Lavender", "Jade"],
    darkClock: [0, 2, 4, 6, 8],
    backdrop: "painting",
    // The round canvas behind the phone shows a contrasting design (light ↔ dark).
    pair: [7, 4, 3, 8, 1, 6, 5, 2, 9, 1],
    discEnd: 5,
    // Act 1 shows six designs, act 2 the other four, so all ten appear.
    tour: chain(TOUR_T, [0, 7, 2, 5, 9, 3], 0.62, [
      { mode: 3, dir: [1, 0.35] },
      { mode: 3, dir: [-0.3, -1] },
      { mode: 3, dir: [-1, 0.2] },
      { mode: 3, dir: [0.6, 1] },
      { mode: 3, dir: [1, -0.4] },
    ]),
    duo: chain(DUO_T, [3, 1, 4, 6, 8, 0], 0.34, [
      { mode: 3, dir: [1, 0.2] },
      { mode: 3, dir: [0.2, -1] },
      { mode: 3, dir: [-1, 0.3] },
      { mode: 3, dir: [0.4, 1] },
      { mode: 3, dir: [1, -0.2] },
    ]),
    title: "Impasto",
    sub: "20 acrylic <em>paint</em> wallpapers",
    chips: ["10 × iPhone", "10 × Mac · PC", "4K + 5K"],
  },
};
