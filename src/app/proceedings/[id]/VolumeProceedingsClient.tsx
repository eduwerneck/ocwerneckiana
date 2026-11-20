"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Paper, SchedConf, Track } from "@/lib/ocs-service";
import { useLanguage } from "@/lib/i18n";
import { 
  BookOpen, 
  Search, 
  MapPin, 
  Calendar, 
  Barcode, 
  Tag, 
  ExternalLink, 
  Sparkles, 
  Filter, 
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  Mail
} from "lucide-react";

interface Props {
  sched: SchedConf & { conference_title?: string; conf_slug?: string; tracks?: Track[]; published_count?: number };
  papers: Paper[];
  initialQuery?: string;
}

export default function VolumeProceedingsClient({ sched, papers, initialQuery = "" }: Props) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedTrack, setSelectedTrack] = useState<number | "all">("all");

  const tracks = sched.tracks || [];

  // Filtragem dos artigos deste volume específico
  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      // Filtro por trilha
      if (selectedTrack !== "all" && paper.track_id !== selectedTrack) {
        return false;
      }

      // Filtro por termo de busca
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const matchTitle = paper.title.toLowerCase().includes(term);
      const matchAbstract = paper.abstract.toLowerCase().includes(term);
      const matchKeywords = paper.keywords?.toLowerCase().includes(term);
      const matchDoi = paper.doi?.toLowerCase().includes(term);
      const matchAuthor = paper.authors?.some(
        (a) =>
          a.full_name.toLowerCase().includes(term) ||
          a.affiliation.toLowerCase().includes(term) ||
          a.email?.toLowerCase().includes(term) ||
          a.orcid?.toLowerCase().includes(term) ||
          a.ror_id?.toLowerCase().includes(term)
      );

      return matchTitle || matchAbstract || matchKeywords || matchDoi || matchAuthor;
    });
  }, [papers, searchTerm, selectedTrack]);

  return (
    <div className="space-y-8">
      {/* ======================================================== */}
      {/* CABEÇALHO DO VOLUME ESPECÍFICO DE ANAIS                   */}
      {/* ======================================================== */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              {sched.acronym}
            </span>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              Volume Oficial de Anais
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Acesso Aberto (CC BY 4.0)</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Anais do {sched.title}
          </h1>

          {sched.conference_title && (
            <p className="text-xs sm:text-sm text-slate-500">
              Conferência: <strong>{sched.conference_title}</strong>
            </p>
          )}
        </div>

        {/* Metadados do Volume em Baixo do Título */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          {/* Cidade Sede */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cidade Sede
            </span>
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">{sched.city || sched.location}</span>
            </div>
          </div>

          {/* Datas do Evento */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Período do Evento
            </span>
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{sched.start_date} a {sched.end_date}</span>
            </div>
          </div>

          {/* ISBN dos Anais */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              ISBN do Volume
            </span>
            <div className="flex items-center space-x-1.5 font-mono font-bold text-emerald-900">
              <Barcode className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sched.isbn || "978-65-89123-45-6"}</span>
            </div>
          </div>

          {/* Total de Artigos */}
          <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3 space-y-1">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
              Trabalhos Indexados
            </span>
            <div className="flex items-center space-x-1.5 font-semibold text-purple-900">
              <BookOpen className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span><strong>{papers.length}</strong> artigos completos</span>
            </div>
          </div>
        </div>

        {/* Buscador e Filtros Locais deste Volume */}
        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquise artigos deste volume por título, autor, resumo, palavra-chave ou DOI..."
              className="w-full pl-12 pr-10 py-3 bg-slate-50/80 border border-slate-300 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer transition"
                title="Limpar filtro"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por Trilhas Temáticas */}
          {tracks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500 font-medium flex items-center space-x-1 mr-1">
                <Filter className="w-3 h-3 text-slate-400" />
                <span>Trilhas:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedTrack("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  selectedTrack === "all"
                    ? "bg-blue-700 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Todas ({papers.length})
              </button>
              {tracks.map((tr) => {
                const count = papers.filter((p) => p.track_id === tr.id).length;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => setSelectedTrack(tr.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      selectedTrack === tr.id
                        ? "bg-blue-700 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tr.title} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* LISTA DE ARTIGOS DESTE VOLUME DEDICADO                   */}
      {/* ======================================================== */}
      {filteredPapers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">Nenhum artigo encontrado neste volume</p>
          <p>Tente outros termos de busca ou selecione outra trilha temática.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold text-slate-600">
              Exibindo <strong>{filteredPapers.length}</strong> de {papers.length} artigos publicados
            </span>
          </div>

          {filteredPapers.map((paper) => {
            const pageStart = paper.page_start || 1;
            const pageEnd = paper.page_end || 5;

            return (
              <article
                key={paper.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 max-w-4xl">
                    {/* Título do Artigo */}
                    <h2 className="text-lg font-bold text-slate-900 leading-snug">
                      <Link href={`/paper/${paper.id}`} className="hover:text-blue-700 transition">
                        {paper.title}
                      </Link>
                    </h2>

                    {/* Metadados Estruturados Abaixo do Título */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {paper.doi && (
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded flex items-center space-x-1 font-semibold"
                          title="DOI Oficial do Artigo no Crossref"
                        >
                          <Tag className="w-3 h-3 text-blue-500" />
                          <span>DOI: {paper.doi}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}

                      <span className="text-slate-300">•</span>
                      <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-medium text-[11px]">
                        {paper.track_title}
                      </span>

                      {paper.presentation_type && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 uppercase text-[10px] font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {paper.presentation_type}
                          </span>
                        </>
                      )}

                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 text-[11px] font-medium">
                        Páginas: {pageStart} - {pageEnd}
                      </span>
                    </div>

                    {/* Autores com Nome Completo, E-mail, ORCID e ROR */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {paper.authors?.map((author, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex flex-wrap items-center gap-x-2 gap-y-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg"
                        >
                          <span className="font-semibold text-slate-900">{author.full_name}</span>
                          {author.affiliation && (
                            <span className="text-slate-500 text-[11px]">({author.affiliation})</span>
                          )}
                          {author.email && (
                            <a
                              href={`mailto:${author.email}`}
                              className="inline-flex items-center space-x-1 text-[11px] text-slate-600 hover:text-blue-700"
                              title={`E-mail de ${author.full_name}`}
                            >
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{author.email}</span>
                            </a>
                          )}
                          {author.orcid && (
                            <a
                              href={author.orcid.startsWith("http") ? author.orcid : `https://orcid.org/${author.orcid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded"
                              title={`ORCID de ${author.full_name}`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white font-bold text-[8px] flex items-center justify-center">
                                iD
                              </span>
                              <span>{author.orcid.replace(/^https?:\/\/orcid\.org\//, "")}</span>
                            </a>
                          )}
                          {author.ror_id && (
                            <a
                              href={author.ror_id.startsWith("http") ? author.ror_id : `https://ror.org/${author.ror_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-[11px] font-mono text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded"
                              title={`ROR institucional: ${author.ror_id}`}
                            >
                              <Building2 className="w-3 h-3 text-blue-600" />
                              <span>ROR: {author.ror_id.replace(/^https?:\/\/ror\.org\//, "")}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Resumo */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-1">
                      {paper.abstract}
                    </p>

                    {/* Palavras-chave */}
                    {paper.keywords && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600">Palavras-chave:</span>
                        {paper.keywords.split(/[,;]/).map((k, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                            {k.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ação Primária: Ler o Trabalho */}
                  <div className="shrink-0 pt-2 md:pt-0">
                    <Link
                      href={`/paper/${paper.id}`}
                      className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-2xs hover:shadow-xs"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Ler o Trabalho</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
