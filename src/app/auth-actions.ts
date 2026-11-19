"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import {
  ADMIN_ROLES,
  authenticateCredentials,
  checkLoginRateLimit,
  clearLoginRateLimit,
  createSession,
  destroySession,
  hashPassword,
} from "@/lib/auth";
import { sanitizeNextPath } from "@/lib/security";
import { isValidEmail, parseNonEmptyString, parseOptionalString } from "@/lib/validation";

export async function loginAction(formData: FormData): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  const identifier = parseNonEmptyString(formData.get("username"), 200);
  const password = parseNonEmptyString(formData.get("password"), 200);
  const rawNext = parseOptionalString(formData.get("next"), 300);

  if (!identifier || !password) {
    return { success: false, error: "Informe usuário/e-mail e senha." };
  }

  const rateKey = identifier.toLowerCase();
  const limit = checkLoginRateLimit(rateKey);
  if (!limit.allowed) {
    return {
      success: false,
      error: `Muitas tentativas de acesso. Tente novamente em ${limit.retryAfterSec ?? 60}s.`,
    };
  }

  const user = authenticateCredentials(identifier, password);
  if (!user) {
    return { success: false, error: "Credenciais inválidas." };
  }

  clearLoginRateLimit(rateKey);
  await createSession(user.id);

  const defaultTarget = ADMIN_ROLES.includes(user.role) ? "/dashboard/director" : "/dashboard/user";
  const redirectTo = sanitizeNextPath(rawNext, defaultTarget);

  revalidatePath("/", "layout");
  return { success: true, redirectTo };
}

export async function registerUserAction(formData: FormData): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  const fullName = parseNonEmptyString(formData.get("full_name"), 150);
  const email = parseNonEmptyString(formData.get("email"), 254)?.toLowerCase();
  const affiliation = parseOptionalString(formData.get("affiliation"), 200);
  const password = parseNonEmptyString(formData.get("password"), 200);

  if (!fullName || !email || !isValidEmail(email)) {
    return { success: false, error: "Informe nome completo e um e-mail válido." };
  }
  if (!password || password.length < 8) {
    return { success: false, error: "A senha deve ter pelo menos 8 caracteres." };
  }

  const existing = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(email) as { id: number } | undefined;
  if (existing) {
    return { success: false, error: "Este e-mail já está cadastrado." };
  }

  const baseUsername = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase().slice(0, 24) || "user";
  const suffix = crypto.randomBytes(3).toString("hex");
  const username = `${baseUsername}_${suffix}`;
  const passwordHash = hashPassword(password);

  try {
    const res = db.prepare(`
      INSERT INTO users (username, email, full_name, affiliation, role, bio, password_hash)
      VALUES (?, ?, ?, ?, 'author', '', ?)
    `).run(username, email, fullName, affiliation, passwordHash);

    await createSession(Number(res.lastInsertRowid));
    revalidatePath("/", "layout");
    return { success: true, redirectTo: "/dashboard/user" };
  } catch {
    return { success: false, error: "Não foi possível criar a conta. Tente novamente." };
  }
}

export async function demoLoginAction(role: "admin" | "user"): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  if (process.env.OCW_DEMO_MODE !== "true") {
    return { success: false, error: "Modo de demonstração desabilitado." };
  }

  const targetUsername = role === "admin" ? "director" : "author";
  const user = db.prepare("SELECT id FROM users WHERE username = ? LIMIT 1").get(targetUsername) as { id: number } | undefined;
  if (!user) {
    return { success: false, error: "Usuário de demonstração não encontrado (execute o seed primeiro)." };
  }

  await createSession(user.id);
  revalidatePath("/", "layout");
  return {
    success: true,
    redirectTo: role === "admin" ? "/dashboard/director" : "/dashboard/user",
  };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/login");
}
