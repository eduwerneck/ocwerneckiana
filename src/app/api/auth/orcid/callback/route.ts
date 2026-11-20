import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/lib/db";
import { ADMIN_ROLES, createSession, getSessionUser, type UserRole } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const baseUrl = getAppBaseUrl(request.nextUrl.origin);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/login?error=orcid_denied`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_orcid_state")?.value;
  cookieStore.delete("oauth_orcid_state");

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`);
  }

  const clientId = (process.env.ORCID_CLIENT_ID || "").trim();
  const clientSecret = (process.env.ORCID_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=orcid_not_configured`);
  }

  const isSandbox = process.env.ORCID_USE_SANDBOX === "true";
  const tokenEndpoint = isSandbox
    ? "https://sandbox.orcid.org/oauth/token"
    : "https://orcid.org/oauth/token";
  const redirectUri = `${baseUrl}/api/auth/orcid/callback`;

  try {
    const tokenRes = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=orcid_token_failed`);
    }

    const tokenData = (await tokenRes.json()) as { orcid?: string; name?: string };
    const orcidId = (tokenData.orcid || "").trim();
    const orcidName = (tokenData.name || `Pesquisador (${orcidId})`).trim().slice(0, 150);

    if (!orcidId) {
      return NextResponse.redirect(`${baseUrl}/login?error=missing_orcid`);
    }

    // Se já existir usuário autenticado na sessão, vincula o ORCID autenticado ao perfil atual
    const currentSession = await getSessionUser();
    let user = db
      .prepare("SELECT id, role FROM users WHERE orcid = ? LIMIT 1")
      .get(orcidId) as { id: number; role: UserRole } | undefined;

    if (!user && currentSession) {
      db.prepare("UPDATE users SET orcid = ? WHERE id = ?").run(orcidId, currentSession.id);
      user = { id: currentSession.id, role: currentSession.role };
    }

    if (!user) {
      const compactId = orcidId.replace(/[^0-9X]/gi, "").toLowerCase();
      const username = `orcid_${compactId}_${crypto.randomBytes(2).toString("hex")}`;
      const fallbackEmail = `${compactId}@orcid.placeholder`;
      const inserted = db.prepare(`
        INSERT INTO users (username, email, full_name, affiliation, role, bio, orcid, auth_provider)
        VALUES (?, ?, ?, '', 'author', '', ?, 'orcid')
      `).run(username, fallbackEmail, orcidName, orcidId);
      user = { id: Number(inserted.lastInsertRowid), role: "author" };
    }

    await createSession(user.id);
    const target = ADMIN_ROLES.includes(user.role) ? "/dashboard/director" : "/dashboard/user";
    return NextResponse.redirect(`${baseUrl}${target}`);
  } catch {
    return NextResponse.redirect(`${baseUrl}/login?error=orcid_network_error`);
  }
}
