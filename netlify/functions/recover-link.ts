import type { Context } from "@netlify/functions";
import { createRecoverHandler, prodRecoverDeps } from "./_lib/recover-handler";

const handler = createRecoverHandler(prodRecoverDeps);

export default async (req: Request, _ctx: Context): Promise<Response> => handler(req);
