import Link from "next/link";
import { getRegistrations } from "@/lib/ocs-service";
import { 
  FileCheck, 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  Calendar,
  MapPin
} from "lucide-react";
import RegisterFormClient from "./RegisterFormClient";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const registrations = getRegistrations(1) as Array<{
    id: number;
    full_name: string;
    email: string;
    affiliation: string;
    category: string;
    date_registered: string;
  }>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-700">Início</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800">Inscrições & Credenciamento</span>
      </nav>

      {/* Cabeçalho */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
              Credenciamento Oficial de Participantes
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Inscrições no X CITECA 2026
            </h1>
            <p className="text-xs text-slate-500">
              Garanta seu certificado de participação, acesso às sessões orais e coffee breaks do congresso.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            <Users className="w-4 h-4 text-emerald-600" />
            <span><strong>{registrations.length}</strong> inscritos confirmados</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulário de Inscrição */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>Formulário de Inscrição</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Preencha seus dados para emissão do credenciamento.</p>
          </div>

          <RegisterFormClient />
        </div>

        {/* Lista de Inscritos Confirmados */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Participantes Credenciados</span>
            </h3>
            <p className="text-xs text-slate-500">Credenciais geradas pelo sistema OCS.</p>
          </div>

          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
            {registrations.map((reg) => (
              <div key={reg.id} className="py-3 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{reg.full_name}</span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {reg.category}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>{reg.affiliation}</span>
                  <span className="text-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Confirmado</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
