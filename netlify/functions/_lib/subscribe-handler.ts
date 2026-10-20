import { readSubscribeEnv, type SupabaseEnv } from "./env";
import { failureResponse, json, methodNotAllowed, rejectNonJson } from "./http";
import { type SubscriberStore, supabaseSubscriberStore } from "./supabase-subscribers";

export interface SubscribeHandlerDeps {
  readEnv: () => SupabaseEnv;
  store: (env: SupabaseEnv) => SubscriberStore;
}

export const prodSubscribeDeps: SubscribeHandlerDeps = {
  readEnv: readSubscribeEnv,
  store: (env) => supabaseSubscriberStore(env),
};

/** Where on the site the visitor signed up. Anything else is stored as "web". */
const SOURCES = new Set(["studio", "footer", "pack"]);

/** Longest consent wording we keep; the real one is far shorter. */
const MAX_CONSENT = 500;

// Pragmatic shape check; nothing confirms the address is real or the person's
// own (there is no confirmation email). RFC 5321 caps an address at 254.
const EMAIL = /^[^\s@]+@[^\s@.][^\s@]*\.[^\s@]{2,}$/;

/**
 * POST /subscribe — adds an email to the Supabase `subscribers` table, with the
 * source and the consent wording the person saw. Same answer whether the
 * address is new or already known, so the endpoint cannot be used to probe the
 * list. Addresses are never logged.
 */
export function createSubscribeHandler(deps: SubscribeHandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== "POST") return methodNotAllowed();
    const notJson = rejectNonJson(req);
    if (notJson) return notJson;

    const input = parseInput(await req.json().catch(() => undefined));
    if (!input) return json({ ok: false, reason: "bad_request" }, 400);

    // Bots fill every field. Pretend it worked and do nothing.
    if (input.website !== "") return json({ ok: true }, 200);

    if (input.email.length > 254 || !EMAIL.test(input.email)) {
      return json({ ok: false, reason: "invalid_email" }, 400);
    }

    try {
      await deps.store(deps.readEnv()).subscribe({
        email: input.email,
        source: input.source,
        consentText: input.consentText,
      });
      console.log("[subscribe]", { source: input.source });
      return json({ ok: true }, 200);
    } catch (err) {
      return failureResponse("subscribe", err);
    }
  };
}

function parseInput(
  body: unknown,
): { email: string; source: string; website: string; consentText: string } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { email, source, website, consentText } = body as Record<string, unknown>;
  if (typeof email !== "string") return null;
  if (typeof consentText !== "string" || consentText === "" || consentText.length > MAX_CONSENT) {
    return null;
  }
  return {
    email: email.trim(),
    source: typeof source === "string" && SOURCES.has(source) ? source : "web",
    website: typeof website === "string" ? website.trim() : "",
    consentText,
  };
}
