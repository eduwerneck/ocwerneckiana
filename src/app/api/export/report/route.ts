import { NextRequest, NextResponse } from "next/server";
import {
  generateSubmissionsReportCsv,
  generatePresentationsReportCsv,
  generateMetadataReportCsv,
} from "@/lib/ocs-service";
import { ADMIN_ROLES, requireApiAuth } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(ADMIN_ROLES);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "submissions";
  const rawSchedId = searchParams.get("schedConfId");
  const schedConfId = rawSchedId ? parsePositiveInt(rawSchedId) : 1;

  if (!schedConfId) {
    return NextResponse.json({ success: false, error: "schedConfId inválido." }, { status: 400 });
  }

  let csvContent = "";
  let filename = "relatorio_ocw.csv";

  if (type === "submissions") {
    csvContent = generateSubmissionsReportCsv(schedConfId);
    filename = `relatorio_submissoes_edicao_${schedConfId}.csv`;
  } else if (type === "presentations") {
    csvContent = generatePresentationsReportCsv(schedConfId);
    filename = `relatorio_apresentacoes_presencas_${schedConfId}.csv`;
  } else if (type === "metadata") {
    csvContent = generateMetadataReportCsv(schedConfId);
    filename = `relatorio_metadados_lattes_dois_${schedConfId}.csv`;
  } else {
    return NextResponse.json({ success: false, error: "Tipo de relatório inválido." }, { status: 400 });
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
