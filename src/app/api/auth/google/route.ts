import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppBaseUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  const baseUrl = getAppBaseUrl(request.nextUrl.origin);

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_not_configured`);
  }

  const state = crypto.randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("oauth_google_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authUrl.toString());
}
