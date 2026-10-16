import Link from "next/link";
import { getPublishedProceedings, getProceedingsVolumes } from "@/lib/ocs-service";
import { ChevronRight } from "lucide-react";
import ProceedingsClient from "./ProceedingsClient";

export const dynamic = "force-dynamic";

export default async function ProceedingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sched?: string; conf?: string }>;
}) {
  const { q, sched } = await searchParams;
  const schedId = sched ? Number(sched) : undefined;
  const papers = getPublishedProceedings(schedId, q);
  const volumes = getProceedingsVolumes();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-700">Início</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800">Catálogo Geral de Anais (Proceedings)</span>
      </nav>

      <ProceedingsClient volumes={volumes} papers={papers} initialQuery={q || ""} />
    </div>
  );
}
