"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Paper, ProceedingsVolume } from "@/lib/ocs-service";
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
  ArrowRight,
  ShieldCheck,
  Layers,
  ChevronRight,
  Building2,
  Mail
} from "lucide-react";

interface Props {
  volumes: ProceedingsVolume[];
  papers: Paper[];
  initialQuery?: string;
}

export default function ProceedingsClient({ volumes, papers, initialQuery = "" }: Props) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  // Filtragem dos artigos quando há busca global
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return papers.filter((paper) => {
      const matchTitle = paper.title.toLowerCase().includes(term);
      const matchAbstract = paper.abstract.toLowerCase().includes(term);
      const matchKeywords = paper.keywords?.toLowerCase().includes(term);
      const matchDoi = paper.doi?.toLowerCase().includes(term);
      const matchCity = paper.city?.toLowerCase().includes(term);
      const matchSched = paper.sched_title?.toLowerCase().includes(term);
      const matchAuthor = paper.authors?.some(
        (a) =>
          a.full_name.toLowerCase().includes(term) ||
          a.affiliation.toLowerCase().includes(term) ||
          a.email?.toLowerCase().includes(term) ||
          a.orcid?.toLowerCase().includes(term) ||
          a.ror_id?.toLowerCase().includes(term)
      );
      return matchTitle || matchAbstract || matchKeywords || matchDoi || matchCity || matchSched || matchAuthor;
    });
  }, [papers, searchTerm]);

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* ======================================================== */}
      {/* PARTE 1: APRESENTAÇÃO DO CATÁLOGO E O BUSCADOR LIMPO     */}
      {/* ======================================================== */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-purple-200">
                  Open Access Directory
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">Catálogo de Volumes Publicados</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {t("proceedingsTitle")}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {t("proceedingsDesc")}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl self-start sm:self-auto shrink-0">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span><strong>{volumes.length}</strong> Volumes de Anais Disponíveis</span>
          </div>
        </div>

        {/* O Buscador, Limpo */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquise por título do artigo, autor, resumo, palavra-chave, DOI ou cidade..."
            className="w-full pl-12 pr-10 py-3 bg-slate-50/70 border border-slate-300 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-hidden transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer transition"
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* PARTE 2: NAVEGAÇÃO SEPARADA (CATÁLOGO DE VOLUMES)         */}
      {/* ======================================================== */}
      {!isSearching ? (
        // Modo Padrão: Mostra os Volumes de Anais (Sem sobreposição!)
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Volumes Publicados por Conferência</span>
            </h2>
            <span className="text-xs text-slate-500">
              Selecione uma edição para acessar o volume específico
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {volumes.map((vol) => (
              <div
                key={vol.sched_id}
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs hover:border-purple-300 hover:shadow-md transition space-y-5"
              >
                {/* 1. Título do Volume */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      <span>{vol.sched_slug} &bull; {vol.conference_title}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      <Link href={`/proceedings/${vol.sched_id}`} className="hover:text-purple-700 transition">
                        {vol.sched_title}
                      </Link>
                    </h3>
                  </div>

                  <Link
                    href={`/proceedings/${vol.sched_id}`}
                    className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-2xs hover:shadow-xs self-start"
                  >
                    <span>Acessar Anais da Edição</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* 2. Informações de Metadados EM BAIXO do Título do Evento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                  {/* Cidade do Evento */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {t("hostCity")}
                    </span>
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{vol.city || "Curitiba, PR, Brasil"}</span>
                    </div>
                  </div>

                  {/* ISBN dos Anais */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      {t("proceedingsIsbn")}
                    </span>
                    <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-emerald-900">
                      <Barcode className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{vol.isbn || "978-65-89123-45-6"}</span>
                    </div>
                  </div>

                  {/* Volume de Trabalhos */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Volume Indexado
                    </span>
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800">
                      <BookOpen className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span><strong>{vol.published_papers_count}</strong> artigos publicados</span>
                    </div>
                  </div>
                </div>

                {/* Trilhas Temáticas do Volume */}
                {vol.tracks && vol.tracks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                    <span className="text-slate-500 font-medium mr-1 text-[11px]">Trilhas Temáticas:</span>
                    {vol.tracks.map((tr) => (
                      <span key={tr.id} className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px]">
                        {tr.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Modo de Busca: Mostra os artigos encontrados com indicação de seus respectivos volumes
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-900">
              Resultados da busca para &ldquo;{searchTerm}&rdquo; ({searchResults.length} trabalhos encontrados)
            </h2>
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs font-semibold text-purple-700 hover:underline cursor-pointer"
            >
              Voltar ao catálogo de volumes
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700 text-sm">Nenhum artigo encontrado</p>
              <p>Tente outros termos ou limpe o campo de pesquisa.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((paper) => (
                <article
                  key={paper.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-purple-200 hover:shadow-md transition space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 max-w-4xl">
                      {/* Indicação do Volume dos Anais */}
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                          {paper.sched_title}
                        </span>
                        <span className="text-slate-300">•</span>
                        <Link
                          href={`/proceedings/${paper.sched_conf_id}`}
                          className="text-purple-700 hover:underline font-semibold"
                        >
                          Ver no volume da edição →
                        </Link>
                      </div>

                      {/* Título do Artigo */}
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        <Link href={`/paper/${paper.id}`} className="hover:text-purple-700 transition">
                          {paper.title}
                        </Link>
                      </h3>

                      {/* Metadados */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {paper.doi && (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[11px] text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center space-x-1 font-semibold"
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
                                className="inline-flex items-center space-x-1 text-[11px] text-slate-600 hover:text-purple-700"
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
                              >
                                <Building2 className="w-3 h-3 text-blue-600" />
                                <span>ROR: {author.ror_id.replace(/^https?:\/\/ror\.org\//, "")}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                        {paper.abstract}
                      </p>
                    </div>

                    <div className="shrink-0 flex md:flex-col gap-2 pt-2 md:pt-0">
                      <Link
                        href={`/paper/${paper.id}`}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-2xs"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Ler o Trabalho</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
