import { readSubscribeEnv, type SubscribeEnv } from "./env";
import { failureResponse, json, methodNotAllowed } from "./http";
import { createLoopsFormClient, type LoopsFormClient } from "./loops-form";

export interface SubscribeHandlerDeps {
  readEnv: () => SubscribeEnv;
  form: (formId: string) => LoopsFormClient;
}

export const prodSubscribeDeps: SubscribeHandlerDeps = {
  readEnv: readSubscribeEnv,
  form: (formId) => createLoopsFormClient(formId),
};

/** Where on the site the visitor signed up. Anything else is stored as "web". */
const SOURCES = new Set(["studio", "footer", "pack"]);

// Pragmatic shape check (Loops validates for real, and the double opt-in email
// is the real proof the address exists). RFC 5321 caps an address at 254.
const EMAIL = /^[^\s@]+@[^\s@.][^\s@]*\.[^\s@]{2,}$/;

/**
 * POST /subscribe — adds an email to the Loops audience through the form
 * endpoint, which sends the double opt-in confirmation. Same answer whether
 * the address is new or already known (Loops does not say either), so the
 * endpoint cannot be used to probe the list. Addresses are never logged.
 */
export function createSubscribeHandler(deps: SubscribeHandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== "POST") return methodNotAllowed();

    const input = parseInput(await req.json().catch(() => undefined));
    if (!input) return json({ ok: false, reason: "bad_request" }, 400);

    // Bots fill every field. Pretend it worked and do nothing.
    if (input.website !== "") return json({ ok: true }, 200);

    if (input.email.length > 254 || !EMAIL.test(input.email)) {
      return json({ ok: false, reason: "invalid_email" }, 400);
    }

    try {
      const env = deps.readEnv();
      const result = await deps.form(env.loopsFormId).subscribe({
        email: input.email,
        source: input.source,
      });
      console.log("[subscribe]", { source: input.source, result });
      if (result === "invalid_email") return json({ ok: false, reason: "invalid_email" }, 400);
      if (result === "rate_limited") return json({ ok: false, reason: "rate_limited" }, 429);
      return json({ ok: true }, 200);
    } catch (err) {
      return failureResponse("subscribe", err);
    }
  };
}

function parseInput(body: unknown): { email: string; source: string; website: string } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { email, source, website } = body as Record<string, unknown>;
  if (typeof email !== "string") return null;
  return {
    email: email.trim(),
    source: typeof source === "string" && SOURCES.has(source) ? source : "web",
    website: typeof website === "string" ? website.trim() : "",
  };
}
