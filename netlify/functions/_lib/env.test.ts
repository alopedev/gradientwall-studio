// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  MissingEnvError,
  readDownloadEnv,
  readOrdersStoreEnv,
  readRecoverEnv,
  readWebhookEnv,
  type EnvSource,
} from "./env";

const ALL: EnvSource = {
  JWT_SECRET: "jwt",
  LS_WEBHOOK_SECRET: "whsec",
  LS_API_KEY: "lskey",
  LOOPS_API_KEY: "loopskey",
  LOOPS_TRANSACTIONAL_ID: "tpl",
  R2_ACCOUNT_ID: "acc",
  R2_ACCESS_KEY_ID: "akid",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_BUCKET_PACKS: "bucket",
  PUBLIC_SITE_URL: "https://example.com",
};

function without(...keys: string[]): EnvSource {
  const copy = { ...ALL };
  for (const k of keys) delete copy[k];
  return copy;
}

describe("per-function env readers", () => {
  it("each reader maps its own variables", () => {
    expect(readDownloadEnv(ALL)).toEqual({
      jwtSecret: "jwt",
      r2AccountId: "acc",
      r2AccessKeyId: "akid",
      r2SecretAccessKey: "secret",
      r2BucketPacks: "bucket",
    });
    expect(readWebhookEnv(ALL)).toEqual({
      jwtSecret: "jwt",
      lsWebhookSecret: "whsec",
      loopsApiKey: "loopskey",
      loopsTransactionalId: "tpl",
      publicSiteUrl: "https://example.com",
    });
    expect(readRecoverEnv(ALL)).toEqual({
      jwtSecret: "jwt",
      lsApiKey: "lskey",
      loopsApiKey: "loopskey",
      loopsTransactionalId: "tpl",
      publicSiteUrl: "https://example.com",
    });
  });

  it("/recover-link does not need any R2 variable", () => {
    const env = without(
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_PACKS",
    );
    expect(() => readRecoverEnv(env)).not.toThrow();
    expect(() => readWebhookEnv(env)).not.toThrow();
  });

  it("/download needs neither Loops, Lemon Squeezy nor the site URL", () => {
    const env = without(
      "LOOPS_API_KEY",
      "LOOPS_TRANSACTIONAL_ID",
      "LS_API_KEY",
      "LS_WEBHOOK_SECRET",
      "PUBLIC_SITE_URL",
    );
    expect(() => readDownloadEnv(env)).not.toThrow();
  });

  it("the webhook does not need the Lemon Squeezy API key", () => {
    expect(() => readWebhookEnv(without("LS_API_KEY"))).not.toThrow();
  });

  it("names the missing variable (and only the name)", () => {
    try {
      readDownloadEnv(without("R2_BUCKET_PACKS"));
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(MissingEnvError);
      expect((err as MissingEnvError).key).toBe("R2_BUCKET_PACKS");
      expect((err as Error).message).toBe("Missing required env var: R2_BUCKET_PACKS");
    }
  });

  it("treats empty and whitespace-only values as missing", () => {
    expect(() => readRecoverEnv({ ...ALL, LS_API_KEY: "" })).toThrow(MissingEnvError);
    expect(() => readRecoverEnv({ ...ALL, LS_API_KEY: "   " })).toThrow(MissingEnvError);
  });
});

describe("readOrdersStoreEnv", () => {
  it("is null (Netlify Blobs) when SUPABASE_URL is not set", () => {
    expect(readOrdersStoreEnv(ALL)).toBeNull();
    expect(readOrdersStoreEnv({ ...ALL, SUPABASE_URL: " " })).toBeNull();
  });

  it("returns the Supabase config when both variables are set", () => {
    expect(
      readOrdersStoreEnv({
        SUPABASE_URL: "https://abcd.supabase.co",
        SUPABASE_SECRET_KEY: "sb_secret_x",
      }),
    ).toEqual({ url: "https://abcd.supabase.co", secretKey: "sb_secret_x" });
  });

  it("refuses a Supabase URL without its secret key instead of falling back to Blobs", () => {
    expect(() => readOrdersStoreEnv({ SUPABASE_URL: "https://abcd.supabase.co" })).toThrow(
      new MissingEnvError("SUPABASE_SECRET_KEY"),
    );
  });
});
