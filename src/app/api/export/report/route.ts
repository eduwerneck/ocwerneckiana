import { NextRequest, NextResponse } from "next/server";
import { 
  generateSubmissionsReportCsv, 
  generatePresentationsReportCsv, 
  generateMetadataReportCsv 
} from "@/lib/ocs-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "submissions";
  const schedConfId = searchParams.get("schedConfId") ? Number(searchParams.get("schedConfId")) : 1;

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
    return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 });
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
