import type { Context } from "@netlify/functions";
import { readEnv } from "./_lib/env";
import { netlifyBlobsBackend, getOrder, putOrder } from "./_lib/orders-store";
import { createLoopsClient } from "./_lib/loops";
import { fetchOrderEmail } from "./_lib/ls-api";
import { issueDownloadToken } from "./_lib/signed-token";

const RECOVER_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Re-issue the download link for a known paid order. Validation chain:
 *   1. We have the order in our store (came through the webhook at some point)
 *   2. The submitted email matches the email LS has on file for that order
 *
 * On success: regenerates the JWT (7d TTL) and re-sends the transactional
 * email. The downloads counter is preserved as-is — recover is for "I lost
 * the email", not "I want more downloads". Buyers who genuinely exhausted
 * the 5-download budget go through manual support (rare).
 *
 * Always responds with the same generic 200 message regardless of whether
 * the lookup succeeded — prevents enumerating valid order IDs by error
 * response shape.
 */
export default async (req: Request, _ctx: Context): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { email?: string; orderId?: string };
  try {
    body = (await req.json()) as { email?: string; orderId?: string };
  } catch {
    return json({ ok: false, error: "Bad JSON" }, 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const orderId = (body.orderId ?? "").trim();
  if (!email || !orderId) {
    return json({ ok: false, error: "Missing email or orderId" }, 400);
  }

  const env = readEnv();
  const generic = json(
    {
      ok: true,
      message: "If the order exists, a recovery email has been sent.",
    },
    200,
  );

  const stored = await getOrder(netlifyBlobsBackend(), orderId);
  if (!stored) return generic;

  const lsLookup = await fetchOrderEmail(orderId, env.lsApiKey).catch(() => null);
  if (!lsLookup) return generic;
  if (lsLookup.email.toLowerCase() !== email) return generic;

  // All checks passed — re-issue + persist + email.
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + RECOVER_TTL_SECONDS;
  const token = await issueDownloadToken({
    payload: { orderId: stored.orderId, packSlug: stored.packSlug, email: stored.email },
    ttlSeconds: RECOVER_TTL_SECONDS,
    secret: env.jwtSecret,
    iat: now,
  });

  await putOrder(netlifyBlobsBackend(), { ...stored, expiresAt });

  const downloadUrl = `${env.publicSiteUrl}/.netlify/functions/download?token=${encodeURIComponent(token)}`;
  await createLoopsClient(env.loopsApiKey).sendTransactional({
    transactionalId: env.loopsTransactionalId,
    email: stored.email,
    dataVariables: {
      packName: stored.packSlug,
      downloadUrl,
    },
  });

  return generic;
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
