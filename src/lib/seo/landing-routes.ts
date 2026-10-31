import type { Landing } from "./landings";

export const FOOTER_GROUPS = [
  { id: "device", title: "By device" },
  { id: "style", title: "By style" },
  { id: "colour", title: "By colour" },
] as const;

export type FooterGroup = (typeof FOOTER_GROUPS)[number]["id"];

/**
 * What every page needs to know about the landings: their routes, footer links,
 * the title the home links them by, and the look each one starts on. The copy
 * (description, headline, guides) stays in `landings.ts`, which only a landing
 * and the build load. A test keeps both lists in step: a new landing goes in both.
 */
export type LandingRoute = Pick<Landing, "slug" | "title" | "footerLabel" | "look"> & {
  footerGroup?: FooterGroup;
  guide?: true;
};

export const LANDING_ROUTES: readonly LandingRoute[] = [
  {
    slug: "iphone-gradient-wallpapers",
    title: "Free iPhone Gradient Wallpapers",
    footerLabel: "iPhone",
    footerGroup: "device",
    look: {
      device: "mobile",
    },
  },
  {
    slug: "4k-gradient-wallpapers",
    title: "Free 4K Gradient Wallpapers for Desktop",
    footerLabel: "4K desktop",
    footerGroup: "device",
    look: {
      device: "desktop",
    },
  },
  {
    slug: "mesh-gradient-wallpapers",
    title: "Free Mesh Gradient Wallpapers",
    footerLabel: "Mesh",
    footerGroup: "style",
    look: {
      style: "mesh",
    },
  },
  {
    slug: "aurora-gradient-wallpapers",
    title: "Free Aurora Gradient Wallpapers",
    footerLabel: "Aurora",
    footerGroup: "style",
    look: {
      style: "aurora",
    },
  },
  {
    slug: "grainy-gradient-wallpapers",
    title: "Free Grainy Gradient Wallpapers",
    footerLabel: "Grainy",
    footerGroup: "style",
    look: {
      grain: 85,
    },
  },
  {
    slug: "aura-gradient-wallpapers",
    title: "Aura Gradient Wallpaper Maker, Free",
    footerLabel: "Aura",
    footerGroup: "style",
    look: {
      style: "mesh",
      grain: 55,
    },
  },
  {
    slug: "liquid-gradient-wallpapers",
    title: "Free Liquid Gradient Wallpapers",
    footerLabel: "Liquid",
    footerGroup: "style",
    look: {
      style: "liquid",
    },
  },
  {
    slug: "dark-gradient-wallpapers",
    title: "Free Dark Gradient Wallpapers",
    footerLabel: "Dark",
    footerGroup: "colour",
    look: {
      grain: 70,
      colors: ["#05030f", "#120d2e", "#3b2a8a", "#8b5cf6"],
    },
  },
  {
    slug: "burgundy-gradient-wallpapers",
    title: "Burgundy Gradient Wallpapers, iPhone 18 Pro",
    footerLabel: "Burgundy",
    footerGroup: "colour",
    look: {
      device: "mobile",
      colors: ["#1a0508", "#4a0e1c", "#7b1e34", "#c2566b"],
    },
  },
  {
    slug: "orange-gradient-wallpapers",
    title: "Orange Gradient Wallpapers, Cosmic Orange Too",
    footerLabel: "Orange",
    footerGroup: "colour",
    look: {
      device: "mobile",
      colors: ["#1a0a03", "#7a2e0b", "#f26a1b", "#ffb36b"],
    },
  },
  {
    slug: "glacier-gradient-wallpapers",
    title: "Glacier Blue Wallpapers for iPhone 18 Pro",
    footerLabel: "Glacier",
    footerGroup: "colour",
    look: {
      device: "mobile",
      colors: ["#0c1a2b", "#3d6a8f", "#a9cbe3", "#eef6fb"],
    },
  },
  {
    slug: "green-gradient-wallpapers",
    title: "Green Gradient Wallpapers, Sage Green Too",
    footerLabel: "Green",
    footerGroup: "colour",
    look: {
      device: "mobile",
      colors: ["#0d1f17", "#2f5d46", "#8fb39a", "#e3eee2"],
    },
  },
  {
    slug: "gold-gradient-wallpapers",
    title: "Gold Gradient Wallpapers for iPhone and Mac",
    footerLabel: "Gold",
    footerGroup: "colour",
    look: {
      device: "mobile",
      colors: ["#1a1206", "#6b4a12", "#c9962e", "#f6e2a8"],
    },
  },
  {
    slug: "macbook-gradient-wallpapers",
    title: "Free Gradient Wallpapers for MacBook",
    footerLabel: "MacBook",
    footerGroup: "device",
    look: {
      device: "desktop",
    },
  },
  {
    slug: "matching-iphone-mac-wallpapers",
    title: "Matching Wallpapers for iPhone and Mac",
    footerLabel: "Matching sets",
    footerGroup: "device",
    look: {
      device: "mobile",
    },
  },
  {
    slug: "blue-gradient-wallpapers",
    title: "Free Blue Gradient Wallpapers",
    footerLabel: "Blue",
    footerGroup: "colour",
    look: {
      colors: ["#020b1f", "#0b3a75", "#2a7de1", "#9fd3ff"],
    },
  },
  {
    slug: "purple-gradient-wallpapers",
    title: "Free Purple Gradient Wallpapers",
    footerLabel: "Purple",
    footerGroup: "colour",
    look: {
      colors: ["#12051f", "#3b0f6b", "#8b5cf6", "#e9d5ff"],
    },
  },
  {
    slug: "pink-gradient-wallpapers",
    title: "Free Pink Gradient Wallpapers",
    footerLabel: "Pink",
    footerGroup: "colour",
    look: {
      colors: ["#3d0a24", "#c2185b", "#f48fb1", "#ffe4ec"],
    },
  },
  {
    slug: "pastel-gradient-wallpapers",
    title: "Free Pastel Gradient Wallpapers",
    footerLabel: "Pastel",
    footerGroup: "colour",
    look: {
      colors: ["#ffd6e0", "#c8e7ff", "#d9f2e6", "#e7d6ff"],
    },
  },
  {
    slug: "blur-gradient-wallpapers",
    title: "Blur Gradient Wallpapers, Free and in 4K",
    footerLabel: "Blur",
    footerGroup: "style",
    look: {
      grain: 15,
    },
  },
  {
    slug: "guides/iphone-wallpaper-size",
    title: "iPhone Wallpaper Size for Every Model (2026)",
    footerLabel: "iPhone wallpaper sizes",
    look: {
      device: "mobile",
    },
    guide: true,
  },
  {
    slug: "guides/iphone-gradient-wallpaper-not-working",
    title: "iPhone Gradient Wallpaper Not Working? Fixes",
    footerLabel: "Gradient wallpaper fixes",
    look: {
      device: "mobile",
    },
    guide: true,
  },
  {
    slug: "guides/macbook-wallpaper-size",
    title: "MacBook Wallpaper Size for Every Model (2026)",
    footerLabel: "MacBook wallpaper sizes",
    look: {
      device: "desktop",
    },
    guide: true,
  },
];

export const GUIDE_ROUTES = LANDING_ROUTES.filter((l) => l.guide);

export function landingPath(slug: string): string {
  return `/${slug}/`;
}
