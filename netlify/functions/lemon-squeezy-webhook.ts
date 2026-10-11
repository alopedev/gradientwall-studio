import type { Context } from "@netlify/functions";
import { createWebhookHandler, prodWebhookDeps } from "./_lib/webhook-handler";

const handler = createWebhookHandler(prodWebhookDeps);

export default async (req: Request, _ctx: Context): Promise<Response> => handler(req);
