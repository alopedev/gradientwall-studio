/**
 * The landing pages: one per search the Studio answers ("iphone gradient
 * wallpaper", "4k gradient wallpaper", one per style). Each is the home's hero
 * with its own headline and starting look, then a short guide written for
 * that search only, then the Studio and the packs. Pure content with no
 * imports; `buildLandingPage` in `pages.ts` turns it into SEO data for the
 * prerender and `PageMeta`.
 *
 * Kept to a handful on purpose: many near-identical pages read as doorway
 * pages to Google. Add one only when it has something of its own to say.
 */

/** Where the Studio starts on a landing; fields left out keep the visitor's own. */
export interface LandingLook {
  device?: "mobile" | "tablet" | "desktop";
  style?: "mesh" | "liquid" | "aurora";
  grain?: number;
}

export interface LandingStep {
  text: string;
  note?: string;
}

export interface LandingGuide {
  heading: string;
  /** Plain paragraphs. */
  body: string[];
  /** Numbered steps, drawn large. */
  steps?: LandingStep[];
  /** Screen sizes, folded under `sizesLabel`. Each row: [model, "W × H"]. */
  sizes?: [string, string][];
  sizesLabel?: string;
}

export interface Landing {
  slug: string;
  /** `<title>` without the brand, ≤ 50 characters so the suffix still fits. */
  title: string;
  description: string;
  /** Visible headline, lowercase like the home's. */
  h1: string;
  subtitle: string;
  look: LandingLook;
  guides: LandingGuide[];
}

/** Screen sizes from apple.com/iphone/compare (checked 2026-10-21). */
export const IPHONE_SCREENS: [string, string][] = [
  ["iPhone 17 Pro Max · 16 Pro Max", "1320 × 2868"],
  ["iPhone Air", "1260 × 2736"],
  ["iPhone 17 · 17 Pro · 16 Pro", "1206 × 2622"],
  ["iPhone 16 Plus · 15 Plus · 15 Pro Max", "1290 × 2796"],
  ["iPhone 16 · 15 · 15 Pro", "1179 × 2556"],
  ["iPhone 16e", "1170 × 2532"],
];

/** Standard desktop resolutions (names of the formats, not of products). */
export const DESKTOP_SCREENS: [string, string][] = [
  ["5K", "5120 × 2880"],
  ["4K UHD", "3840 × 2160"],
  ["QHD (1440p)", "2560 × 1440"],
  ["Full HD (1080p)", "1920 × 1080"],
];

const IPHONE_STEPS: LandingStep[] = [
  { text: "Tap Download, then Save Image.", note: "It goes straight to Photos." },
  { text: "In Photos, tap Share › Use as Wallpaper.", note: "Done." },
];

const SET_IT: LandingGuide = {
  heading: "set it in two steps.",
  body: [],
  steps: [
    { text: "Shuffle until you like one, then tap Download." },
    {
      text: "Set it as your wallpaper.",
      note: "iPhone: Save Image, then Photos › Share › Use as Wallpaper. Mac: right-click it › Set Desktop Picture.",
    },
  ],
};

export const LANDINGS: Landing[] = [
  {
    slug: "iphone-gradient-wallpapers",
    title: "Free iPhone Gradient Wallpapers",
    description:
      "Make a gradient wallpaper for your iPhone in seconds: shuffle, tweak the colours, save it to Photos. Free, sharp on every iPhone, no account.",
    h1: "iphone gradient wallpapers, free.",
    subtitle: "shuffle until it's yours, then download it below.",
    look: { device: "mobile" },
    guides: [
      { heading: "set it in two steps.", body: [], steps: IPHONE_STEPS },
      {
        heading: "fits every iphone.",
        body: ["One 1440 × 3200 file, sharp on iPhone 15, 16, 17 and Air."],
        sizes: IPHONE_SCREENS,
        sizesLabel: "See every screen size",
      },
    ],
  },
  {
    slug: "4k-gradient-wallpapers",
    title: "Free 4K Gradient Wallpapers for Desktop",
    description:
      "Make a 4K gradient wallpaper for your desktop: shuffle, change the colours and download it at 5120 × 2880, sharp on 4K and 5K screens. Free.",
    h1: "4k gradient wallpapers for your desktop.",
    subtitle: "made at 5120 × 2880, sharp on any 4K or 5K screen.",
    look: { device: "desktop" },
    guides: [
      {
        heading: "bigger than 4k, on purpose.",
        body: [
          "The desktop download is 5120 × 2880, the size of a 5K display. On a 4K screen your system scales it down, so edges stay smooth and the grain stays fine.",
        ],
        sizes: DESKTOP_SCREENS,
        sizesLabel: "Common desktop sizes",
      },
      {
        heading: "set it in two steps.",
        body: [],
        steps: [
          { text: "Pick Desktop in the Studio, then Download." },
          {
            text: "Mac: right-click the file › Set Desktop Picture.",
            note: "Windows: right-click it › Set as desktop background.",
          },
        ],
      },
    ],
  },
  {
    slug: "mesh-gradient-wallpapers",
    title: "Free Mesh Gradient Wallpapers",
    description:
      "Make a mesh gradient wallpaper: soft blends of four colours, shuffled until one feels right. Download it for phone or desktop, free.",
    h1: "mesh gradient wallpapers, free.",
    subtitle: "four colours, blended softly. shuffle for a new mix.",
    look: { style: "mesh" },
    guides: [
      {
        heading: "what makes a mesh gradient.",
        body: [
          "A mesh gradient blends colours from several points at once instead of along one line, so the colour pools and drifts like paint. Each shuffle moves those points and picks a new palette.",
        ],
      },
      SET_IT,
    ],
  },
  {
    slug: "aurora-gradient-wallpapers",
    title: "Free Aurora Gradient Wallpapers",
    description:
      "Make an aurora gradient wallpaper: bands of light that glow across a dark sky. Shuffle, change the colours and download it free.",
    h1: "aurora gradient wallpapers, free.",
    subtitle: "bands of light across the screen. shuffle for new ones.",
    look: { style: "aurora" },
    guides: [
      {
        heading: "light, not paint.",
        body: [
          "Aurora draws soft ribbons of colour that glow against the background, like the northern lights. Darker palettes make the bands stand out; lighter ones read as a haze.",
        ],
      },
      SET_IT,
    ],
  },
  {
    slug: "grainy-gradient-wallpapers",
    title: "Free Grainy Gradient Wallpapers",
    description:
      "Make a grainy gradient wallpaper: smooth colour with a fine film grain that hides banding. Set the grain yourself and download it free.",
    h1: "grainy gradient wallpapers, free.",
    subtitle: "smooth colour with a fine film grain.",
    look: { grain: 85 },
    guides: [
      {
        heading: "why the grain.",
        body: [
          "A smooth gradient on a screen can show steps of colour, called banding. A fine grain breaks those steps up, so the blend looks continuous, and it gives the wallpaper the feel of print. Turn it up or down with the Grain slider.",
        ],
      },
      SET_IT,
    ],
  },
];

export function landingPath(slug: string): string {
  return `/${slug}/`;
}

export function getLanding(slug: string): Landing | undefined {
  return LANDINGS.find((l) => l.slug === slug);
}
