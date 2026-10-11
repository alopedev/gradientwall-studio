/**
 * Boundary for reading environment variables. Each function reads only the
 * variables it uses, so a missing R2 key cannot take down /recover-link and a
 * missing Loops key cannot take down /download. Readers throw
 * `MissingEnvError` (naming the variable, never its value) when one is absent;
 * the handlers turn that into a 500 with a stable body.
 */
export type EnvSource = Record<string, string | undefined>;

export class MissingEnvError extends Error {
  constructor(readonly key: string) {
    super(`Missing required env var: ${key}`);
    this.name = "MissingEnvError";
  }
}

export interface DownloadEnv {
  jwtSecret: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketPacks: string;
}

export interface WebhookEnv {
  jwtSecret: string;
  lsWebhookSecret: string;
  loopsApiKey: string;
  loopsTransactionalId: string;
  publicSiteUrl: string;
}

export interface RecoverEnv {
  jwtSecret: string;
  lsApiKey: string;
  loopsApiKey: string;
  loopsTransactionalId: string;
  publicSiteUrl: string;
}

export function readDownloadEnv(source: EnvSource = process.env): DownloadEnv {
  return {
    jwtSecret: required(source, "JWT_SECRET"),
    r2AccountId: required(source, "R2_ACCOUNT_ID"),
    r2AccessKeyId: required(source, "R2_ACCESS_KEY_ID"),
    r2SecretAccessKey: required(source, "R2_SECRET_ACCESS_KEY"),
    r2BucketPacks: required(source, "R2_BUCKET_PACKS"),
  };
}

export function readWebhookEnv(source: EnvSource = process.env): WebhookEnv {
  return {
    jwtSecret: required(source, "JWT_SECRET"),
    lsWebhookSecret: required(source, "LS_WEBHOOK_SECRET"),
    loopsApiKey: required(source, "LOOPS_API_KEY"),
    loopsTransactionalId: required(source, "LOOPS_TRANSACTIONAL_ID"),
    publicSiteUrl: required(source, "PUBLIC_SITE_URL"),
  };
}

export function readRecoverEnv(source: EnvSource = process.env): RecoverEnv {
  return {
    jwtSecret: required(source, "JWT_SECRET"),
    lsApiKey: required(source, "LS_API_KEY"),
    loopsApiKey: required(source, "LOOPS_API_KEY"),
    loopsTransactionalId: required(source, "LOOPS_TRANSACTIONAL_ID"),
    publicSiteUrl: required(source, "PUBLIC_SITE_URL"),
  };
}

function required(source: EnvSource, key: string): string {
  const v = source[key];
  if (!v || v.trim() === "") {
    throw new MissingEnvError(key);
  }
  return v;
}
