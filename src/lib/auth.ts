import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  ADMIN_ROLES,
  createSessionRecord,
  getSessionUserByToken,
  deleteSessionByToken,
  revokeUserSessions,
  authenticateCredentials,
  hashPassword,
  verifyPassword,
  checkLoginRateLimit,
  clearLoginRateLimit,
  type SessionUser,
  type UserRole,
} from "./auth-core";

export {
  ADMIN_ROLES,
  SESSION_COOKIE_NAME,
  revokeUserSessions,
  authenticateCredentials,
  hashPassword,
  verifyPassword,
  checkLoginRateLimit,
  clearLoginRateLimit,
  type SessionUser,
  type UserRole,
};

export class AuthError extends Error {
  status: 401 | 403;
  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function createSession(userId: number): Promise<void> {
  const { rawToken, expiresAt } = createSessionRecord(userId, SESSION_TTL_MS);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getSessionUserByToken(rawToken);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  deleteSessionByToken(rawToken);
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Guarda de autenticação/autorização para Server Components (Pages).
 * Redireciona para /login se não autenticado ou para /dashboard/user se papel insuficiente.
 */
export async function requirePageAuth(
  allowedRoles?: readonly UserRole[],
  currentPath: string = "/dashboard/user"
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Guarda de autenticação/autorização para Server Actions.
 * Retorna o usuário autenticado ou erro estruturado (sem redirect).
 */
export async function requireActionAuth(
  allowedRoles?: readonly UserRole[]
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Autenticação necessária. Faça login para continuar." };
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { ok: false, error: "Permissão insuficiente para executar esta ação." };
  }
  return { ok: true, user };
}

/**
 * Guarda de autenticação/autorização para Route Handlers (/api/**).
 * Retorna NextResponse JSON 401/403 em caso de falha.
 */
export async function requireApiAuth(
  allowedRoles?: readonly UserRole[]
): Promise<{ ok: true; user: SessionUser } | { ok: false; response: NextResponse }> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Não autenticado." }, { status: 401 }),
    };
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Acesso negado." }, { status: 403 }),
    };
  }
  return { ok: true, user };
}
