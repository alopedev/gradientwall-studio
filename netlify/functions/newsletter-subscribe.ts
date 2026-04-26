import type { Context } from "@netlify/functions";
import { readEnv } from "./_lib/env";
import { createLoopsClient } from "./_lib/loops";

/**
 * Public-ish endpoint hit by the footer + post-download newsletter form.
 * Body: { email: string, source?: string }. Forwards to Loops; idempotent on
 * the Loops side.
 */
export default async (req: Request, _ctx: Context): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { email?: string; source?: string };
  try {
    body = (await req.json()) as { email?: string; source?: string };
  } catch {
    return json({ ok: false, error: "Bad JSON" }, 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return json({ ok: false, error: "Invalid email" }, 400);
  }

  const env = readEnv();
  const loops = createLoopsClient(env.loopsApiKey);
  await loops.addContact({ email, source: body.source ?? "footer" });
  return json({ ok: true }, 200);
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isValidEmail(s: string): boolean {
  // Permissive: a single @ with a dot in the domain. RFC-correct validation
  // is impossible by regex; the source of truth is whether Loops accepts it.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
