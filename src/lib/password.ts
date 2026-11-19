import crypto from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

/**
 * Gera hash de senha usando scrypt com salt aleatório de 16 bytes.
 * Formato armazenado: `scrypt:<saltHex>:<derivedKeyHex>`.
 */
export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(plain, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

/**
 * Verifica senha em tempo constante contra o hash armazenado.
 */
export function verifyPassword(plain: string, stored: string | null | undefined): boolean {
  if (!stored || !plain) return false;
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  if (!salt || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(plain, salt, expected.length, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}
