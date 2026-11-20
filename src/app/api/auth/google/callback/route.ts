import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/lib/db";
import { ADMIN_ROLES, createSession, type UserRole } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const baseUrl = getAppBaseUrl(request.nextUrl.origin);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_denied`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_google_state")?.value;
  cookieStore.delete("oauth_google_state");

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`);
  }

  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_not_configured`);
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_token_failed`);
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_token_failed`);
    }

    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!userinfoRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_profile_failed`);
    }

    const profile = (await userinfoRes.json()) as {
      id?: string;
      email?: string;
      verified_email?: boolean;
      name?: string;
    };

    const googleId = (profile.id || "").trim();
    const email = (profile.email || "").trim().toLowerCase();
    const fullName = (profile.name || "Usuário Google").trim().slice(0, 150);

    // Exigir e-mail verificado pelo Google antes de criar ou vincular conta
    if (!googleId || !email || profile.verified_email !== true) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_unverified_email`);
    }

    let user = db
      .prepare("SELECT id, role, google_id FROM users WHERE google_id = ? OR LOWER(email) = ? LIMIT 1")
      .get(googleId, email) as { id: number; role: UserRole; google_id: string | null } | undefined;

    if (!user) {
      const baseUsername = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase().slice(0, 24) || "user";
      const username = `${baseUsername}_${crypto.randomBytes(3).toString("hex")}`;
      const inserted = db.prepare(`
        INSERT INTO users (username, email, full_name, affiliation, role, bio, google_id, auth_provider)
        VALUES (?, ?, ?, '', 'author', '', ?, 'google')
      `).run(username, email, fullName, googleId);
      user = { id: Number(inserted.lastInsertRowid), role: "author", google_id: googleId };
    } else if (!user.google_id) {
      db.prepare("UPDATE users SET google_id = ? WHERE id = ?").run(googleId, user.id);
    }

    await createSession(user.id);
    const target = ADMIN_ROLES.includes(user.role) ? "/dashboard/director" : "/dashboard/user";
    return NextResponse.redirect(`${baseUrl}${target}`);
  } catch {
    return NextResponse.redirect(`${baseUrl}/login?error=google_network_error`);
  }
}
