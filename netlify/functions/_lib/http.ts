import { MissingEnvError } from "./env";

export function json(
  body: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export function methodNotAllowed(): Response {
  return new Response("Method not allowed", { status: 405 });
}

/**
 * A browser can send `text/plain` or form bodies to another site without
 * asking first; `application/json` always needs a CORS preflight, which these
 * functions never grant. Requiring it keeps other sites from posting here.
 * Returns the 415 to send, or null when the body is JSON.
 */
export function rejectNonJson(req: Request): Response | null {
  const type = req.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type === "application/json") return null;
  return json({ ok: false, reason: "unsupported_media_type" }, 415);
}

/**
 * Maps an unexpected failure (missing config, Blobs/Loops/R2 down) to a 500
 * with a stable body. The cause goes to the logs only: nothing about the
 * deployment leaks to the caller.
 */
export function failureResponse(fn: string, err: unknown): Response {
  if (err instanceof MissingEnvError) {
    console.error(`[${fn}] misconfigured: missing ${err.key}`);
    return json({ ok: false, reason: "misconfigured" }, 500);
  }
  console.error(`[${fn}] unexpected error`, err);
  return json({ ok: false, reason: "internal_error" }, 500);
}
