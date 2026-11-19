"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Paper } from "@/lib/ocs-service";
import { parseReferences, convertReferencesList, countWords } from "@/lib/references";
import { useLanguage } from "@/lib/i18n";
import { 
  BookOpen, 
  ChevronRight, 
  Quote, 
  ShieldCheck, 
  ExternalLink, 
  MapPin, 
  Tag, 
  Award, 
  Building2, 
  Copy, 
  Check, 
  Sparkles,
  Layers,
  Video,
  Clock,
  Calendar,
  FileText,
  Info,
  RefreshCw,
  Barcode,
  Printer
} from "lucide-react";
import DownloadButton from "@/components/DownloadButton";
import StructuredTextRenderer from "@/components/StructuredTextRenderer";

interface Props {
  paper: Paper;
}

export default function PaperDetailClient({ paper }: Props) {
  const { t, lang } = useLanguage();
  const [copiedType, setCopiedType] = useState<"abnt" | "apa" | null>(null);
  const [copiedRefs, setCopiedRefs] = useState(false);
  const [copiedLattes, setCopiedLattes] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewStyle, setViewStyle] = useState<"abnt" | "apa">(paper.references_style || "abnt");

  const copyPermanentLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : `http://localhost:3000/paper/${paper.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Converte dinamicamente a lista de referências quando o leitor alternar entre ABNT e APA
  const formattedReferencesText = useMemo(() => {
    if (!paper.references_text) return "";
    const sourceStyle = paper.references_style || "abnt";
    if (viewStyle === sourceStyle) {
      return paper.references_text;
    }
    return convertReferencesList(paper.references_text, viewStyle);
  }, [paper.references_text, paper.references_style, viewStyle]);

  const referencesList = useMemo(() => {
    return parseReferences(formattedReferencesText);
  }, [formattedReferencesText]);

  // Figuras estruturadas do artigo curto (300 DPI)
  const parsedFigures = useMemo(() => {
    if (paper.figures && paper.figures.length > 0) return paper.figures;
    if (paper.figures_json) {
      try {
        return JSON.parse(paper.figures_json);
      } catch {
        return [];
      }
    }
    return [];
  }, [paper.figures, paper.figures_json]);

  const bodyText = `${paper.section_intro || ""} ${paper.section_methods || ""} ${paper.section_results || ""} ${paper.section_conclusion || ""}`.trim();
  const structuredWordCount = useMemo(() => countWords(bodyText), [bodyText]);

  // Paginação simulada/equivalente para o Lattes (CNPq)
  const pageStart = paper.page_start || 1;
  const pageEnd = paper.page_end || 5;

  // Autores formatados para citação
  const primaryAuthor = paper.authors?.[0]?.full_name || "Autor";
  const authorLastName = primaryAuthor.split(" ").slice(-1)[0].toUpperCase();
  const authorInitials = primaryAuthor
    .split(" ")
    .slice(0, -1)
    .map((n) => n[0].toUpperCase() + ".")
    .join(" ");

  const city = paper.city || "São Paulo, SP - Brasil";
  const cityName = city.split(",")[0].trim().toUpperCase();
  const year = "2026";
  const schedTitle = paper.sched_title || "Conferência Acadêmica OCS";

  // Citações dinâmicas com cidade, páginas e DOIs
  const allAuthorsAbnt = paper.authors && paper.authors.length > 0
    ? paper.authors.map((a) => {
        const parts = a.full_name.trim().split(" ");
        const last = parts.pop()?.toUpperCase() || "";
        const rest = parts.join(" ");
        return `${last}, ${rest}`;
      }).join("; ")
    : `${authorLastName}, ${primaryAuthor}`;

  const allAuthorsApa = paper.authors && paper.authors.length > 0
    ? paper.authors.map((a) => {
        const parts = a.full_name.trim().split(" ");
        const last = parts.pop() || "";
        const inits = parts.map((p) => `${p[0]}.`).join(" ");
        return `${last}, ${inits}`;
      }).join(", & ")
    : `${primaryAuthor}`;

  const abntCitation = `${allAuthorsAbnt}. ${paper.title}. In: ANAIS DO ${schedTitle.toUpperCase()}, ${year}, ${city.split(",")[0].trim()}. Anais eletrônicos... ${cityName}: PKP OCS, ${year}. p. ${pageStart}-${pageEnd}.${paper.isbn ? ` ISBN: ${paper.isbn}.` : ""}${paper.doi ? ` DOI: https://doi.org/${paper.doi}.` : ""}${paper.proceedings_doi ? ` DOI dos Anais: https://doi.org/${paper.proceedings_doi}.` : ""}`;
  
  const apaCitation = `${allAuthorsApa} (${year}). ${paper.title}. In Proceedings of ${schedTitle} (pp. ${pageStart}-${pageEnd}). ${city}.${paper.isbn ? ` ISBN: ${paper.isbn}.` : ""}${paper.doi ? ` https://doi.org/${paper.doi}` : ""}`;

  const copyToClipboard = (text: string, type: "abnt" | "apa") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const lattesText = `Natureza da produção: Trabalho Completo / Artigo Curto em Anais
