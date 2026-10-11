import type { Context } from "@netlify/functions";
import { createDownloadHandler, prodDownloadDeps } from "./_lib/download-handler";

const handler = createDownloadHandler(prodDownloadDeps);

export default async (req: Request, _ctx: Context): Promise<Response> => handler(req);
