import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchedConfById, getPublishedProceedings } from "@/lib/ocs-service";
import { ChevronRight, ArrowLeft } from "lucide-react";
import VolumeProceedingsClient from "./VolumeProceedingsClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sched = getSchedConfById(Number(id));
  if (!sched) return { title: "Volume dos Anais Não Encontrado" };

  return {
    title: `Anais do ${sched.title} | Open Conference Werneckiana`,
    description: `Volume oficial de anais do ${sched.title}. Artigos completos em HTML com avaliação duplo-cega e acesso aberto.`,
  };
}

export default async function VolumeProceedingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; track?: string }>;
}) {
  const { id } = await params;
  const { q, track } = await searchParams;

  const schedId = Number(id);
  const sched = getSchedConfById(schedId);

  if (!sched) {
    notFound();
  }

  const trackId = track ? Number(track) : undefined;
  const papers = getPublishedProceedings(schedId, q, trackId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Breadcrumb e Retorno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <nav className="flex items-center space-x-2">
          <Link href="/" className="hover:text-blue-700">Início</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/proceedings" className="hover:text-blue-700">Catálogo de Anais</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
            {sched.title}
          </span>
        </nav>

        <Link
          href="/proceedings"
          className="inline-flex items-center space-x-1.5 text-blue-700 hover:text-blue-900 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Catálogo de Volumes</span>
        </Link>
      </div>

      <VolumeProceedingsClient sched={sched} papers={papers} initialQuery={q || ""} />
    </div>
  );
}
