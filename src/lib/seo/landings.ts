/**
 * The landing pages: one per search the Studio answers ("iphone gradient
 * wallpaper", "4k gradient wallpaper", one per style). Each is the home's hero
 * with its own headline and starting look, then a short guide written for
 * that search only, then the Studio and the packs. Pure content with no
 * imports; `buildLandingPage` in `pages.ts` turns it into SEO data for the
 * prerender and `PageMeta`.
 *
 * Kept few on purpose: many near-identical pages read as doorway pages to
 * Google. Add one only when it has something of its own to say (searches
 * checked in /mnt/project-files/web-plan/seo-2026-10-23/tanda-1/).
 */

/** Where the Studio starts on a landing; fields left out keep the visitor's own. */
export interface LandingLook {
  device?: "mobile" | "tablet" | "desktop";
  style?: "mesh" | "liquid" | "aurora";
  grain?: number;
  /** Four hex colours, for a landing about a colour. */
  colors?: [string, string, string, string];
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

/** The footer groups the wallpaper pages so the column stays short and says what they are. */
export const FOOTER_GROUPS = [
  { id: "device", title: "By device" },
  { id: "style", title: "By style" },
  { id: "colour", title: "By colour" },
] as const;

export type FooterGroup = (typeof FOOTER_GROUPS)[number]["id"];

export interface Landing {
  slug: string;
  /** `<title>` without the brand, ≤ 50 characters so the suffix still fits. */
  title: string;
  description: string;
  /** Visible headline, lowercase like the home's. */
  h1: string;
  subtitle: string;
  /**
   * Its link text in the footer. A wallpaper page's is short ("Mesh"), since
   * it sits under its group's heading ("By style"); a guide's stands alone.
   */
  footerLabel: string;
  /** Where a wallpaper page sits in the footer's "Free gradient wallpapers" column. */
  footerGroup?: FooterGroup;
  look: LandingLook;
  guides: LandingGuide[];
  /** A how-to page: listed under Help in the footer instead of with the wallpapers. */
  guide?: true;
}

/** Screen sizes from apple.com/uk/iphone/compare and each model's specs (checked 2026-10-23). */
export const IPHONE_SCREENS: [string, string][] = [
  ["iPhone 18 Pro Max · 17 Pro Max · 16 Pro Max", "1320 × 2868"],
  ["iPhone Air", "1260 × 2736"],
  ["iPhone 18 Pro · 17 Pro · 17 · 16 Pro", "1206 × 2622"],
  ["iPhone 16 Plus · 15 Plus · 15 Pro Max", "1290 × 2796"],
  ["iPhone 16 · 15 · 15 Pro", "1179 × 2556"],
  ["iPhone 17e · 16e", "1170 × 2532"],
];

/** Built-in displays from apple.com/uk MacBook specs (checked 2026-10-23). */
export const MACBOOK_SCREENS: [string, string][] = [
  ['MacBook Pro 16"', "3456 × 2234"],
  ['MacBook Pro 14"', "3024 × 1964"],
  ['MacBook Air 15"', "2880 × 1864"],
  ['MacBook Air 13"', "2560 × 1664"],
  ['MacBook Air 13" (M1) · MacBook Pro 13"', "2560 × 1600"],
  ["MacBook Neo", "2408 × 1506"],
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
    footerLabel: "iPhone",
    footerGroup: "device",
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
    footerLabel: "4K desktop",
    footerGroup: "device",
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
    footerLabel: "Mesh",
    footerGroup: "style",
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
    footerLabel: "Aurora",
    footerGroup: "style",
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
    footerLabel: "Grainy",
    footerGroup: "style",
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
  {
    slug: "aura-gradient-wallpapers",
    title: "Aura Gradient Wallpaper Maker, Free",
    description:
      "Make an aura gradient wallpaper: soft colour that glows from the middle, with a fine grain. Pick your colours and download it for iPhone or Mac, free.",
    h1: "aura gradient wallpapers, made by you.",
    subtitle: "colour with no edges, glowing from the middle.",
    footerLabel: "Aura",
    footerGroup: "style",
    look: { style: "mesh", grain: 55 },
    guides: [
      {
        heading: "what an aura gradient is.",
        body: [
          "An aura gradient is colour with no edges: two or three hues that melt into each other and glow from the centre, like a light seen through frosted glass.",
          "Colours that sit close on the wheel, such as pink into peach or blue into lilac, give a calm aura. Opposites, like orange against violet, glow harder.",
          "A little grain stops the soft blend from breaking into visible bands of colour, which is why most aura wallpapers have it.",
        ],
      },
      SET_IT,
    ],
  },
  {
    slug: "liquid-gradient-wallpapers",
    title: "Free Liquid Gradient Wallpapers",
    description:
      "Make a liquid gradient wallpaper: colour that swirls and folds like poured paint. Shuffle until it flows right, then download it in 4K or for iPhone.",
    h1: "liquid gradient wallpapers, free.",
    subtitle: "colour that swirls like poured paint.",
    footerLabel: "Liquid",
    footerGroup: "style",
    look: { style: "liquid" },
    guides: [
      {
        heading: "how liquid differs.",
        body: [
          "Mesh blends colour from points; Liquid bends it. The bands twist and fold over each other, so the wallpaper looks poured rather than painted, and every shuffle pours it a new way.",
          "It's at its best with three or four colours of different brightness: the light ones read as highlights on the folds, the dark ones as depth.",
        ],
      },
      SET_IT,
    ],
  },
  {
    slug: "dark-gradient-wallpapers",
    title: "Free Dark Gradient Wallpapers",
    description:
      "Make a dark gradient wallpaper: near-black colour with a soft glow, grained so it never bands. For iPhone OLED screens and 4K desktops, free.",
    h1: "dark gradient wallpapers, free.",
    subtitle: "near-black, with just enough colour.",
    footerLabel: "Dark",
    footerGroup: "colour",
    look: { grain: 70, colors: ["#05030f", "#120d2e", "#3b2a8a", "#8b5cf6"] },
    guides: [
      {
        heading: "dark, not flat black.",
        body: [
          "Dark gradients show banding more than any other kind: there are few shades between black and deep blue, so a smooth blend breaks into steps. Grain hides those steps, which is why this page starts with it turned up.",
          "On an iPhone with an OLED screen, pure black pixels are switched off. A wallpaper that is mostly near-black looks deep there, and keeps the screen calm at night.",
        ],
      },
      SET_IT,
    ],
  },
  {
    slug: "burgundy-gradient-wallpapers",
    title: "Burgundy Gradient Wallpapers, iPhone 18 Pro",
    description:
      "Make a burgundy gradient wallpaper to match the iPhone 18 Pro: deep wine reds, shuffled and tweaked until they suit you. Free, for phone and Mac.",
    h1: "burgundy gradient wallpapers.",
    subtitle: "deep wine reds, to match your phone or not.",
    footerLabel: "Burgundy",
    footerGroup: "colour",
    look: { device: "mobile", colors: ["#1a0508", "#4a0e1c", "#7b1e34", "#c2566b"] },
    guides: [
      {
        heading: "a red that goes dark.",
        body: [
          "Burgundy is red pulled towards brown and purple, the colour of wine. It's one of the iPhone 18 Pro finishes, and it works as a wallpaper because it stays rich when it gets dark.",
          "Keep the lightest colour soft, a dusty rose rather than a bright pink, and the gradient will look like the phone's finish instead of a warning light.",
          "These are gradients made in the Studio, not Apple's official wallpaper.",
        ],
      },
      { heading: "set it in two steps.", body: [], steps: IPHONE_STEPS },
    ],
  },
  {
    slug: "orange-gradient-wallpapers",
    title: "Orange Gradient Wallpapers, Cosmic Orange Too",
    description:
      "Make an orange gradient wallpaper, from soft apricot to the deep Cosmic Orange of the iPhone 17 Pro. Shuffle, tweak, download it free for any screen.",
    h1: "orange gradient wallpapers.",
    subtitle: "from soft apricot to cosmic orange.",
    footerLabel: "Orange",
    footerGroup: "colour",
    look: { device: "mobile", colors: ["#1a0a03", "#7a2e0b", "#f26a1b", "#ffb36b"] },
    guides: [
      {
        heading: "warm, but not loud.",
        body: [
          "Orange is the loudest colour on a screen, so the wallpapers here start dark: a burnt brown base with the bright orange kept to one glow. That's the trick behind Cosmic Orange, the iPhone 17 Pro finish, which reads as copper in shade and orange in light.",
          "For a softer take, lift the base to apricot or peach. Next to navy or teal, orange looks brighter still, because they sit opposite it on the colour wheel.",
          "These are gradients made in the Studio, not Apple's official wallpaper.",
        ],
      },
      { heading: "set it in two steps.", body: [], steps: IPHONE_STEPS },
    ],
  },
  {
    slug: "macbook-gradient-wallpapers",
    title: "Free Gradient Wallpapers for MacBook",
    description:
      "Make a gradient wallpaper for your MacBook: made at 5K, so it stays sharp on the Air, Pro and Neo. Shuffle, pick colours, set it in two clicks.",
    h1: "gradient wallpapers for your macbook.",
    subtitle: "made at 5k, sharp on every macbook screen.",
    footerLabel: "MacBook",
    footerGroup: "device",
    look: { device: "desktop" },
    guides: [
      {
        heading: "sharp on every macbook.",
        body: [
          "The download is 5120 × 2880, wider and taller than any MacBook screen. macOS fills the display and trims a sliver from the sides, because MacBook screens are a little taller in shape than 16:9.",
        ],
        sizes: MACBOOK_SCREENS,
        sizesLabel: "Every MacBook screen size",
      },
      {
        heading: "set it in two clicks.",
        body: [],
        steps: [
          { text: "Pick Desktop in the Studio, then Download." },
          {
            text: "Right-click the file › Set Desktop Picture.",
            note: "Or System Settings › Wallpaper › Add Photo.",
          },
        ],
      },
    ],
  },
  {
    slug: "matching-iphone-mac-wallpapers",
    title: "Matching Wallpapers for iPhone and Mac",
    description:
      "Make one gradient wallpaper and download it for your iPhone, iPad and Mac, each at its own size. A matching set in under a minute, free.",
    h1: "matching wallpapers for iphone and mac.",
    subtitle: "one look, every screen, each at its own size.",
    footerLabel: "Matching sets",
    footerGroup: "device",
    look: { device: "mobile" },
    guides: [
      {
        heading: "one look, three sizes.",
        body: [
          "Most matching sets are one image cropped three ways, so the phone gets a narrow slice of the desktop picture. The Studio redraws the same colours and shapes for each screen instead, so nothing important falls off the edge.",
        ],
      },
      {
        heading: "make the set.",
        body: [],
        steps: [
          { text: "Make a wallpaper you like on the phone, then Download." },
          {
            text: "Switch the device to Desktop and Download again.",
            note: "Same colours, redrawn for the wide screen. Tablet works too.",
          },
        ],
      },
    ],
  },
  {
    slug: "blue-gradient-wallpapers",
    title: "Free Blue Gradient Wallpapers",
    description:
      "Make a blue gradient wallpaper, from pale sky to deep navy. Shuffle, tweak the colours and download it for iPhone or a 4K desktop, free.",
    h1: "blue gradient wallpapers, free.",
    subtitle: "from pale sky to deep navy.",
    footerLabel: "Blue",
    footerGroup: "colour",
    look: { colors: ["#020b1f", "#0b3a75", "#2a7de1", "#9fd3ff"] },
    guides: [
      {
        heading: "blue, without the cold.",
        body: [
          "Blue sits well behind white app icons and text: dark enough for them to read, quiet enough not to fight them. Deep blues stay calm on the screen at night.",
          "Navy into teal feels deep, like water; sky into white feels light, like air. One warm colour, a little peach or gold, keeps a blue gradient from looking cold.",
        ],
      },
      SET_IT,
    ],
  },
  {
    slug: "purple-gradient-wallpapers",
    title: "Free Purple Gradient Wallpapers",
    description:
      "Make a purple gradient wallpaper: violet, lavender or deep plum, blended softly. Shuffle, change the colours and download it for iPhone or desktop, free.",
    h1: "purple gradient wallpapers, free.",
    subtitle: "violet, lavender and plum, blended softly.",
    footerLabel: "Purple",
    footerGroup: "colour",
    look: { colors: ["#12051f", "#3b0f6b", "#8b5cf6", "#e9d5ff"] },
    guides: [
      {
        heading: "between blue and red.",
        body: [
          "Purple mixes the calm of blue with the warmth of red, so where it leans sets the mood: towards blue it reads as violet and cool, towards red as plum or magenta.",
          "Lavender, a purple lifted with white, makes a soft, light wallpaper. Deep violet against near-black is the opposite: dark, with a glow that suits an OLED screen.",
        ],
      },
      SET_IT,
    ],
  },
  {
    slug: "pink-gradient-wallpapers",
    title: "Free Pink Gradient Wallpapers",
    description:
      "Make a pink gradient wallpaper, from blush and peach to hot pink. Shuffle, pick your colours and save it to your iPhone or Mac in seconds, free.",
    h1: "pink gradient wallpapers, free.",
    subtitle: "blush, peach and hot pink.",
    footerLabel: "Pink",
    footerGroup: "colour",
    look: { colors: ["#3d0a24", "#c2185b", "#f48fb1", "#ffe4ec"] },
    guides: [
      {
        heading: "soft or loud, by its neighbours.",
        body: [
          "Pink changes most with the colours beside it. Next to peach and cream it's soft, like blush. Next to orange or violet it gets loud, and starts to glow.",
          "Dark pinks, raspberry and wine, are easier on white icons than pale ones. If your Home Screen labels get lost, swap the palest colour for one a shade deeper.",
        ],
      },
      SET_IT,
    ],
  },
  {
    slug: "pastel-gradient-wallpapers",
    title: "Free Pastel Gradient Wallpapers",
    description:
      "Make a pastel gradient wallpaper: soft pink, mint, lilac and baby blue melting together. Shuffle until it feels calm, then download it free.",
    h1: "pastel gradient wallpapers, free.",
    subtitle: "soft colours, melting together.",
    footerLabel: "Pastel",
    footerGroup: "colour",
    look: { colors: ["#ffd6e0", "#c8e7ff", "#d9f2e6", "#e7d6ff"] },
    guides: [
      {
        heading: "light, but not washed out.",
        body: [
          "A pastel is a colour with a lot of white in it. Four of them together can turn to mush, so pick ones far apart on the colour wheel, like pink, mint and lilac, and let one be a shade stronger than the rest.",
          "White icon labels can get lost on a very light wallpaper. If yours do, swap the palest colour for one a little deeper.",
        ],
      },
      SET_IT,
    ],
  },
  {
    slug: "blur-gradient-wallpapers",
    title: "Blur Gradient Wallpapers, Free and in 4K",
    description:
      "Make a blur gradient wallpaper: soft colour with no edges, out of focus on purpose. Light, dark or black, for iPhone and 4K desktops, free.",
    h1: "blur gradient wallpapers, free.",
    subtitle: "soft focus, nothing sharp.",
    footerLabel: "Blur",
    footerGroup: "style",
    look: { grain: 15 },
    guides: [
      {
        heading: "nothing sharp behind your icons.",
        body: [
          "A blurred wallpaper has no edges for the eye to catch on, so it goes to the clock and the icons instead. It's why iOS offers to blur your photo on the Home Screen.",
          "This page starts with the grain turned down, so the colour reads as pure soft focus. If a dark blur shows faint steps of colour, turn the Grain slider up a little: it smooths them out.",
        ],
      },
      SET_IT,
    ],
  },
  {
    slug: "guides/iphone-wallpaper-size",
    title: "iPhone Wallpaper Size for Every Model (2026)",
    description:
      "The exact wallpaper size for every iPhone, from the 18 Pro Max to the 16e, in pixels and as a ratio. Checked against Apple's specs, October 2026.",
    h1: "iphone wallpaper sizes, every model.",
    subtitle: "pixels and ratio, checked against apple's specs.",
    footerLabel: "iPhone wallpaper sizes",
    guide: true,
    look: { device: "mobile" },
    guides: [
      {
        heading: "the sizes.",
        body: [
          "Each iPhone's screen in pixels, from Apple's own specs. A wallpaper this size or larger stays sharp.",
        ],
        sizes: IPHONE_SCREENS,
        sizesLabel: "Every iPhone screen size",
      },
      {
        heading: "the ratio, and why one file fits all.",
        body: [
          "Every iPhone since the X has a screen of roughly 19.5:9, about 2.17 pixels tall for every pixel wide. So one image a little larger than the biggest screen fits all of them, and iOS scales it down without cropping anything that matters.",
          "The Studio's phone download is 1440 × 3200, larger than the iPhone 18 Pro Max in both directions.",
          "Making your own in Canva or Photoshop? Start at 1320 × 2868 and keep the top third calm: that's where the clock sits on the Lock Screen.",
        ],
      },
    ],
  },
  {
    slug: "guides/iphone-gradient-wallpaper-not-working",
    title: "iPhone Gradient Wallpaper Not Working? Fixes",
    description:
      "Your iPhone's gradient or Color wallpaper turned black or dim? The fixes iPhone owners report, and a gradient wallpaper that can't break.",
    h1: "iphone gradient wallpaper not working?",
    subtitle: "the fixes, then a gradient that can't break.",
    footerLabel: "Gradient wallpaper fixes",
    guide: true,
    look: { device: "mobile" },
    guides: [
      {
        heading: "if it turned black or dim.",
        body: [
          "Since iOS 26, some iPhones show the Color wallpaper, or any wallpaper, as black or dimmed after an update. Try these in order.",
        ],
        steps: [
          { text: "Restart the iPhone.", note: "It clears most wallpaper glitches." },
          {
            text: "Check for a Focus.",
            note: "Touch and hold the Lock Screen. If it names a Focus, tap it and unlink it. Sleep Focus dims the Lock Screen on purpose.",
          },
          {
            text: "Turn off Reduce Transparency, then restart.",
            note: "Settings › Accessibility › Display & Text Size.",
          },
          {
            text: "Set the wallpaper again.",
            note: "Settings › Wallpaper › Add New Wallpaper › Color.",
          },
          { text: "Update iOS.", note: "Settings › General › Software Update." },
        ],
      },
      {
        heading: "or use a gradient that can't break.",
        body: [
          "iOS draws its Color wallpapers live, so a bug can turn them black. A gradient saved as a photo is just an image: it looks the same after every update. Make one in the Studio below.",
        ],
        steps: IPHONE_STEPS,
      },
      {
        heading: "turn the home screen gradient off.",
        body: [
          "If your Home Screen shows a plain gradient instead of your photo, it's set to a colour. Go to Settings › Wallpaper, tap Customize under the Home Screen, then choose the photo instead of a colour, or Blur to soften it.",
        ],
      },
    ],
  },
  {
    slug: "guides/macbook-wallpaper-size",
    title: "MacBook Wallpaper Size for Every Model (2026)",
    description:
      "The exact wallpaper size for every MacBook, from the Neo to the 16-inch Pro, in pixels and as a ratio. Checked against Apple's specs, October 2026.",
    h1: "macbook wallpaper sizes, every model.",
    subtitle: "pixels and ratio, from apple's own specs.",
    footerLabel: "MacBook wallpaper sizes",
    guide: true,
    look: { device: "desktop" },
    guides: [
      {
        heading: "the sizes.",
        body: [
          "Each MacBook's built-in screen in pixels, from Apple's own specs. A wallpaper this size or larger stays sharp.",
        ],
        sizes: MACBOOK_SCREENS,
        sizesLabel: "Every MacBook screen size",
      },
      {
        heading: "the ratio, and why 5k fits them all.",
        body: [
          "Recent MacBook Air and Pro screens are about 1.54 times as wide as they are tall, a little taller than 16:10 because of the strip around the camera notch. The Neo and the older 13-inch models are exactly 16:10.",
          "A 16:9 image, like the Studio's 5120 × 2880 download, is wider than all of them. macOS fills the screen and trims about 7% from each side, so keep anything important away from the left and right edges.",
          "Making your own in Canva or Photoshop? Use 3456 × 2234, the 16-inch Pro's screen, and it will be sharp on every MacBook.",
        ],
      },
      {
        heading: "set it in two clicks.",
        body: [],
        steps: [
          { text: "Right-click the image › Set Desktop Picture." },
          {
            text: "Or System Settings › Wallpaper › Add Photo.",
            note: "Choose Fill Screen so it covers the whole display.",
          },
        ],
      },
    ],
  },
];

export const GUIDES = LANDINGS.filter((l) => l.guide);

export function landingPath(slug: string): string {
  return `/${slug}/`;
}

export function getLanding(slug: string): Landing | undefined {
  return LANDINGS.find((l) => l.slug === slug);
}
