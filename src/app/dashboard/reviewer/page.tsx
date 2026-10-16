import Link from "next/link";
import { getAssignmentsForReviewer } from "@/lib/ocs-service";
import { 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  FileText, 
  ShieldCheck,
  Star
} from "lucide-react";
import ReviewerFormClient from "./ReviewerFormClient";

export const dynamic = "force-dynamic";

export default function ReviewerDashboardPage() {
  // Usuário padrão de demonstração: Profa. Dra. Beatriz Meireles (ID 4)
  const assignments = getAssignmentsForReviewer(4);

  const pending = assignments.filter((a) => a.status === "pending").length;
  const completed = assignments.filter((a) => a.status === "completed").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-700">Início</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800">Área do Avaliador (Parecerista)</span>
      </nav>

      {/* Cabeçalho */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Papel: Avaliador por Pares (Reviewer)
            </span>
            <span className="text-xs text-slate-500">• Profa. Dra. Beatriz Meireles (UFBA)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Pareceres e Avaliação Cega por Pares
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Avalie manuscritos anonimizados atribuídos pelo comitê editorial com base em critérios científicos objetivos.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-800 font-semibold">
            {pending} Pendente(s)
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800 font-semibold">
            {completed} Concluído(s)
          </div>
        </div>
      </div>

      {/* Lista de Avaliações */}
      <ReviewerFormClient assignments={assignments} />
    </div>
  );
}
