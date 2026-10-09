/**
 * AES-256-GCM encryption for API import credentials at rest, plus
 * HMAC-SHA256 signing for OAuth `state` cookies (CSRF protection).
 *
 * The key comes from IMPORT_ENCRYPTION_KEY (32 random bytes, hex-encoded).
 * There is intentionally no fallback: if the key is missing, the import
 * integrations refuse to run with a clear setup error instead of using a
 * weak/hardcoded key.
 *
 * Generate a key with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const KEY_ENV = "IMPORT_ENCRYPTION_KEY";

/** True when the encryption key is present (UI can gate integrations on this). */
export function encryptionKeyAvailable(): boolean {
  return !!process.env[KEY_ENV];
}

function getKey(): Buffer {
  const raw = process.env[KEY_ENV];
  if (!raw) {
    throw new Error(
      "IMPORT_ENCRYPTION_KEY is not set — add it to your environment to enable API imports.",
    );
  }
  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error(
      "IMPORT_ENCRYPTION_KEY must be 32 bytes, hex-encoded (64 hex characters).",
    );
  }
  return key;
}

/** Encrypt a token. Returns `iv:ciphertext:tag`, all hex. */
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${ciphertext.toString("hex")}:${tag.toString("hex")}`;
}

/** Decrypt a value produced by encryptToken. Throws on malformed input. */
export function decryptToken(enc: string): string {
  const parts = (enc ?? "").split(":");
  if (parts.length !== 3 || parts.some((p) => !p)) {
    throw new Error("Malformed encrypted token.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(parts[0], "hex"),
  );
  decipher.setAuthTag(Buffer.from(parts[2], "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(parts[1], "hex")),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Create a signed OAuth state value: `raw.signature`, where signature is
 * HMAC-SHA256(raw). The signed value goes in the httpOnly cookie; the raw
 * half goes in the provider authorize URL's `state` param.
 */
export function signState(): { raw: string; signed: string } {
  const raw = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", getKey()).update(raw).digest("hex");
  return { raw, signed: `${raw}.${signature}` };
}

/** Verify a signed state cookie value against the raw `state` from the callback. */
export function verifyState(signed: string, raw: string): boolean {
  const dot = signed.lastIndexOf(".");
  if (dot <= 0 || !raw) return false;
  const expected = createHmac("sha256", getKey()).update(raw).digest("hex");
  const actual = signed.slice(dot + 1);
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
