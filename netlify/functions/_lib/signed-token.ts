import { SignJWT, jwtVerify, errors as joseErrors } from "jose";

export interface DownloadTokenPayload {
  /**
   * Our own UUID for the order — primary key in the orders store.
   *
   * Invariant: this is NEVER the Lemon Squeezy order id (`lsOrderId`). LS ids
   * are buyer-visible and re-typed by humans into /recover; mixing them into
   * the JWT would let a buyer-visible identifier function as a capability
   * lookup key. Keeping `orderId` opaque means /download resolves the Order
   * directly without any pointer indirection.
   */
  orderId: string;
  /** Pack the buyer is entitled to download. */
  packSlug: string;
  /** Buyer email — re-used by /recover to validate ownership. */
  email: string;
}

export interface IssueTokenOpts {
  payload: DownloadTokenPayload;
  /** TTL in seconds. Webhook issues 30d, recover re-issues 7d. */
  ttlSeconds: number;
  /** Raw secret string. Caller passes from env so tests can inject. */
  secret: string;
  /**
   * Issued-at, in epoch seconds. Defaults to Date.now/1000. Callers that
   * inject a clock (e.g. process-order with `deps.now()`) should pass it
   * here so the JWT exp matches what they wrote to the store.
   */
  iat?: number;
}

const ISSUER = "gradientwall";
const AUDIENCE = "gradientwall-download";

export async function issueDownloadToken({ payload, ttlSeconds, secret, iat }: IssueTokenOpts): Promise<string> {
  const key = encodeSecret(secret);
  const issuedAt = iat ?? Math.floor(Date.now() / 1000);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + ttlSeconds)
    .sign(key);
}

export type VerifyResult =
  | { ok: true; payload: DownloadTokenPayload }
  | { ok: false; reason: "invalid" | "expired" };

export async function verifyDownloadToken(token: string, secret: string): Promise<VerifyResult> {
  try {
    const { payload } = await jwtVerify(token, encodeSecret(secret), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (
      typeof payload.orderId !== "string" ||
      typeof payload.packSlug !== "string" ||
      typeof payload.email !== "string"
    ) {
      return { ok: false, reason: "invalid" };
    }
    return {
      ok: true,
      payload: {
        orderId: payload.orderId,
        packSlug: payload.packSlug,
        email: payload.email,
      },
    };
  } catch (e) {
    if (e instanceof joseErrors.JWTExpired) return { ok: false, reason: "expired" };
    return { ok: false, reason: "invalid" };
  }
}

function encodeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}
