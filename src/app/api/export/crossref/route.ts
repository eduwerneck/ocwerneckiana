import { NextRequest, NextResponse } from "next/server";
import { generateCrossrefXml } from "@/lib/ocs-service";
import { getAppBaseUrl } from "@/lib/security";
import { parsePositiveInt } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get("schedConfId");
  const schedConfId = rawId ? parsePositiveInt(rawId) : 1;
  if (!schedConfId) {
    return new NextResponse("Invalid schedConfId", { status: 400 });
  }

  const baseUrl = getAppBaseUrl(req.nextUrl.origin);
  const xml = generateCrossrefXml({
    schedConfId,
    baseUrl,
  });

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="crossref_proceedings_sched_${schedConfId}.xml"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
