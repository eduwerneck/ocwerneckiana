"use client";

import { useState } from "react";
import { AcademicCertificate } from "@/lib/email-service";
import { 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Calendar, 
  MapPin, 
  QrCode, 
  Copy, 
  Check, 
  Building2,
  FileText
} from "lucide-react";

interface Props {
  certificate: AcademicCertificate;
}

export default function CertificateViewClient({ certificate }: Props) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(certificate.certificate_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(certificate.issued_at || Date.now()).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const isPresentation = certificate.type === "presentation";

  return (
    <div className="space-y-6">
      {/* Botões de Ação do Topo (Ocultos na Impressão) */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30 uppercase">
              Declaração Emitida
            </span>
            <span className="text-xs text-blue-200">
              Emitido para <strong>{certificate.recipient_name}</strong>
            </span>
          </div>
          <h2 className="text-lg font-black tracking-tight">
            {certificate.title}
          </h2>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyCode}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            title="Copiar código de validação"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copiado!" : "Copiar Código"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition shadow-md flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar em PDF</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CORPO DO CERTIFICADO OFICIAL (FORMATO DIPLOMA ACADÊMICO) */}
      {/* ======================================================== */}
      <div className="relative bg-white border-8 border-double border-slate-700/80 rounded-3xl p-8 sm:p-14 shadow-2xl print:border-4 print:border-slate-800 print:shadow-none print:p-8 overflow-hidden">
        {/* Marca d'água central de fundo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <span className="text-[180px] font-black tracking-widest text-slate-900">OCW</span>
        </div>

        {/* Moldura ornamental superior */}
        <div className="flex flex-col items-center text-center space-y-4 border-b-2 border-slate-200 pb-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-400/60">
              OCW
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                Open Conference Werneckiana
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Comitê Científico & Coordenação de Conferências
              </p>
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <span className="text-[11px] tracking-widest font-black uppercase text-amber-700 block">
              {isPresentation ? "Declaração de Apresentação de Trabalho" : "Declaração de Parecerista Ad-hoc"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
              {certificate.title}
            </h1>
          </div>
        </div>

        {/* Texto do Certificado */}
        <div className="py-10 sm:py-12 text-center space-y-6 max-w-2xl mx-auto">
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-serif">
            {certificate.description}
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">
              {certificate.sched_title}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-center space-x-3">
              <span>{certificate.city || "São Paulo, SP"}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Rodapé Institucional com Assinaturas e Chave de Validação */}
        <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-xs">
          {/* Assinatura 1 */}
          <div className="text-center space-y-1">
            <div className="h-10 border-b border-slate-400 max-w-[180px] mx-auto flex items-end justify-center pb-1">
              <span className="font-serif italic text-slate-800 text-xs">Carlos Eduardo Dias</span>
            </div>
            <div className="font-bold text-slate-900 text-[11px]">Prof. Dr. Carlos Eduardo Dias</div>
            <div className="text-[10px] text-slate-500">Diretor do Comitê de Avaliação</div>
          </div>

          {/* Autenticidade & QR Code */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-center space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-center space-x-1 text-emerald-700 font-bold text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Autenticidade Verificada</span>
            </div>
            <div className="font-mono font-bold text-[10px] text-slate-900 break-all select-all">
              {certificate.certificate_code}
            </div>
            <div className="text-[9px] text-slate-400">
              Registrado permanentemente na base do OCW
            </div>
          </div>

          {/* Assinatura 2 */}
          <div className="text-center space-y-1">
            <div className="h-10 border-b border-slate-400 max-w-[180px] mx-auto flex items-end justify-center pb-1">
              <span className="font-serif italic text-slate-800 text-xs">Mariana Silveira</span>
            </div>
            <div className="font-bold text-slate-900 text-[11px]">Profa. Dra. Mariana Silveira</div>
            <div className="text-[10px] text-slate-500">Coordenação Geral da Conferência</div>
          </div>
        </div>

        {/* Rodapé Institucional */}
        <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
          Declaração emitida eletronicamente pelo <strong>Open Conference Werneckiana (OCW)</strong> para comprovação perante a Plataforma Lattes (CNPq) e CAPES.
        </div>
      </div>
    </div>
  );
}
