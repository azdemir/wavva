/**
 * AES-256-GCM encryption for QuickBooks OAuth tokens at rest.
 * Key comes from QBO_TOKEN_KEY (32 random bytes, base64-encoded).
 * Plaintext tokens never leave server code.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  const raw = process.env.QBO_TOKEN_KEY;
  if (!raw) throw new Error("QBO_TOKEN_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("QBO_TOKEN_KEY must be 32 bytes, base64-encoded");
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptToken(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
