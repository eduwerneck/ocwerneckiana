import Link from "next/link";
import { getAllConferences } from "@/lib/ocs-service";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  BookOpen, 
  Send, 
  ArrowRight,
  Sparkles,
  Barcode
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const conferences = getAllConferences();

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto space-y-6 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/30 px-3.5 py-1.5 rounded-full text-xs text-blue-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Open Conference Werneckiana (OCW - v1.0) &bull; Concepção Eduardo Augusto Werneck Ribeiro (2026)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Plataforma Aberta de Conferências Científicas e Publicação de Anais em HTML
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            O <strong>Open Conference Werneckiana (OCW)</strong> é um ecossistema contemporâneo de editoração científica, concebido como um clone aprimorado do PKP Open Conference Systems (OCS). Ele substitui o tradicional e pesado envio de PDFs por <strong>artigos curtos estruturados em HTML nativo (até 2.000 palavras)</strong>, com suporte a figuras metodológicas e de resultados em 300 DPI, avaliação duplo-cega (Double-Blind Review) 100% anonimizada, integração com ORCID iD e interoperabilidade direta com Crossref e OAI-PMH.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3 justify-center sm:justify-start">
            <a
              href="#conferencias"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-2 text-sm"
            >
              <span>Ver Conferências Ativas</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/proceedings"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-5 py-2.5 rounded-lg transition flex items-center space-x-2 text-sm"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Consultar Anais (Acesso Aberto)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Lista de Conferências Hospedadas */}
      <section id="conferencias" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-baseline border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Conferências Hospedadas no Portal
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Selecione uma conferência para consultar informações, submeter trabalhos ou visualizar anais.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {conferences.length} Conferências Cadastradas
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {conferences.map((conf) => {
            const activeEdition = conf.active_edition;
            return (
              <div
                key={conf.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                        {conf.acronym}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">
                        <Link href={`/conference/${conf.slug}`} className="hover:text-blue-700 transition">
                          {conf.title}
                        </Link>
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {conf.description}
                  </p>

                  {/* Edição em Destaque */}
                  {activeEdition && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Edição Ativa: {activeEdition.acronym}</span>
                        </span>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          Chamada Aberta
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">{activeEdition.city ? `${activeEdition.city}` : activeEdition.location}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{activeEdition.start_date} até {activeEdition.end_date}</span>
                        </div>
                      </div>

                      {activeEdition.isbn && (
                        <div className="flex items-center space-x-1.5 text-emerald-800 pt-1 border-t border-slate-200/60 font-mono text-[11px]">
                          <Barcode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>ISBN dos Anais: <strong>{activeEdition.isbn}</strong></span>
                        </div>
                      )}

                      <div className="flex items-center space-x-1.5 text-slate-700 pt-1 border-t border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Prazo de Submissão: <strong>{activeEdition.cfp_deadline}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações do Card */}
                <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/conference/${conf.slug}`}
                      className="font-medium text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-md hover:bg-slate-100 transition"
                    >
                      Página da Conferência
                    </Link>
                    <Link
                      href={activeEdition ? `/proceedings/${activeEdition.id}` : "/proceedings"}
                      className="font-medium text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-md hover:bg-slate-100 transition flex items-center space-x-1"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>Anais</span>
                    </Link>
                  </div>

                  {activeEdition && (
                    <Link
                      href={`/conference/${conf.slug}/submit`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-1.5 rounded-md shadow-2xs transition flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submeter Trabalho</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
