import { NextRequest, NextResponse } from "next/server";
import { generateOaiPmhResponse } from "@/lib/ocs-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const verb = searchParams.get("verb");
  const identifier = searchParams.get("identifier") || undefined;
  const metadataPrefix = searchParams.get("metadataPrefix") || undefined;
  const from = searchParams.get("from") || undefined;
  const until = searchParams.get("until") || undefined;
  const set = searchParams.get("set") || undefined;
  const resumptionToken = searchParams.get("resumptionToken") || undefined;

  const origin = req.nextUrl.origin || "http://localhost:3000";

  const xml = generateOaiPmhResponse(
    verb,
    { identifier, metadataPrefix, from, until, set, resumptionToken },
    origin
  );

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(req: NextRequest) {
  let bodyParams: Record<string, string> = {};
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((val, key) => {
        bodyParams[key] = val;
      });
    } else if (contentType.includes("application/json")) {
      bodyParams = await req.json();
    }
  } catch {
    // Ignore parse error and fall back
  }

  const { searchParams } = new URL(req.url);
  const verb = bodyParams.verb || searchParams.get("verb");
  const identifier = bodyParams.identifier || searchParams.get("identifier") || undefined;
  const metadataPrefix = bodyParams.metadataPrefix || searchParams.get("metadataPrefix") || undefined;
  const from = bodyParams.from || searchParams.get("from") || undefined;
  const until = bodyParams.until || searchParams.get("until") || undefined;
  const set = bodyParams.set || searchParams.get("set") || undefined;
  const resumptionToken = bodyParams.resumptionToken || searchParams.get("resumptionToken") || undefined;

  const origin = req.nextUrl.origin || "http://localhost:3000";

  const xml = generateOaiPmhResponse(
    verb,
    { identifier, metadataPrefix, from, until, set, resumptionToken },
    origin
  );

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
