import { type RecoverEnv, readRecoverEnv } from "./env";
import { failureResponse, json, methodNotAllowed, rejectNonJson } from "./http";
import { type Catalog, getCatalog } from "./catalog";
import { createLoopsClient, type LoopsClient } from "./loops";
import { fetchOrderEmail, type LSOrderLookup } from "./ls-api";
import { recoverOrder } from "./order";
import type { OrderStore } from "./orders-store";
import { prodOrderStore } from "./prod-order-store";

export interface RecoverHandlerDeps {
  readEnv: () => RecoverEnv;
  store: () => OrderStore;
  loops: (apiKey: string) => LoopsClient;
  lookupOrderEmail: (orderId: string, apiKey: string) => Promise<LSOrderLookup | null>;
  catalog: () => Catalog;
  /** Seconds since epoch. */
  now: () => number;
}

export const prodRecoverDeps: RecoverHandlerDeps = {
  readEnv: readRecoverEnv,
  store: () => prodOrderStore(),
  loops: (apiKey) => createLoopsClient(apiKey),
  lookupOrderEmail: (orderId, apiKey) => fetchOrderEmail(orderId, apiKey),
  catalog: getCatalog,
  now: () => Math.floor(Date.now() / 1000),
};

const GENERIC_OK = {
  ok: true,
  message: "If the order exists, a recovery email has been sent.",
};

/**
 * POST /recover-link — re-issues the download email for a known paid order.
 * Always returns the same generic 200 to prevent enumerating valid order IDs;
 * `outcome.reason` is only used for server-side observability. That includes
 * infrastructure failures (Blobs, Loops): they happen only after a real order
 * is found, so a 500 there would tell an attacker which order ids exist. They
 * are logged instead.
 */
export function createRecoverHandler(deps: RecoverHandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== "POST") return methodNotAllowed();
    const notJson = rejectNonJson(req);
    if (notJson) return notJson;

    const input = parseInput(await req.json().catch(() => undefined));
    if (!input) return json({ ok: false, error: "Bad JSON" }, 400);

    // Missing config is independent of any order, so it can be reported
    // without helping an enumerator.
    let env: RecoverEnv;
    let store: OrderStore;
    try {
      env = deps.readEnv();
      store = deps.store();
    } catch (err) {
      return failureResponse("recover-link", err);
    }

    try {
      const outcome = await recoverOrder(
        {
          store,
          loops: deps.loops(env.loopsApiKey),
          lookupOrderEmail: (orderId) => deps.lookupOrderEmail(orderId, env.lsApiKey),
          jwtSecret: env.jwtSecret,
          loopsTransactionalId: env.loopsTransactionalId,
          publicSiteUrl: env.publicSiteUrl,
          packNameOf: (slug) => deps.catalog().bySlug(slug)?.name,
          now: deps.now,
        },
        input,
      );
      console.log("[recover-link]", { reason: outcome.reason });
    } catch (err) {
      console.error("[recover-link] failed", err);
    }
    return json(GENERIC_OK, 200);
  };
}

/** A body that is not a JSON object (`null`, an array, a string…) is a bad request. */
function parseInput(body: unknown): { email: string; orderId: string } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { email, orderId } = body as { email?: unknown; orderId?: unknown };
  return {
    email: typeof email === "string" ? email : "",
    orderId: typeof orderId === "string" ? orderId : "",
  };
}
