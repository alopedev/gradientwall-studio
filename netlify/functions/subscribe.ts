import type { Config, Context } from "@netlify/functions";
import { createSubscribeHandler, prodSubscribeDeps } from "./_lib/subscribe-handler";

const handler = createSubscribeHandler(prodSubscribeDeps);

export default async (req: Request, _ctx: Context): Promise<Response> => handler(req);

// Rate limits need a custom path; the function is then only served here.
export const config: Config = {
  path: "/api/subscribe",
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
