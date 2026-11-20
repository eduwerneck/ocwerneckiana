import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES, requireApiAuth } from "@/lib/auth";
import { getActiveSchedConf } from "@/lib/ocs-service";
import { buildStaticProceedingsArchive } from "@/lib/proceedings-archive";
import { parsePositiveInt } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(ADMIN_ROLES);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const requestedId = parsePositiveInt(searchParams.get("schedConfId"));
  const sched = getActiveSchedConf(requestedId ?? undefined);
  if (!sched) {
    return NextResponse.json({ error: "Edição de conferência não encontrada." }, { status: 404 });
  }

  try {
    const archive = buildStaticProceedingsArchive(sched.id);
    return new NextResponse(new Uint8Array(archive.zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${archive.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar pacote estático dos anais." },
      { status: 500 }
    );
  }
}
