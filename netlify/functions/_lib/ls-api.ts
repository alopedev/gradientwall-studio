/**
 * Thin client for the Lemon Squeezy REST API. Used by /recover to confirm
 * the orderId + email actually correspond to a real paid order in LS, before
 * we issue a fresh download token.
 */

export type FetchLike = typeof fetch;

export interface LSOrderLookup {
  orderId: string;
  email: string;
}

export async function fetchOrderEmail(
  orderId: string,
  apiKey: string,
  fetchImpl: FetchLike = fetch,
): Promise<LSOrderLookup | null> {
  const res = await fetchImpl(`https://api.lemonsqueezy.com/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.api+json",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LS getOrder failed: ${res.status} ${text}`);
  }
  const body = (await res.json()) as unknown;
  const email = extractEmail(body);
  if (!email) return null;
  return { orderId, email };
}

function extractEmail(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const attr = (data as { attributes?: unknown }).attributes;
  if (!attr || typeof attr !== "object") return null;
  const email = (attr as { user_email?: unknown }).user_email;
  return typeof email === "string" ? email : null;
}
