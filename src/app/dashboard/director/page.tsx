import Link from "next/link";
import { getAllConferences, getAllSubmissionsForDirector, getAllUsers, getEmailLogs, getPublicSmtpSettings } from "@/lib/ocs-service";
import { ADMIN_ROLES, requirePageAuth } from "@/lib/auth";
import { formatRoleLabel } from "@/lib/role-labels";
import { BookOpen, ChevronRight, UserCheck } from "lucide-react";
import DirectorActionsClient from "./DirectorActionsClient";

export const dynamic = "force-dynamic";

export default async function DirectorDashboardPage() {
  const sessionUser = await requirePageAuth(ADMIN_ROLES, "/dashboard/director");

  const submissions = getAllSubmissionsForDirector();
  const allUsers = getAllUsers();
  const conferences = getAllConferences();
  const reviewers = allUsers.filter((u) => u.role === "reviewer" || u.is_reviewer_candidate === 1);
  const emailLogs = getEmailLogs(50);
  const smtpSettings = getPublicSmtpSettings();

  const total = submissions.length;
  const unassigned = submissions.filter((p) => p.status === "submitted").length;
  const underReview = submissions.filter((p) => p.status === "under_review").length;
  const revisions = submissions.filter((p) => p.status === "revisions_required").length;
  const accepted = submissions.filter((p) => p.status === "accepted" || p.status === "published").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-700">Início</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800">Painel do Coordenador</span>
      </nav>

      {/* Cabeçalho */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              {formatRoleLabel(sessionUser.role)}
            </span>
            <span className="text-xs text-slate-500">
              • {sessionUser.full_name}{sessionUser.affiliation ? ` (${sessionUser.affiliation})` : ""}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Painel do Coordenador (Gestão &amp; Funções)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de novas conferências, atribuição de papéis aos usuários e coordenação editorial de pareceres.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/user?tab=author"
            className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold px-3.5 py-2 rounded-lg text-xs transition flex items-center space-x-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Modo Autor / Avaliador</span>
          </Link>
          <Link
            href="/proceedings"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-lg text-xs transition flex items-center space-x-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ver Anais Publicados</span>
          </Link>
        </div>
      </div>

      {/* Cartões Métricos */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Submissões</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{total}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Sem Parecerista</span>
          <span className="text-2xl font-extrabold text-slate-600 mt-1 block">{unassigned}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">Em Avaliação</span>
          <span className="text-2xl font-extrabold text-blue-700 mt-1 block">{underReview}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Revisões</span>
          <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{revisions}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Aceitos / Publicados</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{accepted}</span>
        </div>
      </div>

      <DirectorActionsClient
        submissions={submissions}
        reviewers={reviewers}
        allUsers={allUsers}
        conferences={conferences}
        emailLogs={emailLogs}
        smtpSettings={smtpSettings}
      />
    </div>
  );
}
