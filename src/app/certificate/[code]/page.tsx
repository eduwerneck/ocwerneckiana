import { notFound } from "next/navigation";
import Link from "next/link";
import { getCertificateByCode } from "@/lib/email-service";
import CertificateViewClient from "./CertificateViewClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  const cert = getCertificateByCode(code);
  if (!cert) {
    return { title: "Certificado Não Encontrado | OCW" };
  }
  return {
    title: `${cert.title} - ${cert.certificate_code} | Open Conference Werneckiana`,
    description: `Validação oficial de autenticidade de declaração/certificado acadêmico emitido pelo Open Conference Werneckiana (OCW).`,
  };
}

export default async function CertificatePage({ params }: Props) {
  const { code } = await params;
  const cert = getCertificateByCode(code);

  if (!cert) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Barra superior de validação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-800">Validador Oficial de Documentos Acadêmicos OCW</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-700 font-semibold">Registro Válido & Autêntico</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="text-slate-500 hover:text-blue-700 font-semibold transition"
            >
              ← Voltar ao Portal OCW
            </Link>
          </div>
        </div>

        {/* Visualizador do Certificado Oficial */}
        <CertificateViewClient certificate={cert} />
      </div>
    </div>
  );
}
