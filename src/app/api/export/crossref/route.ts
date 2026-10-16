import { NextRequest, NextResponse } from "next/server";
import { generateCrossrefXml } from "@/lib/ocs-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const schedConfIdParam = searchParams.get("schedConfId");
  const schedConfId = schedConfIdParam ? parseInt(schedConfIdParam, 10) : 1;
  const origin = req.nextUrl.origin || "http://localhost:3000";

  const xml = generateCrossrefXml({
    schedConfId,
    baseUrl: origin,
  });

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": 'attachment; filename="crossref_citeca2026_proceedings.xml"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
