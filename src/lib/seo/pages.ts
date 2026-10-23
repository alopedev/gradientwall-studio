/**
 * Single source of truth for per-route SEO data. Pure (no DOM, no React, no
 * `@/` imports) so it runs in three places: the browser (`PageMeta`), the
 * Vite build (prerender + sitemap in `vite.config.ts`) and tests.
 */

import { LANDINGS, landingPath, type Landing } from "./landings";

// Also in public/robots.txt, and the old Netlify address 301s here
// (public/_redirects + netlify.toml).
export const SITE_ORIGIN = "https://gradientwall.app";
export const SITE_NAME = "GradientWall";
export const DEFAULT_OG_IMAGE = "/og-default.jpg";
export const DEFAULT_OG_SIZE = { width: 1200, height: 630 };
/**
 * Robots value of every indexable page. `max-image-preview:large` lets Google
 * show big previews in Images and Discover, the main way wallpapers are found.
 */
export const ROBOTS_INDEX = "index,follow,max-image-preview:large";
export const DEFAULT_OG_ALT =
  "The GradientWall logo, a black window with a gradient circle, above the words Free gradient wallpaper generator";

/** The minimal slice of a pack the SEO layer needs. */
export interface SeoPack {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceEur: number;
  previews: unknown[];
  seoTitle?: string;
  seoDescription?: string;
  cover: { kind: string; url?: string; alt?: string; width?: number; height?: number };
  lemonSqueezyVariantId?: string;
  /** Etsy listing, while the pack is sold there instead of here. */
  etsyUrl?: string;
}

export interface SeoPage {
  /** Path-only URL with its trailing slash, e.g. `/packs/impasto/` (see `packPath`). */
  path: string;
  title: string;
  description: string;
  ogType: "website" | "product";
  ogImage?: string;
  ogImageAlt?: string;
  /** Pixel size of `ogImage`; leave out when unknown. */
  ogImageSize?: { width: number; height: number };
  /** The page's largest image (its LCP), fetched before the app's JS asks for it. */
  preloadImage?: string;
  jsonLd?: Record<string, unknown>[];
  /** Images shown on the page, listed under it in the sitemap for Google Images. */
  images?: string[];
  noindex: boolean;
  /** Crawlable content injected into `#root` before React mounts. */
  shell: { h1: string; text: string; links?: { href: string; label: string }[] };
}

/**
 * URL of a pack page. Netlify serves the prerendered `packs/<slug>/index.html`
 * at `/packs/<slug>/` and 301-redirects the slashless URL there, so links and
 * canonicals use this form.
 */
export function packPath(slug: string): string {
  return `/packs/${slug}/`;
}

/** `Title — GradientWall`, unless the title already carries the brand. */
export function fullTitle(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
}

/** Absolute URL for a path or already-absolute URL. */
export function absoluteUrl(pathOrUrl: string): string {
  return pathOrUrl.startsWith("http") ? pathOrUrl : `${SITE_ORIGIN}${pathOrUrl}`;
}

/**
 * Pack pages are indexable once the pack can be bought: on Etsy (today) or in
 * our own store. A pack with neither is prerendered for link previews but kept
 * out of the index and the sitemap.
 */
export function isPackIndexable(pack: Pick<SeoPack, "lemonSqueezyVariantId" | "etsyUrl">): boolean {
  return Boolean(pack.lemonSqueezyVariantId || pack.etsyUrl);
}

/** The cut-out phone of the home hero (`Hero.tsx`), the home page's LCP. */
export const HERO_PHONE_IMAGE = "/assets/hero/phone.webp";

export const HOME_TITLE = "Free Gradient Wallpaper Generator";
export const HOME_DESCRIPTION =
  "Create your own gradient wallpapers for phone, tablet and desktop. Free online generator, no account, no watermark, export up to 5K.";

