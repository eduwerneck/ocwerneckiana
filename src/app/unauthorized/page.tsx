import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { formatRoleLabel, getRoleBadgeClasses } from "@/lib/role-labels";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Acesso Restrito | Open Conference Werneckiana",
};

export default async function UnauthorizedPage() {
  const sessionUser = await getSessionUser();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-black text-slate-900">Acesso Restrito</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sua conta não possui permissão para acessar esta área. Esta rota é exclusiva para a coordenação editorial/administração.
          </p>
        </div>

        {sessionUser && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
            <p className="font-bold text-slate-800">{sessionUser.full_name}</p>
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeClasses(
                sessionUser.role
              )}`}
            >
              Perfil atual: {formatRoleLabel(sessionUser.role)}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          {sessionUser ? (
            <Link
              href="/dashboard/user"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Meu Painel</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar com outra conta</span>
            </Link>
          )}
          <Link
            href="/"
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition"
          >
            Ir para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}
