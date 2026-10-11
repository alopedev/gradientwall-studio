/**
 * Client for a Loops hosted form endpoint
 * (`https://app.loops.so/api/newsletter-form/<FORM_ID>`). Used for the email
 * capture instead of the contacts API because only form endpoints honour
 * Loops' double opt-in (the contact stays "Pending" until they confirm).
 * The form id is not a secret; it lives in env so it can be swapped without a
 * code change. The fetch impl is injectable for tests.
 */
import type { FetchLike } from "./loops";

export type LoopsFormResult = "ok" | "invalid_email" | "rate_limited";

export interface LoopsFormClient {
  subscribe(opts: { email: string; source: string }): Promise<LoopsFormResult>;
}

export function createLoopsFormClient(
  formId: string,
  fetchImpl: FetchLike = fetch,
): LoopsFormClient {
  return {
    async subscribe({ email, source }) {
      const res = await fetchImpl(
        `https://app.loops.so/api/newsletter-form/${encodeURIComponent(formId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ email, source }).toString(),
        },
      );
      if (res.status === 429) return "rate_limited";
      if (res.status === 400) return "invalid_email";
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Loops form failed: ${res.status} ${text.slice(0, 200)}`);
      }
      const body = (await res.json().catch(() => ({}))) as { success?: boolean };
      if (body.success === false) throw new Error("Loops form answered success:false");
      return "ok";
    },
  };
}