export const HOME_JSON_LD: Record<string, unknown>[] = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/icon-512.png`,
    description:
      "GradientWall makes gradient wallpapers: a free online generator plus curated wallpaper packs.",
    sameAs: ["https://gradientwall.etsy.com"],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["Gradient Wall", "GradientWall Studio"],
    url: `${SITE_ORIGIN}/`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "GradientWall Studio",
    url: SITE_ORIGIN,
    description: HOME_DESCRIPTION,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  },
];

export const NOT_FOUND_PAGE: SeoPage = {
  path: "/404",
  title: "Page not found",
  description:
    "This page doesn't exist. Head back to the GradientWall gradient wallpaper generator.",
  ogType: "website",
  noindex: true,
  shell: {
    h1: "Page not found",
    text: "This page doesn't exist.",
    links: [{ href: "/", label: "GradientWall home" }],
  },
};

export const RECOVER_PAGE: SeoPage = {
  path: "/recover/",
  title: "Recover your download link",
  description: "Lost your download email? Recover it with your order ID.",
  ogType: "website",
  noindex: true,
  shell: {
    h1: "Recover your download link",
    text: "Lost your download email? Recover it with your order ID.",
  },
};

export const PRIVACY_PAGE: SeoPage = {
  path: "/privacy/",
  title: "Privacy",
  description:
    "What GradientWall does with your email and order data, who handles it, and how to exercise your rights.",
  ogType: "website",
  noindex: false,
  shell: {
    h1: "Privacy",
    text: "What GradientWall does with your email and order data, who handles it, and how to exercise your rights.",
  },
};

/** Product + BreadcrumbList JSON-LD for a pack page. */
export function buildPackJsonLd(pack: SeoPack): Record<string, unknown>[] {
  const url = `${SITE_ORIGIN}${packPath(pack.slug)}`;
  const image = pack.cover.kind === "image" && pack.cover.url ? [absoluteUrl(pack.cover.url)] : [];
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: pack.name,
      description: pack.description,
      url,
      ...(image.length ? { image } : {}),
      brand: { "@type": "Brand", name: SITE_NAME },
      offers: {
        "@type": "Offer",
        // Where it is bought: the Etsy listing until our own checkout opens.
        url: pack.lemonSqueezyVariantId || !pack.etsyUrl ? url : pack.etsyUrl,
        priceCurrency: "EUR",
        price: pack.priceEur.toFixed(2),
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: pack.name, item: url },
      ],
    },
  ];
}

/** Every image file of a pack (cover, each piece and its desktop render), once each. */
export function packImages(pack: SeoPack): string[] {
  const urls = [pack.cover.url];
  for (const piece of pack.previews as { url?: string; desktop?: { url?: string } }[]) {
    urls.push(piece.url, piece.desktop?.url);
  }
  return [...new Set(urls.filter((u): u is string => Boolean(u)))];
}

/** SEO data for a pack page. Shared by `PackPage` (runtime) and the prerender. */
export function buildPackPage(pack: SeoPack): SeoPage {
  const cover = pack.cover.kind === "image" ? pack.cover : undefined;
  return {
    path: packPath(pack.slug),
    title: pack.seoTitle ?? `${pack.name} — pack of ${pack.previews.length} wallpapers`,
    description: pack.seoDescription ?? pack.description,
    ogType: "product",
    ogImage: cover?.url,
    ogImageAlt: cover?.alt ?? `${pack.name} — ${pack.tagline}`,
    ogImageSize:
      cover?.width && cover.height ? { width: cover.width, height: cover.height } : undefined,
    jsonLd: buildPackJsonLd(pack),
    images: packImages(pack),
    noindex: !isPackIndexable(pack),
    shell: {
      h1: pack.name,
      text: `${pack.tagline} ${pack.description}`,
      links: [{ href: "/", label: "Free gradient wallpaper generator" }],
    },
  };
}

/** SEO data for a landing. Shared by `LandingPage` (runtime) and the prerender. */
export function buildLandingPage(landing: Landing): SeoPage {
  const url = `${SITE_ORIGIN}${landingPath(landing.slug)}`;
  const text = [landing.description, ...landing.guides.flatMap((g) => g.body)].join(" ");
  return {
    path: landingPath(landing.slug),
    title: landing.title,
    description: landing.description,
    ogType: "website",
    preloadImage: HERO_PHONE_IMAGE,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: landing.title,
        description: landing.description,
        url,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE_ORIGIN}/` },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: landing.title, item: url },
        ],
      },
    ],
    noindex: false,
    shell: {
      h1: landing.h1,
      text,
      links: [{ href: "/", label: "Free gradient wallpaper generator" }, ...landingLinks(landing)],
    },
  };
}

/** Links to every landing, for crawlable shells and the footer. */
export function landingLinks(except?: Landing): { href: string; label: string }[] {
  return LANDINGS.filter((l) => l !== except).map((l) => ({
    href: landingPath(l.slug),
    label: l.title.replace(/^Free /, ""),
  }));
}

export function buildHomePage(packs: Pick<SeoPack, "slug" | "name">[] = []): SeoPage {
  return {
    path: "/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    ogType: "website",
    ogImageAlt: DEFAULT_OG_ALT,
    ogImageSize: DEFAULT_OG_SIZE,
    preloadImage: HERO_PHONE_IMAGE,
    jsonLd: HOME_JSON_LD,
    noindex: false,
    shell: {
      h1: "make a gradient wallpaper. free, in 5K.",
      text: "Design your own gradient wallpaper for phone, tablet or desktop. Shuffle until something feels right, tweak the colours, and download it in high resolution. No account, no watermark.",
      links: [
        ...packs.map((p) => ({ href: packPath(p.slug), label: `${p.name} wallpaper pack` })),
        ...landingLinks(),
        { href: PRIVACY_PAGE.path, label: "Privacy" },
      ],
    },
  };
}

/** Every page that gets its own prerendered HTML file (excluding the 404). */
export function buildSeoPages(packs: SeoPack[]): SeoPage[] {
  return [
    buildHomePage(packs),
    ...packs.map(buildPackPage),
    ...LANDINGS.map(buildLandingPage),
    RECOVER_PAGE,
    PRIVACY_PAGE,
  ];
}
