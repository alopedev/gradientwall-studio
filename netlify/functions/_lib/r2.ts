import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

/**
 * Build a presigned GET URL for an object in R2 with the given TTL.
 *
 * R2 is S3-compatible; we point the SDK at the R2 endpoint and use signature
 * v4. The endpoint shape `https://{accountId}.r2.cloudflarestorage.com`
 * comes from Cloudflare's dashboard.
 */
export async function presignDownloadUrl(config: R2Config, key: string, ttlSeconds: number): Promise<string> {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  const cmd = new GetObjectCommand({ Bucket: config.bucket, Key: key });
  return getSignedUrl(client, cmd, { expiresIn: ttlSeconds });
}

/** Canonical key in the packs bucket: `packs/{slug}/{slug}.zip`. */
export function packZipKey(slug: string): string {
  return `packs/${slug}/${slug}.zip`;
}
