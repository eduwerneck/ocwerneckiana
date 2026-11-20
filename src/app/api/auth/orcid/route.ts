import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppBaseUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clientId = (process.env.ORCID_CLIENT_ID || "").trim();
  const clientSecret = (process.env.ORCID_CLIENT_SECRET || "").trim();
  const baseUrl = getAppBaseUrl(request.nextUrl.origin);

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=orcid_not_configured`);
  }

  const isSandbox = process.env.ORCID_USE_SANDBOX === "true";
  const orcidDomain = isSandbox ? "https://sandbox.orcid.org" : "https://orcid.org";

  const state = crypto.randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("oauth_orcid_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  const redirectUri = `${baseUrl}/api/auth/orcid/callback`;
  const authUrl = new URL(`${orcidDomain}/oauth/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "/authenticate");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
