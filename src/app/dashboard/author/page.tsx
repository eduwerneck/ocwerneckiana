import Link from "next/link";
import { getSubmissionsForAuthor } from "@/lib/ocs-service";
import { Send, ChevronRight } from "lucide-react";
import AuthorSubmissionsClient from "./AuthorSubmissionsClient";

export const dynamic = "force-dynamic";

export default async function AuthorDashboardPage() {
  // Usuário padrão de demonstração: Dr. Lucas Martins (ID 6)
  const papers = getSubmissionsForAuthor(6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-700">Início</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800">Painel do Autor</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Papel: Autor
            </span>
            <span className="text-xs text-slate-500">• Dr. Lucas Martins (UNESP)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Minhas Submissões Acadêmicas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe o status editorial, envie versões corrigidas para reavaliação e visualize decisões.
          </p>
        </div>

        <Link
          href="/conference/citeca/submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg text-xs shadow-xs transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Nova Submissão</span>
        </Link>
      </div>

      {/* Submissões com suporte a envio de versão corrigida */}
      <AuthorSubmissionsClient papers={papers} />
    </div>
  );
}