Título do trabalho: ${paper.title}
Título dos anais da conferência: Anais do ${schedTitle}
Nome do evento: ${schedTitle}
Cidade da editora / evento: ${cityName}
Ano de realização e publicação: ${year}
Páginas: ${pageStart} a ${pageEnd} (Total: ${pageEnd - pageStart + 1} páginas)
ISBN dos anais: ${paper.isbn || "978-65-89123-45-6"}
DOI: ${paper.doi ? `https://doi.org/${paper.doi}` : "Em processo de indexação Crossref"}`;

  const copyLattesData = () => {
    navigator.clipboard.writeText(lattesText);
    setCopiedLattes(true);
    setTimeout(() => setCopiedLattes(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-700">{t("navHome")}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/proceedings" className="hover:text-blue-700">{t("navProceedings")}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800">Artigo #{paper.id}</span>
      </nav>

      {/* Cartão Principal do Artigo */}
      <article className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6">
        <div className="space-y-4">
          {/* Badges de Topo: Conferência, Trilha, Cidade e DOIs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded uppercase">
              {paper.sched_title}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {paper.track_title}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 uppercase font-medium bg-slate-100 px-2 py-0.5 rounded">
              {paper.presentation_type}
            </span>

            {/* Cidade Sede da Conferência */}
            {paper.city && (
              <>
                <span className="text-slate-300">•</span>
                <span className="bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{t("hostCity")}: <strong>{paper.city}</strong></span>
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {paper.title}
            </h1>

            <button
              type="button"
              onClick={() => window.print()}
              className="shrink-0 bg-white hover:bg-purple-50 hover:border-purple-300 text-slate-800 border border-slate-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition shadow-2xs hover:shadow-xs cursor-pointer print:hidden self-start"
              title="Imprimir versão diagramada do trabalho"
            >
              <Printer className="w-4 h-4 text-purple-600" />
              <span>Imprimir</span>
            </button>
          </div>

          {/* Identificadores Persistentes do Artigo: DOI, Link Permanente e ISBN */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            {paper.doi && (
              <div className="flex items-center space-x-1.5 bg-blue-50/80 border border-blue-200 px-3 py-1.5 rounded-lg">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-blue-900">{t("articleDoi")}:</span>
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-700 hover:text-blue-900 font-bold flex items-center space-x-1 underline"
                  title="Resolução internacional permanente via Crossref"
                >
                  <span>https://doi.org/{paper.doi}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Link Permanente Individual (Landing Page do DOI) */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="font-semibold text-slate-700">Link Permanente Individual:</span>
              <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                /paper/{paper.id}
              </span>
              <button
                type="button"
                onClick={copyPermanentLink}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-100/70 hover:bg-blue-200 px-2 py-0.5 rounded transition cursor-pointer flex items-center space-x-1"
                title="Copiar URL permanente individual deste artigo"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>

            {paper.isbn && (
              <div className="flex items-center space-x-1.5 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-emerald-900">{t("eventIsbn")}:</span>
                <span className="font-mono text-emerald-800 font-bold">{paper.isbn}</span>
              </div>
            )}
          </div>

          {/* Lista de Autores com ORCID, ROR e CRediT */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              {t("authors")}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paper.authors?.map((author, index) => (
                <div key={index} className="bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">
                        {author.full_name}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {author.affiliation}
                      </p>
                    </div>

                    {/* Badge ROR Institucional */}
                    {author.ror_id && (
                      <a
                        href={author.ror_id.startsWith("http") ? author.ror_id : `https://ror.org/${author.ror_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[11px] text-blue-700 bg-blue-100/70 hover:bg-blue-100 border border-blue-300 px-2 py-0.5 rounded font-mono transition shrink-0"
                        title={`ROR ID: ${author.ror_id}`}
                      >
                        <Building2 className="w-3 h-3 text-blue-600" />
                        <span>ROR ID</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  {/* ORCID do Autor */}
                  {author.orcid && (
                    <div className="pt-1">
                      <a
                        href={`https://orcid.org/${author.orcid.replace(/^https?:\/\/orcid\.org\//, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded font-mono transition"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">
                          iD
                        </span>
                        <span>https://orcid.org/{author.orcid.replace(/^https?:\/\/orcid\.org\//, "")}</span>
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                      </a>
                    </div>
                  )}

                  {/* Papel CRediT */}
                  {author.credit_roles && (
                    <div className="pt-1 border-t border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                        {t("creditTaxonomy")}:
                      </span>
                      <p className="text-xs text-slate-700 mt-0.5 italic">
                        {author.credit_roles}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Informação de Acesso Aberto (impressão unificada no cabeçalho) */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 text-xs">
            <strong className="text-purple-950 font-bold block">{t("fullTextOpenAccess")}</strong>
            <span className="text-purple-700">Artigo Curto nos Anais • Avaliado por pares duplo-cego (Double-Blind Pure Web)</span>
          </div>
        </div>

        {/* Fomento à Pesquisa */}
        {paper.funding && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-1.5 text-xs text-amber-950">
            <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-amber-900">
              <Award className="w-4 h-4 text-amber-600" />
              <span>{t("funding")}</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium pl-6">
              {paper.funding}
            </p>
          </div>
        )}

        {/* Resumo */}
        <div className="space-y-2 pt-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {t("abstract")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify bg-slate-50/60 p-4 rounded-lg border border-slate-100">
            {paper.abstract}
          </p>
        </div>

        {/* Palavras-chave */}
        {paper.keywords && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t("keywords")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {paper.keywords.split(",").map((kw, i) => (
                <span
                  key={i}
                  className="bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium"
                >
                  {kw.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Renderização Completa do Artigo Curto Estruturado em HTML (IMRaD Puro Web) */}
        {structuredWordCount > 0 && (
          <div className="border border-slate-200 rounded-xl p-6 sm:p-8 space-y-8 bg-white shadow-2xs">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Publicação Web Completa nos Anais
                  </span>
                  <span className="text-xs text-slate-500">• Modalidade: Artigo Curto Estruturado</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Texto Completo do Trabalho (Pure HTML Open Access)
                </h2>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-medium">
                  Corpo: <strong>{structuredWordCount} palavras</strong>
                </span>
                <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded font-medium border border-emerald-200">
                  Páginas Lattes: <strong>{pageStart} a {pageEnd}</strong>
                </span>
              </div>
            </div>

            {/* 1. Introdução */}
            {paper.section_intro && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">1</span>
                  <span>1. Introdução</span>
                </h3>
                <StructuredTextRenderer
                  text={paper.section_intro}
                  figures={parsedFigures}
                  sectionName="intro"
                />
              </section>
            )}

            {/* 2. Materiais e Métodos */}
            {paper.section_methods && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">2</span>
                  <span>2. Materiais e Métodos</span>
                </h3>
                <StructuredTextRenderer
                  text={paper.section_methods}
                  figures={parsedFigures}
                  sectionName="methods"
                />
              </section>
            )}

            {/* 3. Resultados e Discussão */}
            {paper.section_results && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">3</span>
                  <span>3. Resultados e Discussão</span>
                </h3>
                <StructuredTextRenderer
                  text={paper.section_results}
                  figures={parsedFigures}
                  sectionName="results"
                />
              </section>
            )}

            {/* 4. Considerações Finais */}
            {paper.section_conclusion && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">4</span>
                  <span>4. Considerações Finais</span>
                </h3>
                <StructuredTextRenderer
                  text={paper.section_conclusion}
                  figures={parsedFigures}
                  sectionName="conclusion"
                />
              </section>
            )}
          </div>
        )}

        {/* Seção de Referências Bibliográficas Citadas (Indexação Científica & Conversor Dinâmico ABNT ⇄ APA) */}
        {referencesList.length > 0 && (
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-purple-100 text-purple-800 p-1.5 rounded-lg">
                  <BookOpen className="w-4 h-4 text-purple-700" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t("citedReferences")}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Indexadas e mapeadas para Google Scholar, Crossref e OAI-PMH
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Conversor Dinâmico de Estilo (ABNT NBR 6023 ⇄ APA 7th) */}
                <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewStyle("abnt")}
                    className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1 ${
                      viewStyle === "abnt"
                        ? "bg-white text-purple-900 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>ABNT (NBR 6023)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewStyle("apa")}
                    className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1 ${
                      viewStyle === "apa"
                        ? "bg-white text-purple-900 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>APA (7ª Edição)</span>
                  </button>
                </div>

                <span className="bg-purple-50 border border-purple-200 text-purple-700 font-semibold px-2.5 py-1 rounded-md text-xs">
                  {referencesList.length} referências
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const allText = referencesList.map((r, i) => `${i + 1}. ${r.raw}`).join("\n\n");
                    navigator.clipboard.writeText(allText);
                    setCopiedRefs(true);
                    setTimeout(() => setCopiedRefs(false), 2500);
                  }}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium px-2.5 py-1 rounded-md text-xs flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
                  title="Copiar todas as referências no estilo selecionado"
                >
                  {copiedRefs ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copiadas!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Todas ({viewStyle.toUpperCase()})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <ol className="space-y-3 pt-1">
              {referencesList.map((ref, idx) => (
                <li
                  key={idx}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 text-xs text-slate-800 leading-relaxed space-y-1.5 shadow-2xs hover:border-purple-200 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-slate-400 shrink-0 select-none">
                      [{idx + 1}]
                    </span>
                    <p className="flex-1 font-serif text-[12.5px] text-slate-800 text-justify">
                      {ref.raw}
                    </p>
                  </div>

                  {ref.doi && (
                    <div className="pl-6 pt-0.5">
                      <a
                        href={`https://doi.org/${ref.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[11px] font-mono text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded transition"
                      >
                        <span>https://doi.org/{ref.doi}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Caixa de Citação Acadêmica com Cidade e DOIs */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Quote className="w-4 h-4 text-blue-600" />
            <span>{t("howToCite")}</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Formato ABNT */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600 block text-[11px] uppercase">
                  {t("abntFormat")}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(abntCitation, "abnt")}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1 bg-white border border-slate-200 px-2.5 py-1 rounded shadow-2xs transition"
                >
                  {copiedType === "abnt" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar ABNT</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono bg-white p-3 rounded-lg border border-slate-200 text-slate-800 select-all leading-relaxed">
                {abntCitation}
              </p>
            </div>

            {/* Formato APA */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600 block text-[11px] uppercase">
                  {t("apaFormat")}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(apaCitation, "apa")}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1 bg-white border border-slate-200 px-2.5 py-1 rounded shadow-2xs transition"
                >
                  {copiedType === "apa" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar APA</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono bg-white p-3 rounded-lg border border-slate-200 text-slate-800 select-all leading-relaxed">
                {apaCitation}
              </p>
            </div>
          </div>
        </div>

        {/* Card Dedicado: Dados para o Currículo Lattes (CNPq) */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-600 text-white p-1.5 rounded-lg text-xs font-bold">
                CNPq
              </span>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  📋 Dados para Preenchimento no Currículo Lattes (CNPq)
                </h3>
                <p className="text-[11px] text-emerald-800">
                  Campos exatos para lançar esta produção bibliográfica na Plataforma Lattes
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={copyLattesData}
              className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition shadow-2xs cursor-pointer self-start sm:self-auto"
            >
              {copiedLattes ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copiado para o Lattes!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Copiar Todos os Dados</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                Natureza do Trabalho
              </span>
              <p className="font-semibold text-slate-900 mt-0.5">Trabalho Completo / Artigo Curto</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                Título dos Anais
              </span>
              <p className="font-semibold text-slate-900 mt-0.5 truncate" title={`Anais do ${schedTitle}`}>
                Anais do {schedTitle}
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                Cidade da Editora / Evento
              </span>
              <p className="font-semibold text-slate-900 mt-0.5">{cityName}</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                Páginas no Trabalho (Inicial e Final)
              </span>
              <p className="font-semibold text-slate-900 mt-0.5">
                Página Inicial: <strong>{pageStart}</strong> • Página Final: <strong>{pageEnd}</strong> ({pageEnd - pageStart + 1} págs)
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                ISBN dos Anais
              </span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{paper.isbn || "978-65-89123-45-6"}</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                DOI do Artigo
              </span>
              <p className="font-mono font-bold text-slate-900 mt-0.5 truncate" title={paper.doi || "Não atribuído"}>
                {paper.doi ? `https://doi.org/${paper.doi}` : "Em processo de atribuição"}
              </p>
            </div>
          </div>
        </div>

        {/* Sessão da Programação Oficial (Presencial vs Online) */}
        {paper.schedule && (
          <div className={`border rounded-xl p-5 space-y-4 ${
            paper.schedule.modality === "online" 
              ? "bg-emerald-50/60 border-emerald-200 ring-1 ring-emerald-100" 
              : "bg-blue-50/50 border-blue-200"
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Apresentação na Programação Oficial</span>
                </span>
                {paper.schedule.modality === "online" ? (
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[11px] flex items-center space-x-1 border border-emerald-300">
                    <Video className="w-3 h-3 text-emerald-700" />
                    <span>{t("badgeOnline")}</span>
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded text-[11px] flex items-center space-x-1 border border-blue-200">
                    <MapPin className="w-3 h-3 text-blue-700" />
                    <span>{t("badgePresential")}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md flex items-center space-x-1 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{paper.schedule.start_time} - {paper.schedule.end_time}</span>
                </span>
                <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md flex items-center space-x-1 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{paper.schedule.date}</span>
                </span>
              </div>
            </div>

            {paper.schedule.modality === "online" ? (
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-lg border border-emerald-200">
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">{paper.schedule.room_name}</span>
                    <span className="text-[11px] text-slate-500">{paper.schedule.building}</span>
                  </div>

                  {paper.schedule.meeting_url && (
                    <a
                      href={paper.schedule.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center justify-center space-x-2 shadow-xs transition"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{t("joinVirtualRoom")}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>

                {paper.schedule.meeting_instructions && (
                  <p className="text-[11px] text-emerald-800 bg-white/70 p-2.5 rounded border border-emerald-200/60 flex items-start space-x-1.5 leading-relaxed">
                    <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Orientações para o Apresentador:</strong> {paper.schedule.meeting_instructions}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white p-3.5 rounded-lg border border-blue-200 text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{paper.schedule.room_name}</span>
                </div>
                <p className="text-slate-600 pl-5">
                  <strong>Localização:</strong> {paper.schedule.building} • Poços de Caldas, MG, Brasil
                </p>
              </div>
            )}
          </div>
        )}

        {/* Protocolos de Interoperabilidade & Exportação de Metadados Acadêmicos */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>{t("openScienceInteroperability")}</span>
          </div>
          <p className="text-xs text-slate-600">
            Exporte os metadados acadêmicos deste artigo indexado em padrões e esquemas internacionais de Ciência Aberta:
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <a
              href={`/api/export/crossref/${paper.id}`}
              download={`crossref_paper_${paper.id}.xml`}
              target="_blank"
              className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
              <span>{t("exportPaperCrossref")}</span>
            </a>

            <a
              href={`/api/oai?verb=GetRecord&identifier=oai:ocs.academic.org:paper/${paper.id}&metadataPrefix=oai_dc`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>{t("exportPaperOaiDc")}</span>
            </a>
          </div>
        </div>

        {/* Informações de Licenciamento */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t("licenseInfo")}</span>
          </span>
          <span className="font-medium">Indexação Dublin Core • OCS 2.3.6</span>
        </div>
      </article>
    </div>
  );
}
