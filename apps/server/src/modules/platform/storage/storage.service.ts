import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@propertyos/env/server";

import { s3Client } from "./storage.client";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/**
 * Documents that may accompany a record but are not images -- a vendor's
 * invoice is as often a PDF as a photo.
 */
const ALLOWED_DOCUMENT_TYPES = new Set(["application/pdf"]);

/** Extensions are derived from the MIME type, not from the uploaded name. */
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "application/pdf": "pdf",
};

function extensionForType(type: string) {
  return EXTENSION_BY_TYPE[type] ?? type.split("/")[1] ?? "bin";
}

export function isAllowedImageType(type: string) {
  return ALLOWED_IMAGE_TYPES.has(type);
}

/** Images plus PDFs, for attachments like receipts. */
export function isAllowedDocumentType(type: string) {
  return ALLOWED_IMAGE_TYPES.has(type) || ALLOWED_DOCUMENT_TYPES.has(type);
}

/** Turns a public R2 URL back into its object key, or null if it's not one of ours. */
export function keyFromPublicUrl(url: string): string | null {
  const prefix = `${env.CLOUDFLARE_PUBLIC_URL}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

/** Shared by the image and document paths once the type has been vetted. */
async function put(file: File, pathSegments: string[]) {
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
}

export const storageService = {
  async uploadImage(file: File, pathSegments: string[]) {
    if (!isAllowedImageType(file.type)) {
      throw new Error(`Unsupported image type: ${file.type}`);
    }
    return put(file, pathSegments);
  },

  /** Uploads an image or a PDF, for attachments such as receipts. */
  async uploadDocument(file: File, pathSegments: string[]) {
    if (!isAllowedDocumentType(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
    return put(file, pathSegments);
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
