import crypto from "node:crypto";
import db from "./db.ts";
import { hashPassword, verifyPassword } from "./password.ts";

export { hashPassword, verifyPassword };

export type UserRole = "admin" | "manager" | "director" | "reviewer" | "author" | "reader";

export const ADMIN_ROLES: readonly UserRole[] = ["admin", "manager", "director"];

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  affiliation: string | null;
  role: UserRole;
}

export const SESSION_COOKIE_NAME = "ocw_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export function hashSessionToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function createSessionRecord(userId: number, ttlMs: number = SESSION_TTL_MS): { rawToken: string; expiresAt: Date } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + ttlMs);
  const expiresIso = expiresAt.toISOString();

  // Limpeza oportunista de sessões expiradas do usuário
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at <= ?").run(userId, new Date().toISOString());
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(tokenHash, userId, expiresIso);

  return { rawToken, expiresAt };
}

export function getSessionUserByToken(rawToken: string | undefined | null): SessionUser | null {
  if (!rawToken || rawToken.length < 32) return null;
  const tokenHash = hashSessionToken(rawToken);
  const nowIso = new Date().toISOString();

  const row = db.prepare(`
    SELECT u.id, u.username, u.email, u.full_name, u.affiliation, u.role, s.expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(tokenHash) as (SessionUser & { expires_at: string }) | undefined;

  if (!row) return null;
  if (row.expires_at <= nowIso) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    full_name: row.full_name,
    affiliation: row.affiliation,
    role: row.role,
  };
}

export function deleteSessionByToken(rawToken: string | undefined | null): void {
  if (!rawToken) return;
  const tokenHash = hashSessionToken(rawToken);
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

export function revokeUserSessions(userId: number): void {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function authenticateCredentials(identifier: string, password: string): SessionUser | null {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized || !password) return null;

  const user = db.prepare(`
    SELECT id, username, email, full_name, affiliation, role, password_hash
    FROM users
    WHERE LOWER(username) = ? OR LOWER(email) = ?
    LIMIT 1
  `).get(normalized, normalized) as (SessionUser & { password_hash: string | null }) | undefined;

  if (!user || !user.password_hash) return null;
  if (!verifyPassword(password, user.password_hash)) return null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    affiliation: user.affiliation,
    role: user.role,
  };
}

// Rate limiting simples em memória (deploy single-node VPS/Docker)
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 10;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= RATE_MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true };
}

export function clearLoginRateLimit(key: string): void {
  loginAttempts.delete(key);
}
