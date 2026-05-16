/**
 * Minimal Loops client. Only used for transactional email today
 * ("Your pack is ready" with the download link). Wraps fetch directly
 * so the function bundle stays small (no SDK). The fetch impl is
 * injectable so tests can stub it without nock-style hooks.
 *
 * Newsletter / contact-list features were removed (see ADR-0004).
 */

export type FetchLike = typeof fetch;

export interface LoopsClient {
  sendTransactional(opts: {
    transactionalId: string;
    email: string;
    dataVariables: Record<string, string>;
  }): Promise<void>;
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
  };
}
