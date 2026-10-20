import type { Config, Context } from "@netlify/functions";
import { createRecoverHandler, prodRecoverDeps } from "./_lib/recover-handler";

const handler = createRecoverHandler(prodRecoverDeps);

export default async (req: Request, _ctx: Context): Promise<Response> => handler(req);

// Rate limits need a custom path; the function is then only served here.
export const config: Config = {
  path: "/api/recover-link",
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
