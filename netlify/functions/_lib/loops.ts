/**
 * Minimal Loops client. Two operations matter for us:
 *
 *  - sendTransactional → "Your pack is ready" email with the download link
 *  - addContact         → newsletter subscribers
 *
 * Both wrap fetch directly so the function bundle stays small (no SDK).
 * The fetch impl is injectable so tests can stub it without nock-style hooks.
 */

export type FetchLike = typeof fetch;

export interface LoopsClient {
  sendTransactional(opts: {
    transactionalId: string;
    email: string;
    dataVariables: Record<string, string>;
  }): Promise<void>;
  addContact(opts: { email: string; source: string }): Promise<void>;
}

export function createLoopsClient(apiKey: string, fetchImpl: FetchLike = fetch): LoopsClient {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  return {
    async sendTransactional({ transactionalId, email, dataVariables }) {
      const res = await fetchImpl("https://app.loops.so/api/v1/transactional", {
        method: "POST",
        headers,
        body: JSON.stringify({ transactionalId, email, dataVariables }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Loops sendTransactional failed: ${res.status} ${text}`);
      }
    },

    async addContact({ email, source }) {
      const res = await fetchImpl("https://app.loops.so/api/v1/contacts/create", {
        method: "POST",
        headers,
        body: JSON.stringify({ email, source, subscribed: true }),
      });
      // 409 = already subscribed → idempotent success.
      if (res.status === 409) return;
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Loops addContact failed: ${res.status} ${text}`);
      }
    },
  };
}
