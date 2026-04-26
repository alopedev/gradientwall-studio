import { useEffect } from "react";

const SITE_ORIGIN = "https://gradientwall.com";

export interface PageMetaProps {
  /** Full page title (without site suffix; the suffix is appended automatically). */
  title: string;
  /** Single-paragraph description, ≤160 chars for search snippets. */
  description: string;
  /** Path-only canonical (e.g. `/packs/midnight-velvet`). Origin is added. */
  path: string;
  /** Open Graph image URL. Absolute or path-only. Falls back to og-default.jpg. */
  ogImage?: string;
  /** og:type. Defaults to website; product pages use "product". */
  ogType?: "website" | "product" | "article";
  /** Optional alt text for the og:image. */
  ogImageAlt?: string;
  /** Optional JSON-LD structured data — attached as a script tag and removed on unmount. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Block search engines from indexing this page. Used on /recover. */
  noindex?: boolean;
}

/**
 * Sets per-route head metadata (title, description, canonical, OG, Twitter,
 * optional JSON-LD) on mount and restores the previous values on unmount so
 * route changes leave a clean head.
 *
 * No external dep (we don't need the full react-helmet machinery for what's
 * effectively five tags). Each property is mirrored as og: and twitter:
 * because crawlers read different tags depending on the platform.
 */
export function PageMeta({
  title,
  description,
  path,
  ogImage,
  ogType = "website",
  ogImageAlt,
  jsonLd,
  noindex = false,
}: PageMetaProps) {
  useEffect(() => {
    const fullTitle = title.includes("GradientWall") ? title : `${title} — GradientWall`;
    const canonical = `${SITE_ORIGIN}${path}`;
    const image = ogImage
      ? ogImage.startsWith("http")
        ? ogImage
        : `${SITE_ORIGIN}${ogImage}`
      : `${SITE_ORIGIN}/og-default.jpg`;

    const previousTitle = document.title;
    document.title = fullTitle;

    const apply: Array<() => void> = [];

    apply.push(setMeta("name", "description", description));
    apply.push(setLink("canonical", canonical));
    apply.push(setMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow"));

    apply.push(setMeta("property", "og:title", fullTitle));
    apply.push(setMeta("property", "og:description", description));
    apply.push(setMeta("property", "og:url", canonical));
    apply.push(setMeta("property", "og:type", ogType));
    apply.push(setMeta("property", "og:image", image));
    if (ogImageAlt) apply.push(setMeta("property", "og:image:alt", ogImageAlt));

    apply.push(setMeta("name", "twitter:title", fullTitle));
    apply.push(setMeta("name", "twitter:description", description));
    apply.push(setMeta("name", "twitter:image", image));
    if (ogImageAlt) apply.push(setMeta("name", "twitter:image:alt", ogImageAlt));

    let jsonLdEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      jsonLdEl = document.createElement("script");
      jsonLdEl.type = "application/ld+json";
      jsonLdEl.dataset.pageMeta = "true";
      jsonLdEl.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(jsonLdEl);
    }

    return () => {
      document.title = previousTitle;
      apply.forEach((restore) => restore());
      jsonLdEl?.remove();
    };
  }, [title, description, path, ogImage, ogType, ogImageAlt, jsonLd, noindex]);

  return null;
}

/**
 * Set or create a `<meta>` tag with the given attribute key+value, returning
 * a function that restores the previous content (or removes the tag if it
 * didn't exist before).
 */
function setMeta(attr: "name" | "property", key: string, value: string): () => void {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  let previousValue: string | null = null;
  let createdHere = false;

  if (el) {
    previousValue = el.getAttribute("content");
    el.setAttribute("content", value);
  } else {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute("content", value);
    document.head.appendChild(el);
    createdHere = true;
  }

  return () => {
    if (createdHere) {
      el!.remove();
    } else if (previousValue !== null) {
      el!.setAttribute("content", previousValue);
    }
  };
}

function setLink(rel: string, href: string): () => void {
  const selector = `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  let previousValue: string | null = null;
  let createdHere = false;

  if (el) {
    previousValue = el.getAttribute("href");
    el.setAttribute("href", href);
  } else {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute("href", href);
    document.head.appendChild(el);
    createdHere = true;
  }

  return () => {
    if (createdHere) {
      el!.remove();
    } else if (previousValue !== null) {
      el!.setAttribute("href", previousValue);
    }
  };
}
