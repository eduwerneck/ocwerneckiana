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
  const rorId = parseOptionalString(formData.get("ror_id"), 120);
  const rawOrcid = parseOptionalString(formData.get("orcid"), 100);
  const orcid = rawOrcid
    .replace(/^https?:\/\/(sandbox\.)?orcid\.org\//i, "")
    .trim()
    .toUpperCase();
  const wantsReviewer = formData.get("wants_reviewer") === "true";
  const reviewInterests = parseOptionalString(formData.get("review_interests"), 1000);
  const academicTitle = parseOptionalString(formData.get("academic_title"), 150);
  const password = parseNonEmptyString(formData.get("password"), 200);

  if (!fullName || !email || !isValidEmail(email)) {
    return { success: false, error: "Informe nome completo e um e-mail válido." };
  }
  if (orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid)) {
    return { success: false, error: "Formato de ORCID inválido. Use 0000-0000-0000-0000." };
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
  const reviewerStatus = wantsReviewer ? "pending" : "none";

  try {
    const res = db.prepare(`
      INSERT INTO users (
        username, email, full_name, affiliation, ror_id, orcid, academic_title,
        role, bio, password_hash, is_reviewer_candidate, reviewer_status, review_interests, auth_provider
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'author', '', ?, ?, ?, ?, 'local')
    `).run(
      username,
      email,
      fullName,
      affiliation,
      rorId || null,
      orcid || null,
      wantsReviewer ? academicTitle || null : null,
      passwordHash,
      wantsReviewer ? 1 : 0,
      reviewerStatus,
      wantsReviewer ? reviewInterests : null
    );

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
