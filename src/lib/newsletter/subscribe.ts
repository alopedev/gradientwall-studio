export type SubscribeSource = "studio" | "footer" | "pack";

export type SubscribeResult =
  | { kind: "ok" }
  | { kind: "error"; reason: "invalid_email" | "rate_limited" | "failed" };

export interface SubscribeOptions {
  signal?: AbortSignal;
  /** Override for tests; defaults to the production Function path. */
  endpoint?: string;
}

const DEFAULT_ENDPOINT = "/.netlify/functions/subscribe";

/**
 * The capture form is built behind this flag: until the Loops form exists and
 * the privacy page is live, the site shows nothing and the Function is unused.
 */
export function isNewsletterEnabled(): boolean {
  return import.meta.env.VITE_NEWSLETTER_ENABLED === "true";
}

/**
 * Asks the backend to add the address to the audience. A 200 means "accepted":
 * the person still has to confirm from the email Loops sends (double opt-in),
 * and the answer is the same for a new and a known address.
 */
export async function subscribeEmail(
  input: { email: string; source: SubscribeSource; website?: string },
  opts: SubscribeOptions = {},
): Promise<SubscribeResult> {
  try {
    const res = await fetch(opts.endpoint ?? DEFAULT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: input.email.trim(),
        source: input.source,
        website: input.website ?? "",
      }),
      signal: opts.signal,
    });
    if (res.ok) return { kind: "ok" };
    if (res.status === 429) return { kind: "error", reason: "rate_limited" };
    if (res.status === 400) {
      const body = (await res.json().catch(() => ({}))) as { reason?: string };
      if (body.reason === "invalid_email") return { kind: "error", reason: "invalid_email" };
    }
    return { kind: "error", reason: "failed" };
  } catch {
    return { kind: "error", reason: "failed" };
  }
}
