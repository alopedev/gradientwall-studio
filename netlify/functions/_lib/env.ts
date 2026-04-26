/**
 * Boundary for reading environment variables. Centralised so misconfiguration
 * fails loudly at startup, not deep in a handler — and so mocking in tests is
 * a single point.
 */
export interface FunctionEnv {
  jwtSecret: string;
  lsWebhookSecret: string;
  lsApiKey: string;
  loopsApiKey: string;
  loopsTransactionalId: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketPacks: string;
  publicSiteUrl: string;
}

export function readEnv(source: NodeJS.ProcessEnv = process.env): FunctionEnv {
  return {
    jwtSecret: required(source, "JWT_SECRET"),
    lsWebhookSecret: required(source, "LS_WEBHOOK_SECRET"),
    lsApiKey: required(source, "LS_API_KEY"),
    loopsApiKey: required(source, "LOOPS_API_KEY"),
    loopsTransactionalId: required(source, "LOOPS_TRANSACTIONAL_ID"),
    r2AccountId: required(source, "R2_ACCOUNT_ID"),
    r2AccessKeyId: required(source, "R2_ACCESS_KEY_ID"),
    r2SecretAccessKey: required(source, "R2_SECRET_ACCESS_KEY"),
    r2BucketPacks: required(source, "R2_BUCKET_PACKS"),
    publicSiteUrl: required(source, "PUBLIC_SITE_URL"),
  };
}

function required(source: NodeJS.ProcessEnv, key: string): string {
  const v = source[key];
  if (!v || v.trim() === "") {
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
}
