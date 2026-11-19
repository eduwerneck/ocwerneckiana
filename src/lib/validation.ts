/**
 * Validação tipada de entradas para Server Actions e API Routes (sem dependências externas).
 */

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/;
const ALLOWED_ROLES = new Set(["admin", "manager", "director", "reviewer", "author", "reader"]);
const ALLOWED_DECISIONS = new Set(["accept", "revisions", "reject"]);
const ALLOWED_PRESENTATION_TYPES = new Set(["oral", "poster", "workshop"]);
const ALLOWED_REF_STYLES = new Set(["abnt", "apa"]);

export function parsePositiveInt(raw: FormDataEntryValue | string | number | null | undefined): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function parseBoundedInt(
  raw: FormDataEntryValue | string | number | null | undefined,
  min: number,
  max: number,
  fallback?: number
): number | null {
  if (raw === null || raw === undefined || raw === "") {
    return fallback !== undefined ? fallback : null;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

export function parseNonEmptyString(
  raw: FormDataEntryValue | string | null | undefined,
  maxLength: number = 10000
): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

export function parseOptionalString(
  raw: FormDataEntryValue | string | null | undefined,
  maxLength: number = 10000
): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function isValidRole(role: string): role is "admin" | "manager" | "director" | "reviewer" | "author" | "reader" {
  return ALLOWED_ROLES.has(role);
}

export function isValidDecision(decision: string): decision is "accept" | "revisions" | "reject" {
  return ALLOWED_DECISIONS.has(decision);
}

export function isValidPresentationType(type: string): boolean {
  return ALLOWED_PRESENTATION_TYPES.has(type);
}

export function isValidRefStyle(style: string): style is "abnt" | "apa" {
  return ALLOWED_REF_STYLES.has(style);
}
