/**
 * Single source of truth for per-route SEO data. Pure (no DOM, no React, no
 * `@/` imports) so it runs in three places: the browser (`PageMeta`), the
 * Vite build (prerender + sitemap in `vite.config.ts`) and tests.
 */

// Temporary: gradientwall.com lapsed and was taken by a domain reseller. Switch
// back here (and in public/robots.txt) once the site has its own domain.
export const SITE_ORIGIN = "https://gradientwall-studio.netlify.app";
export const SITE_NAME = "GradientWall";
export const DEFAULT_OG_IMAGE = "/og-default.jpg";
export const DEFAULT_OG_ALT =
  "GradientWall — liquid gradient in coral, periwinkle and indigo, with the text Free gradient wallpaper generator";

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
  cover: { kind: string; url?: string; alt?: string };
  lemonSqueezyVariantId?: string;
}

export interface SeoPage {
  /** Path-only URL, e.g. `/packs/acrylic`. */
  path: string;
  title: string;
  description: string;
  ogType: "website" | "product";
  ogImage?: string;
  ogImageAlt?: string;
  jsonLd?: Record<string, unknown>[];
  noindex: boolean;
  /** Crawlable content injected into `#root` before React mounts. */
  shell: { h1: string; text: string; links?: { href: string; label: string }[] };
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
 * Pack pages are indexable only once the pack can be bought. Until the store
 * opens (Phase 2) they are prerendered for correct link previews but kept
 * out of the index and the sitemap.
 */
export function isPackIndexable(pack: Pick<SeoPack, "lemonSqueezyVariantId">): boolean {
  return Boolean(pack.lemonSqueezyVariantId);
}

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
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_ORIGIN,
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
  path: "/recover",
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
  path: "/privacy",
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
  const url = `${SITE_ORIGIN}/packs/${pack.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: pack.name,
      description: pack.description,
      url,
      brand: { "@type": "Brand", name: SITE_NAME },
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "EUR",
        price: pack.priceEur.toFixed(2),
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_ORIGIN },
        { "@type": "ListItem", position: 2, name: "Packs", item: `${SITE_ORIGIN}/#packs` },
        { "@type": "ListItem", position: 3, name: pack.name, item: url },
      ],
    },
  ];
}

/** SEO data for a pack page. Shared by `PackPage` (runtime) and the prerender. */
export function buildPackPage(pack: SeoPack): SeoPage {
  const cover = pack.cover.kind === "image" ? pack.cover : undefined;
  return {
    path: `/packs/${pack.slug}`,
    title: pack.seoTitle ?? `${pack.name} — pack of ${pack.previews.length} wallpapers`,
    description: pack.seoDescription ?? pack.description,
    ogType: "product",
    ogImage: cover?.url,
    ogImageAlt: cover?.alt ?? `${pack.name} — ${pack.tagline}`,
    jsonLd: buildPackJsonLd(pack),
    noindex: !isPackIndexable(pack),
    shell: {
      h1: pack.name,
      text: `${pack.tagline} ${pack.description}`,
      links: [{ href: "/", label: "Free gradient wallpaper generator" }],
    },
  };
}

export function buildHomePage(): SeoPage {
  return {
    path: "/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    ogType: "website",
    ogImageAlt: DEFAULT_OG_ALT,
    jsonLd: HOME_JSON_LD,
    noindex: false,
    shell: {
      h1: "Free gradient wallpaper generator",
      text: "Design your own gradient wallpaper for phone, tablet or desktop. Shuffle until something feels right, tweak the colors, and download it in high resolution. No account, no watermark.",
    },
  };
}

/** Every page that gets its own prerendered HTML file (excluding the 404). */
export function buildSeoPages(packs: SeoPack[]): SeoPage[] {
  return [buildHomePage(), ...packs.map(buildPackPage), RECOVER_PAGE, PRIVACY_PAGE];
}
