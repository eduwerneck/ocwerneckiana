"use client";

import { useState } from "react";
import Link from "next/link";
import { ScheduleItem } from "@/lib/ocs-service";
import { useLanguage } from "@/lib/i18n";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  Info, 
  Globe, 
  Building,
  ChevronRight
} from "lucide-react";

interface Props {
  scheduleItems: ScheduleItem[];
  conferenceTitle?: string;
  conferenceCity?: string;
}

export default function ScheduleClient({
  scheduleItems,
  conferenceTitle = "X CITECA 2026",
  conferenceCity = "Poços de Caldas, MG, Brasil",
}: Props) {
  const { t } = useLanguage();
  const [filterModality, setFilterModality] = useState<"all" | "presential" | "online">("all");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const filteredItems = scheduleItems.filter((item) => {
    if (filterModality === "all") return true;
    if (filterModality === "online") return item.modality === "online";
    if (filterModality === "presential") return item.modality === "presential" || !item.modality;
    return true;
  });

  const countPresential = scheduleItems.filter((i) => i.modality === "presential" || !i.modality).length;
  const countOnline = scheduleItems.filter((i) => i.modality === "online").length;

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-700">{t("navHome")}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800">{t("navSchedule")}</span>
      </nav>

      {/* Cabeçalho */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
                {conferenceTitle} • {t("navSchedule")}
              </span>
              <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full flex items-center space-x-1 font-medium">
                <MapPin className="w-3 h-3 text-red-500" />
                <span>{conferenceCity}</span>
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full flex items-center space-x-1 font-semibold">
                <Globe className="w-3 h-3 text-emerald-600" />
                <span>Modalidade Híbrida (Presencial & Online)</span>
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Grade de Horários & Salas de Apresentação
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Consulte a programação completa das sessões técnicas orais. Apresentações marcadas como 
              <strong> Online</strong> contam com transmissão síncrona e link direto para a sala virtual do apresentador.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-lg shrink-0">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>10 a 13 de Novembro de 2026</span>
            </div>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="font-semibold text-slate-700">Horário Oficial de Brasília (BRT)</span>
          </div>
        </div>

        {/* Barra de Filtros de Modalidade */}
        <div className="border-t border-slate-100 pt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-500 mr-1">Filtrar Modalidade:</span>
            
            <button
              type="button"
              onClick={() => setFilterModality("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterModality === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t("filterAllModalities")} ({scheduleItems.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterModality("presential")}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition ${
                filterModality === "presential"
                  ? "bg-blue-700 text-white shadow-xs"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{t("filterPresential")} ({countPresential})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterModality("online")}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition ${
                filterModality === "online"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>{t("filterOnline")} ({countOnline})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Exibindo <strong>{filteredItems.length}</strong> de <strong>{scheduleItems.length}</strong> apresentações
          </div>
        </div>
      </div>

      {/* Grade de Apresentações Agendadas */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-400" />
              <p className="font-semibold text-slate-700 text-sm">Nenhuma apresentação encontrada com o filtro selecionado.</p>
              <p>Tente selecionar "Todas as Sessões" para ver a grade completa.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isOnline = item.modality === "online";

              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-5 ${
                    isOnline ? "border-emerald-200 ring-1 ring-emerald-100/50" : "border-slate-200"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Linha de Metadados: Modalidade, Horário e Data */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        {isOnline ? (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md flex items-center space-x-1.5 border border-emerald-300">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                            </span>
                            <Video className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{t("badgeOnline")}</span>
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-md flex items-center space-x-1.5 border border-blue-200">
                            <Building className="w-3.5 h-3.5 text-blue-700" />
                            <span>{t("badgePresential")}</span>
                          </span>
                        )}

                        <span className="bg-slate-100 text-purple-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                          {item.track_title}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-600 font-medium">
                        <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{item.start_time} - {item.end_time}</span>
                        </span>
                        <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.date}</span>
                        </span>
                      </div>
                    </div>

                    {/* Título do Artigo */}
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        <Link href={`/paper/${item.paper_id}`} className="hover:text-blue-700 transition">
                          {item.paper_title}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-700">{t("authors")}:</strong> {item.authors}
                      </p>
                    </div>

                    {/* Painel Específico da Modalidade */}
                    {isOnline ? (
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5 text-emerald-900 font-bold">
                            <Video className="w-4 h-4 text-emerald-700" />
                            <span>{item.room_name} ({item.building})</span>
                          </div>
                        </div>

                        {item.meeting_url && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                            <a
                              href={item.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center justify-center space-x-2 shadow-xs transition"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>{t("joinVirtualRoom")}</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleCopyLink(item.meeting_url!)}
                              className="bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-medium px-3 py-2 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition"
                              title="Copiar Link da Sala Virtual"
                            >
                              {copiedUrl === item.meeting_url ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Link Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copiar Link da Sessão</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {item.meeting_instructions && (
                          <div className="text-[11px] text-emerald-800/90 bg-white/60 p-2 rounded border border-emerald-200/50 flex items-start space-x-1.5 leading-relaxed">
                            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span><strong>Orientações:</strong> {item.meeting_instructions}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center space-x-2 font-bold text-slate-900">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>{item.room_name}</span>
                        </div>
                        <p className="text-slate-500 pl-6">
                          <strong>Local:</strong> {item.building} • Poços de Caldas, MG
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Card com Link para os Anais */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px] text-slate-400">
                      Sessão #{item.id} • Ref. OCS 2.3.6
                    </span>

                    <Link
                      href={`/paper/${item.paper_id}`}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
                    >
                      <span>Ver Artigo & Citações</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
