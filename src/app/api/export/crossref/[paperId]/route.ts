import { NextRequest, NextResponse } from "next/server";
import { generateCrossrefXml } from "@/lib/ocs-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paperId: string }> }
) {
  const resolvedParams = await params;
  const paperId = parseInt(resolvedParams.paperId, 10);
  if (isNaN(paperId)) {
    return new NextResponse("Invalid Paper ID", { status: 400 });
  }

  const origin = req.nextUrl.origin || "http://localhost:3000";

  const xml = generateCrossrefXml({
    paperId,
    baseUrl: origin,
  });

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="crossref_paper_${paperId}.xml"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
