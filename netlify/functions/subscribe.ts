import type { Context } from "@netlify/functions";
import { createSubscribeHandler, prodSubscribeDeps } from "./_lib/subscribe-handler";

const handler = createSubscribeHandler(prodSubscribeDeps);

export default async (req: Request, _ctx: Context): Promise<Response> => handler(req);
