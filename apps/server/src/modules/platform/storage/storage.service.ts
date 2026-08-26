import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@propertyos/env/server";

import { s3Client } from "./storage.client";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function extensionForType(type: string) {
  return type.split("/")[1] ?? "bin";
}

export function isAllowedImageType(type: string) {
  return ALLOWED_IMAGE_TYPES.has(type);
}

/** Turns a public R2 URL back into its object key, or null if it's not one of ours. */
export function keyFromPublicUrl(url: string): string | null {
  const prefix = `${env.CLOUDFLARE_PUBLIC_URL}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

export const storageService = {
  async uploadImage(file: File, pathSegments: string[]) {
    if (!isAllowedImageType(file.type)) {
      throw new Error(`Unsupported image type: ${file.type}`);
    }

    const key = [
      env.CLOUDFLARE_FOLDER_NAME,
      ...pathSegments,
      `${crypto.randomUUID()}.${extensionForType(file.type)}`,
    ].join("/");

    const buffer = new Uint8Array(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.CLOUDFLARE_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    return { key, url: `${env.CLOUDFLARE_PUBLIC_URL}/${key}` };
  },

  async deleteByUrl(url: string) {
    const key = keyFromPublicUrl(url);
    if (!key) return;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.CLOUDFLARE_BUCKET_NAME,
        Key: key,
      }),
    );
  },
};
