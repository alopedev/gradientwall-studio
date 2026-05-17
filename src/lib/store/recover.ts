export interface RecoverInput {
  email: string;
  orderId: string;
}

export type RecoverResult = { kind: "ok" } | { kind: "error"; message: string; status?: number };

export interface RecoverOptions {
  signal?: AbortSignal;
  /** Override for tests; defaults to the production Function path. */
  endpoint?: string;
}

const DEFAULT_ENDPOINT = "/.netlify/functions/recover-link";

/**
 * Submits a recover request to the backend. The Function always returns 200
 * with a generic body to prevent enumeration, so success here means "the
 * request was accepted" rather than "your order was found". Errors that
 * surface to the caller are infrastructure-level (network, 5xx, malformed
 * 4xx).
 */
export async function submitRecoverRequest(
  input: RecoverInput,
  opts: RecoverOptions = {},
): Promise<RecoverResult> {
  const endpoint = opts.endpoint ?? DEFAULT_ENDPOINT;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: input.email.trim(),
        orderId: input.orderId.trim(),
      }),
      signal: opts.signal,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return {
        kind: "error",
        message: body.error ?? `Server returned ${res.status}`,
        status: res.status,
      };
    }
    return { kind: "ok" };
  } catch (err) {
    return {
      kind: "error",
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}
