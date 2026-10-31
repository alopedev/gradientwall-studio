/**
 * SEO data that needs the landing galleries: a landing's own page and the full
 * list of prerendered pages. Kept apart from `pages.ts`, which every page
 * imports at runtime, so the galleries load only with a landing (and in the build).
 */

import { galleryFor, GALLERY_DIR } from "./gallery";
import { LANDINGS, landingPath, type Landing } from "./landings";
import {
  buildHomePage,
  buildPackPage,
  DEFAULT_OG_SIZE,
  HERO_PHONE_IMAGE,
  imageObjectJsonLd,
  LICENCE_PAGE,
  landingLinks,
  PRIVACY_PAGE,
  RECOVER_PAGE,
  type SeoPack,
  type SeoPage,
  SITE_NAME,
  SITE_ORIGIN,
} from "./pages";

export function buildLandingPage(landing: Landing): SeoPage {
  const url = `${SITE_ORIGIN}${landingPath(landing.slug)}`;
  const text = [landing.description, ...landing.guides.flatMap((g) => g.body)].join(" ");
  const gallery = galleryFor(landing);
  return {
    path: landingPath(landing.slug),
    title: landing.title,
    description: landing.description,
    ogType: "website",
    // The share image is the gallery's first wallpaper, drawn at 1200 × 630.
    ...(gallery.length
      ? {
          ogImage: `${GALLERY_DIR}/${landing.slug}/og.jpg`,
          ogImageAlt: gallery[0].alt,
          ogImageSize: DEFAULT_OG_SIZE,
        }
      : {}),
    images: gallery.map((g) => g.src),
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
      ...gallery.map(imageObjectJsonLd),
    ],
    noindex: false,
    shell: {
      h1: landing.h1,
      text,
      links: [{ href: "/", label: "Free gradient wallpaper generator" }, ...landingLinks(landing)],
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
    LICENCE_PAGE,
  ];
}
