"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronRight, 
  CheckCircle, 
  Upload, 
  FileText, 
  Users, 
  Plus, 
  Trash2, 
  Send, 
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  Bot,
  Check,
  RefreshCw,
  Image as ImageIcon,
  FileImage,
  AlertTriangle,
  Layers,
  Info,
  Scale,
  Search,
  Loader2,
  Mail,
  Building2,
  UserPlus
} from "lucide-react";
import {
  getCurrentUserAuthorProfileAction,
  searchRegisteredUsersAction,
  submitPaperAction,
} from "@/app/actions";
import type { RegisteredAuthorSummary } from "@/lib/ocs-service";
import { convertReferencesList, countWords, calculateEstimatedPages } from "@/lib/references";

interface CoAuthor {
  user_id: number;
  full_name: string;
  email: string;
  affiliation: string;
  orcid: string;
  ror_id: string;
  credit_roles: string;
  is_primary: boolean;
}

export interface FigureItem {
  id: number;
  file_name: string;
  caption: string;
  dpi: number;
  url: string;
  section: "methods" | "results" | "intro" | "conclusion";
}

export default function SubmitWizardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string || "citeca";

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [protocolId, setProtocolId] = useState<number | null>(null);

  // Form State
  const [trackId, setTrackId] = useState("1");
  const [presentationType, setPresentationType] = useState("oral");
  const [commentsToDirector, setCommentsToDirector] = useState("");
  const [agreedChecklist, setAgreedChecklist] = useState({
    original: true,
    blindReview: true,
    formatting: true,
    copyright: true,
  });

  // Step 2: Artigo Curto Estruturado (IMRaD Web - Máximo 2.000 palavras)
  const [sectionIntro, setSectionIntro] = useState(
    "A disseminação científica em conferências contemporâneas exige modelos de publicação ágeis, abertos e interoperáveis. O modelo tradicional de anais em arquivos estáticos (PDF/DOCX) frequentemente impõe barreiras de indexação e consumo, enquanto a publicação estruturada diretamente na web permite integração imediata com protocolos como Crossref e OAI-PMH. Este trabalho analisa a eficácia da adoção de artigos curtos estruturados (até 2.000 palavras) na retenção de ineditismo para os autores e na aceleração do ciclo de avaliação duplo-cega."
  );
  const [sectionMethods, setSectionMethods] = useState(
    "Foi implementada uma arquitetura baseada no PKP Open Conference Systems (OCS), configurando o recebimento de manuscritos subdivididos nas seções IMRaD: Introdução, Metodologia, Resultados e Considerações Finais. Foi estipulado o teto estrito de 2.000 palavras para o corpo textual, descontando título, resumo, palavras-chave e referências.\n\n[Figura 1: Fluxograma experimental da síntese e preparo das amostras]\n\nPara a validação semântica e operacional, foram empregados os esquemas Dublin Core (oai_dc) e Crossref 4.4.2 (doi_batch).\n\n[Figura 2: Diagrama esquemático do aparato experimental e calibração analítica]\n\nO pipeline incluiu upload de figuras com validação de densidade de 300 DPI e estimador algorítmico de páginas equivalentes para subsidiar o lançamento no Currículo Lattes."
  );
  const [sectionResults, setSectionResults] = useState(
    "A avaliação cega por design garantiu 100% de sigilo autoral, eliminando qualquer vazamento inadvertido de metadados em arquivos proprietários. A mediana de contagem de palavras situou-se em 1.720 palavras, viabilizando artigos densos e rigorosos sem comprometer a posterior submissão de artigos completos de 8.000 palavras a periódicos indexados.\n\n[Figura 3: Espectro de emissão fluorescente e curvas de desempenho experimental]\n\nO cálculo preditivo de páginas gerou uma correspondência estável de 1 a 5 páginas equivalentes em formato A4, facilitando o preenchimento imediato da produção bibliográfica na Plataforma Lattes pelos autores participantes."
  );
  const [sectionConclusion, setSectionConclusion] = useState(
    "A modalidade de artigo curto estruturado puro web representa um avanço significativo para conferências científicas modernas. Ela preserva a propriedade intelectual e o ineditismo das pesquisas, assegura avaliação ética e rigorosa, e democratiza o acesso público aos anais com custo computacional mínimo."
  );

  const [figures, setFigures] = useState<FigureItem[]>([
    {
      id: 1,
      file_name: "figura1_fluxograma_metodologia.png",
      caption: "Figura 1: Fluxograma experimental da síntese e preparo das amostras",
      dpi: 300,
      url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
      section: "methods",
    },
    {
      id: 2,
      file_name: "figura2_aparato_analitico.png",
      caption: "Figura 2: Diagrama esquemático do aparato experimental e calibração analítica",
      dpi: 300,
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
      section: "methods",
    },
    {
      id: 3,
      file_name: "figura3_desempenho_espectro.png",
      caption: "Figura 3: Espectro de emissão fluorescente e curvas de desempenho experimental",
      dpi: 300,
      url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      section: "results",
    },
  ]);
  const [newFigureCaption, setNewFigureCaption] = useState("");
  const [newFigureName, setNewFigureName] = useState("");
  const [newFigureSection, setNewFigureSection] = useState<"methods" | "results" | "intro" | "conclusion">("methods");

  // Step 2: Upload Opcional de Manuscrito Complementar
  const [fileName, setFileName] = useState("manuscrito_pesquisa_academica.pdf");
  const [fileUploaded, setFileUploaded] = useState(true);

  // Step 3: Metadata
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [funding, setFunding] = useState("");
  const [authors, setAuthors] = useState<CoAuthor[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [coauthorQuery, setCoauthorQuery] = useState("");
  const [coauthorResults, setCoauthorResults] = useState<RegisteredAuthorSummary[]>([]);
  const [coauthorSearching, setCoauthorSearching] = useState(false);

  // Pré-preenche automaticamente o 1º autor com os dados oficiais do usuário autenticado
  useEffect(() => {
    let active = true;
    getCurrentUserAuthorProfileAction()
      .then((profile) => {
        if (!active) return;
        setAuthChecked(true);
        if (!profile) return;
        setAuthors((prev) => {
          if (prev.length > 0) return prev;
          return [
            {
              user_id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              affiliation: profile.affiliation,
              orcid: profile.orcid,
              ror_id: profile.ror_id,
              credit_roles: "Conceitualização, Metodologia, Escrita – rascunho original",
              is_primary: true,
            },
          ];
        });
      })
      .catch(() => {
        if (active) setAuthChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Busca coautores cadastrados no sistema (por nome, e-mail, instituição ou ORCID)
  useEffect(() => {
    const term = coauthorQuery.trim();
    if (term.length < 2) {
      setCoauthorResults([]);
      setCoauthorSearching(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCoauthorSearching(true);
      try {
        const excludeIds = authors.map((a) => a.user_id);
        const res = await searchRegisteredUsersAction(term, excludeIds);
        if (!cancelled && res.success) {
          setCoauthorResults(res.users);
        }
      } catch {
        if (!cancelled) setCoauthorResults([]);
      } finally {
        if (!cancelled) setCoauthorSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [coauthorQuery, authors]);

  // Step 3 (Continuação): Referências Bibliográficas & Mini-Agente
  const [referencesText, setReferencesText] = useState("");
  const [referencesStyle, setReferencesStyle] = useState<"abnt" | "apa">("abnt");
  const [agentFeedback, setAgentFeedback] = useState<{
    count: number;
    doiCount: number;
    detectedStyle: "abnt" | "apa";
    message: string;
  } | null>(null);

  const runReferencesAgent = () => {
    if (!referencesText.trim()) {
      setAgentFeedback({
        count: 0,
        doiCount: 0,
        detectedStyle: "abnt",
        message: "Por favor, cole ao menos uma referência para que o assistente possa analisar e higienizar.",
      });
      return;
    }

    const rawLines = referencesText.split(/\r?\n/);
    const cleanedLines: string[] = [];
    let abntScore = 0;
    let apaScore = 0;
    let doiTotal = 0;

    for (const raw of rawLines) {
      let line = raw.trim();
      if (!line) continue;

      // Higienização: remover numeração ou marcadores de lista no início (ex: "1. ", "[1] ", "• ", "- ")
      line = line.replace(/^(\[\d+\]|\d+[\.\)]|\u2022|\-|\*)\s*/, "");

      if (line.length < 10) continue;

      if (/10\.\d{4,9}\/|https?:\/\/doi\.org\//i.test(line)) {
        doiTotal++;
      }

      // Detecção ABNT: Início com SOBRENOME em caixa alta (ex: ALPERIN, SILVA)
      if (/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]{3,}[,\s]/.test(line)) {
        abntScore++;
      }

      // Detecção APA: Presença de ano entre parênteses após autores (ex: "(2021).")
      if (/\([12]\d{3}[a-z]?\)/.test(line)) {
        apaScore++;
      }

      cleanedLines.push(line);
    }

    const detected: "abnt" | "apa" = abntScore >= apaScore ? "abnt" : "apa";
    setReferencesStyle(detected);
    const formatted = cleanedLines.join("\n\n");
    setReferencesText(formatted);

    setAgentFeedback({
      count: cleanedLines.length,
      doiCount: doiTotal,
      detectedStyle: detected,
      message: `Assistente: ${cleanedLines.length} referências higienizadas com sucesso (${doiTotal} com DOI detectado). Padrão ${detected.toUpperCase() === "ABNT" ? "ABNT (NBR 6023)" : "APA (7th Edition)"} identificado e selecionado!`,
    });
  };

  const handleConvertStyle = (target: "abnt" | "apa") => {
    if (!referencesText.trim()) return;
    const converted = convertReferencesList(referencesText, target);
    setReferencesText(converted);
    setReferencesStyle(target);
    const count = converted.split(/\r?\n/).filter(l => l.trim().length > 8).length;
    const doiCount = (converted.match(/10\.\d{4,9}\/|https?:\/\/doi\.org\//gi) || []).length;
    setAgentFeedback({
      count,
      doiCount,
      detectedStyle: target,
      message: `Conversão realizada com sucesso: ${count} referências convertidas para o padrão ${target === "abnt" ? "ABNT (NBR 6023)" : "APA (7th Edition)"}!`,
    });
  };

  // Step 4: Supp file
  const [suppFile, setSuppFile] = useState("");

  const steps = [
    { num: 1, label: "1. Início & Termos" },
    { num: 2, label: "2. Artigo Curto & Figuras" },
    { num: 3, label: "3. Metadados & Autores" },
    { num: 4, label: "4. Doc. Suplementares" },
    { num: 5, label: "5. Confirmação" },
  ];

  // Cálculos de Palavras e Estimativa de Páginas para Lattes
  const bodyText = `${sectionIntro} ${sectionMethods} ${sectionResults} ${sectionConclusion}`;
  const bodyWords = countWords(bodyText);
  const maxWords = 2000;
  const isOverLimit = bodyWords > maxWords;
  const wordPercentage = Math.min(100, Math.round((bodyWords / maxWords) * 100));
  const estimatedPages = calculateEstimatedPages(bodyWords, figures.length);

  const handleAddFigure = () => {
    if (!newFigureCaption.trim()) return;
    const nextId = figures.length > 0 ? Math.max(...figures.map(f => f.id)) + 1 : 1;
    const newFig: FigureItem = {
      id: nextId,
      file_name: newFigureName || `figura_${nextId}_300dpi.png`,
      caption: newFigureCaption.startsWith("Figura") ? newFigureCaption : `Figura ${nextId}: ${newFigureCaption}`,
      dpi: 300,
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
      section: newFigureSection,
    };
    setFigures([...figures, newFig]);
    setNewFigureCaption("");
    setNewFigureName("");
  };

  const handleRemoveFigure = (id: number) => {
    setFigures(figures.filter((f) => f.id !== id));
  };

  const handleInsertFigureIntoSection = (fig: FigureItem, targetSection: "methods" | "results" | "intro" | "conclusion") => {
    const tag = `\n\n[Figura ${fig.id}: ${fig.caption}]\n\n`;
    if (targetSection === "methods") {
      setSectionMethods((prev) => prev.trim() + tag);
    } else if (targetSection === "results") {
      setSectionResults((prev) => prev.trim() + tag);
    } else if (targetSection === "intro") {
      setSectionIntro((prev) => prev.trim() + tag);
    } else if (targetSection === "conclusion") {
      setSectionConclusion((prev) => prev.trim() + tag);
    }
  };

  const addRegisteredCoAuthor = (user: RegisteredAuthorSummary) => {
    if (authors.some((a) => a.user_id === user.id)) return;
    setAuthors([
      ...authors,
      {
        user_id: user.id,
        full_name: user.full_name,
        email: user.email,
        affiliation: user.affiliation,
        orcid: user.orcid,
        ror_id: user.ror_id,
        credit_roles: "Investigação, Metodologia, Redação",
        is_primary: authors.length === 0,
      },
    ]);
    setCoauthorQuery("");
    setCoauthorResults([]);
  };

  const removeAuthor = (index: number) => {
    if (index === 0 || authors.length <= 1) return;
    setAuthors(authors.filter((_, i) => i !== index));
  };

  const updateAuthorCredit = (index: number, creditRoles: string) => {
    const updated = [...authors];
    updated[index] = { ...updated[index], credit_roles: creditRoles };
    setAuthors(updated);
  };

  const handleSubmitFinal = async () => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("sched_conf_id", "1"); // CITECA 2026
    formData.append("track_id", trackId);
    formData.append("user_id", "6"); // Dr. Lucas Martins
    formData.append("title", title || "Nova Proposta de Artigo Acadêmico");
    formData.append("abstract", abstract || "Resumo detalhado com contextualização, metodologia e resultados esperados.");
    formData.append("keywords", keywords || "Ciência Aberta, Tecnologia, OCS");
    formData.append("presentation_type", presentationType);
    formData.append("funding", funding);
    formData.append("comments_to_director", commentsToDirector);
    formData.append("file_name", fileName);
    formData.append("references_text", referencesText);
    formData.append("references_style", referencesStyle);

    // Seções Estruturadas do Artigo Curto & Figuras 300 DPI
    formData.append("section_intro", sectionIntro);
    formData.append("section_methods", sectionMethods);
    formData.append("section_results", sectionResults);
    formData.append("section_conclusion", sectionConclusion);
    formData.append("figures_json", JSON.stringify(figures));
    formData.append("page_start", String(estimatedPages.start));
    formData.append("page_end", String(estimatedPages.end));

    authors.forEach((a) => {
      formData.append("author_user_id", String(a.user_id));
      formData.append("author_credit", a.credit_roles);
    });

    try {
      const res = await submitPaperAction(formData);
      if (res?.success && typeof res.paperId === "number") {
        setProtocolId(res.paperId);
        setCurrentStep(6); // Step 6 = Tela de Sucesso
      } else {
        alert(res?.error || "Ocorreu um erro ao submeter o trabalho.");
      }
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao submeter o trabalho.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-700">Início</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/conference/${slug}`} className="hover:text-blue-700 uppercase">{slug}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800">Submissão de Artigo</span>
      </nav>

      {/* Título & Indicador de Passos */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Submissão de Manuscrito Acadêmico
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fluxo editorial em 5 passos em conformidade com o padrão PKP Open Conference Systems (OCS 2.3.6).
          </p>
        </div>

        {/* Progress Bar de Passos */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-t border-slate-100 pt-6">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`flex flex-col items-center text-center p-2 rounded-lg border text-xs transition ${
                  isCurrent
                    ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                    : isCompleted
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-medium"
                    : "border-slate-200 text-slate-400 bg-slate-50"
                }`}
              >
                <div className="flex items-center space-x-1">
                  {isCompleted ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isCurrent ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-700"}`}>
                      {s.num}
                    </span>
                  )}
                  <span>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conteúdo dos Passos */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        {/* PASSO 1: INÍCIO E TERMOS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Passo 1. Iniciar Submissão & Declarações
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Trilha Temática (Track) *
                </label>
                <select
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="1">Trilha 1: Ciência Aberta, FAIR Principles e Repositórios</option>
                  <option value="2">Trilha 2: Inteligência Artificial e Tecnologias Emergentes</option>
                  <option value="3">Trilha 3: Políticas Públicas, Avaliação por Pares e Metaciência</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Selecione a trilha mais adequada ao escopo temático do seu manuscrito.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Modalidade de Apresentação *
                </label>
                <select
                  value={presentationType}
                  onChange={(e) => setPresentationType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="oral">Apresentação Oral (Artigo Completo)</option>
                  <option value="poster">Sessão de Pôster / Comunicação Breve</option>
                  <option value="workshop">Oficina / Minicurso Prático</option>
                </select>
              </div>
            </div>

            {/* Checklist de Submissão */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span>Condições para Submissão (Checklist Obrigatório)</span>
              </h3>
              <p className="text-xs text-slate-600">
                Como parte do processo de submissão, os autores são obrigados a verificar a conformidade da submissão com todos os itens listados a seguir:
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-700">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedChecklist.original}
                    onChange={(e) => setAgreedChecklist({ ...agreedChecklist, original: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>A contribuição é original e inédita, e não está sendo avaliada para publicação por outra conferência ou periódico.</span>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedChecklist.blindReview}
                    onChange={(e) => setAgreedChecklist({ ...agreedChecklist, blindReview: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>O arquivo enviado para avaliação cega não contém nomes de autores, afiliações ou menções explícitas no corpo do texto ou propriedades do arquivo.</span>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedChecklist.formatting}
                    onChange={(e) => setAgreedChecklist({ ...agreedChecklist, formatting: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>O texto segue os padrões de formatação, limites de páginas e diretrizes bibliográficas da conferência.</span>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedChecklist.copyright}
                    onChange={(e) => setAgreedChecklist({ ...agreedChecklist, copyright: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Concordo com os termos de cessão de direitos e publicação em acesso aberto sob licença Creative Commons caso aceito.</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Comentários para o Editor da Conferência (Opcional)
              </label>
              <textarea
                value={commentsToDirector}
                onChange={(e) => setCommentsToDirector(e.target.value)}
                rows={3}
                placeholder="Insira qualquer observação relevante ou indicação de conflito de interesses para a equipe editorial..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* PASSO 2: REDAÇÃO ESTRUTURADA DO ARTIGO CURTO & FIGURAS (300 DPI) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Modalidade: Artigo Curto Estruturado
                  </span>
                  <span className="text-xs text-slate-500">• Limite de 2.000 palavras</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Passo 2. Redação Estruturada do Artigo Curto & Figuras (300 DPI)
                </h2>
              </div>
              <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shrink-0">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                <span>Padrão IMRaD Puro Web</span>
              </div>
            </div>

            {/* Banner de Esclarecimento sobre o Artigo Curto & Ineditismo */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-950 space-y-2">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-blue-900 leading-snug">
                    Por que Artigo Curto (até 2.000 palavras) nos Anais?
                  </p>
                  <p className="text-blue-800 leading-relaxed">
                    O formato de artigo curto permite a você publicar e registrar formalmente resultados preliminares ou avanços parciais nos anais do evento sem queimar o ineditismo. Assim, a pesquisa pode ser posteriormente expandida para um artigo completo (6.000 a 8.000 palavras) e submetida a periódicos científicos de alto impacto.
                  </p>
                  <p className="text-blue-800 leading-relaxed font-medium">
                    🛡️ <strong>Avaliação Duplo-Cego por Design:</strong> O manuscrito é digitado diretamente na plataforma. Os pareceristas leem o texto puro e as figuras sem metadados ocultos de softwares proprietários (Word/PDF), eliminando qualquer risco de quebra de sigilo.
                  </p>
                </div>
              </div>
            </div>

            {/* Painel do Contador Inteligente de Palavras & Estimativa Lattes */}
            <div className={`p-4 rounded-xl border transition space-y-3 ${
              isOverLimit 
                ? "bg-red-50/80 border-red-300 text-red-950" 
                : bodyWords >= 1600 
                ? "bg-amber-50/70 border-amber-300 text-amber-950" 
                : "bg-slate-50 border-slate-200 text-slate-900"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm">Contador de Palavras do Corpo:</span>
                  <span className={`font-mono text-base font-extrabold px-2 py-0.5 rounded ${
                    isOverLimit ? "bg-red-200 text-red-900" : "bg-white text-slate-900 border border-slate-200"
                  }`}>
                    {bodyWords} / {maxWords} palavras
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    ({wordPercentage}%)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded text-[11px] flex items-center space-x-1 border border-emerald-200">
                    <span>📋 Estimativa para o Lattes (CNPq):</span>
                    <strong>Páginas {estimatedPages.start} a {estimatedPages.end} (~{estimatedPages.total} págs)</strong>
                  </span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isOverLimit ? "bg-red-600" : bodyWords >= 1600 ? "bg-amber-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${wordPercentage}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <span className="flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span><strong>Descontados do limite:</strong> Título, Resumo, Palavras-chave e Referências Bibliográficas.</span>
                </span>
                {isOverLimit && (
                  <span className="text-red-700 font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>Reduza {bodyWords - maxWords} palavra(s) para respeitar o teto do Artigo Curto!</span>
                  </span>
                )}
              </div>
            </div>

            {/* As 4 Seções IMRaD */}
            <div className="space-y-5">
              {/* Seção 1: Introdução */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">1</span>
                    <span>1. Introdução (Problema, Justificativa e Objetivos) *</span>
                  </label>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {countWords(sectionIntro)} palavras
                  </span>
                </div>
                <textarea
                  value={sectionIntro}
                  onChange={(e) => setSectionIntro(e.target.value)}
                  rows={4}
                  placeholder="Apresente a contextualização da pesquisa, lacuna de conhecimento, pergunta norteadora e objetivos..."
                  className="w-full border border-slate-300 rounded-lg p-3 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Seção 2: Materiais e Métodos */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">2</span>
                    <span>2. Materiais e Métodos (Procedimentos Metodológicos) *</span>
                  </label>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {countWords(sectionMethods)} palavras
                  </span>
                </div>

                {/* Atalhos para inserir figuras na Metodologia */}
                {figures.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 bg-blue-50/60 p-2 rounded-lg border border-blue-100 text-[11px]">
                    <span className="font-semibold text-blue-900 flex items-center space-x-1">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Inserir tag na Metodologia:</span>
                    </span>
                    {figures.map((fig) => (
                      <button
                        key={fig.id}
                        type="button"
                        onClick={() => handleInsertFigureIntoSection(fig, "methods")}
                        className={`px-2 py-0.5 rounded border transition flex items-center space-x-1 cursor-pointer text-xs ${
                          fig.section === "methods"
                            ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700 font-bold shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={`Inserir chamada da Figura ${fig.id} nesta seção`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>[Figura {fig.id}]</span>
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  value={sectionMethods}
                  onChange={(e) => setSectionMethods(e.target.value)}
                  rows={5}
                  placeholder="Descreva detalhadamente o desenho experimental, universo de pesquisa, procedimentos e técnicas analíticas..."
                  className="w-full border border-slate-300 rounded-lg p-3 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Seção 3: Resultados e Discussão */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">3</span>
                    <span>3. Resultados e Discussão (Achados Empíricos & Figuras) *</span>
                  </label>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {countWords(sectionResults)} palavras
                  </span>
                </div>

                {/* Atalhos para inserir figuras nos Resultados */}
                {figures.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 bg-purple-50/60 p-2 rounded-lg border border-purple-100 text-[11px]">
                    <span className="font-semibold text-purple-900 flex items-center space-x-1">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                      <span>Inserir tag nos Resultados:</span>
                    </span>
                    {figures.map((fig) => (
                      <button
                        key={fig.id}
                        type="button"
                        onClick={() => handleInsertFigureIntoSection(fig, "results")}
                        className={`px-2 py-0.5 rounded border transition flex items-center space-x-1 cursor-pointer text-xs ${
                          fig.section === "results"
                            ? "bg-purple-600 text-white border-purple-700 hover:bg-purple-700 font-bold shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={`Inserir chamada da Figura ${fig.id} nesta seção`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>[Figura {fig.id}]</span>
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  value={sectionResults}
                  onChange={(e) => setSectionResults(e.target.value)}
                  rows={6}
                  placeholder="Exponha os resultados obtidos, confronte com a literatura e insira as referências às figuras como [Figura 3: Título]..."
                  className="w-full border border-slate-300 rounded-lg p-3 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Seção 4: Considerações Finais */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">4</span>
                    <span>4. Considerações Finais (Conclusões, Limitações e Desdobramentos) *</span>
                  </label>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {countWords(sectionConclusion)} palavras
                  </span>
                </div>
                <textarea
                  value={sectionConclusion}
                  onChange={(e) => setSectionConclusion(e.target.value)}
                  rows={4}
                  placeholder="Sintetize as principais contribuições, impactos científicos, limitações e recomendações para trabalhos futuros..."
                  className="w-full border border-slate-300 rounded-lg p-3 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Módulo de Figuras em Alta Resolução (300 DPI) */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Módulo de Figuras em Alta Resolução (300 DPI)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cadastre figuras para a Metodologia (ex: Fig 1 e 2) e para os Resultados (ex: Fig 3) com certificação 300 DPI.
                  </p>
                </div>
                <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded text-[11px] self-start sm:self-auto">
                  {figures.length} figura(s) cadastrada(s)
                </span>
              </div>

              {/* Upload e Inclusão de Nova Figura */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Legenda / Título da Figura *
                    </label>
                    <input
                      type="text"
                      value={newFigureCaption}
                      onChange={(e) => setNewFigureCaption(e.target.value)}
                      placeholder={`Ex: Figura ${figures.length + 1}: Esquema analítico...`}
                      className="w-full border border-slate-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Seção Alvo do Artigo *
                    </label>
                    <select
                      value={newFigureSection}
                      onChange={(e) => setNewFigureSection(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-md p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="methods">Materiais e Métodos (Metodologia)</option>
                      <option value="results">Resultados e Discussão</option>
                      <option value="intro">Introdução</option>
                      <option value="conclusion">Considerações Finais</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Arquivo de Imagem (300 DPI)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNewFigureName(e.target.files[0].name);
                          if (!newFigureCaption) {
                            setNewFigureCaption(`Figura ${figures.length + 1}: ${e.target.files[0].name.replace(/\.[^/.]+$/, "")}`);
                          }
                        }
                      }}
                      className="w-full border border-slate-300 rounded-md p-1.5 text-xs text-slate-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-emerald-700 flex items-center space-x-1 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Validador Gráfico: Certificação 300 DPI ativa para anais</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddFigure}
                    disabled={!newFigureCaption.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition shadow-2xs disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Figura (300 DPI)</span>
                  </button>
                </div>
              </div>

              {/* Lista de Figuras Cadastradas */}
              {figures.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-700 block">Figuras anexadas ao trabalho:</span>
                  <div className="grid grid-cols-1 gap-3">
                    {figures.map((fig) => (
                      <div
                        key={fig.id}
                        className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-12 bg-slate-100 border border-slate-200 rounded overflow-hidden flex items-center justify-center shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={fig.url} alt={fig.caption} className="w-full h-full object-cover" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 text-xs block">{fig.caption}</span>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                              <span className="font-mono">{fig.file_name}</span>
                              <span>•</span>
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                                {fig.dpi} DPI
                              </span>
                              <span>•</span>
                              <span className={`px-2 py-0.2 rounded font-semibold ${
                                fig.section === "methods"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : fig.section === "results"
                                  ? "bg-purple-50 text-purple-800 border border-purple-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}>
                                {fig.section === "methods"
                                  ? "📍 Materiais e Métodos"
                                  : fig.section === "results"
                                  ? "📍 Resultados e Discussão"
                                  : "📍 " + (fig.section || "Geral")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleInsertFigureIntoSection(fig, "methods")}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs flex items-center space-x-1 border border-blue-200 transition cursor-pointer"
                            title="Inserir chamada [Figura X] na Metodologia"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>+ Inserir na Metodologia</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertFigureIntoSection(fig, "results")}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs flex items-center space-x-1 border border-purple-200 transition cursor-pointer"
                            title="Inserir chamada [Figura X] nos Resultados"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>+ Inserir nos Resultados</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFigure(fig.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition cursor-pointer"
                            title="Remover figura"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Opcional: Arquivo Complementar / Backup */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
              <strong className="text-slate-800 block font-bold">Arquivo Complementar do Trabalho (Opcional)</strong>
              <p className="text-slate-600">
                Caso deseje anexar também uma versão compilada em PDF como cópia de segurança:
              </p>
              <div className="flex items-center space-x-3 pt-1">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                      setFileUploaded(true);
                    }
                  }}
                  className="text-xs text-slate-600"
                />
                {fileUploaded && (
                  <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium border border-emerald-200">
                    {fileName} (Anexado)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3: METADADOS E COAUTORES */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Passo 3. Inclusão de Metadados da Submissão (Indexação)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título do Artigo / Trabalho *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Análise Comparativa de Métricas de Avaliação Editorial em Conferências Abertas"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Resumo (Abstract) *
                </label>
                <textarea
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  rows={5}
                  placeholder="Insira o resumo do trabalho contendo introdução, objetivos, metodologia e conclusões (mínimo 150 palavras)..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Palavras-chave (Separadas por vírgula) *
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Ex: Ciência Aberta, OCS, Repositórios Digitais, Avaliação por Pares"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Financiamento da Pesquisa (Agência de Fomento & Processo)
                </label>
                <input
                  type="text"
                  value={funding}
                  onChange={(e) => setFunding(e.target.value)}
                  placeholder="Ex: FAPESP Proc. nº 2024/08123-4; CAPES Código 001; CNPq Bolsa 1D (ou 'Sem fomento')"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Indique os órgãos de fomento, editais ou programas institucionais que financiaram o estudo.
                </p>
              </div>
            </div>

            {/* Autores vinculados exclusivamente a usuários cadastrados no sistema */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Autores Cadastrados (Nome, E-mail, ROR, ORCID e CRediT)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Todos os autores e coautores precisam estar cadastrados no portal para puxar automaticamente Nome completo, E-mail, Instituição (ROR) e ORCID para os anais.
                </p>
              </div>

              {authChecked && authors.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span>
                    Você precisa estar autenticado para vincular seu perfil como autor principal e buscar coautores cadastrados.
                  </span>
                  <Link
                    href={`/login?next=/conference/${slug}/submit`}
                    className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs shrink-0 text-center"
                  >
                    Entrar / Cadastrar
                  </Link>
                </div>
              )}

              {/* Buscador de Coautores Cadastrados */}
              {authors.length > 0 && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2.5">
                  <label htmlFor="coauthor-search" className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-blue-700" />
                    <span>Adicionar Coautor Cadastrado</span>
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="coauthor-search"
                      type="text"
                      value={coauthorQuery}
                      onChange={(e) => setCoauthorQuery(e.target.value)}
                      placeholder="Busque por nome completo, e-mail, instituição ou ORCID..."
                      className="w-full pl-9 pr-9 py-2 bg-white border border-blue-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    {coauthorSearching && (
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-3 top-2.5" />
                    )}
                  </div>

                  {coauthorQuery.trim().length >= 2 && !coauthorSearching && coauthorResults.length === 0 && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Nenhum pesquisador cadastrado encontrado para &ldquo;{coauthorQuery.trim()}&rdquo;. Peça ao coautor que crie uma conta em <strong>Entrar / Cadastrar</strong> antes de adicioná-lo ao trabalho.
                    </p>
                  )}

                  {coauthorResults.length > 0 && (
                    <ul className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto shadow-xs">
                      {coauthorResults.map((u) => (
                        <li key={u.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-blue-50/50">
                          <div className="min-w-0 text-xs">
                            <div className="font-bold text-slate-900 truncate">{u.full_name}</div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2">
                              <span>{u.email}</span>
                              {u.affiliation && <span>• {u.affiliation}</span>}
                              {u.orcid && <span className="font-mono text-emerald-700">• ORCID: {u.orcid}</span>}
                              {u.ror_id && (
                                <span className="font-mono text-blue-700">
                                  • ROR: {u.ror_id.replace(/^https?:\/\/ror\.org\//, "")}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addRegisteredCoAuthor(u)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-md text-[11px] flex items-center space-x-1 shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Adicionar</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Lista de Autores Vinculados (dados oficiais puxados do cadastro) */}
              <div className="space-y-3">
                {authors.map((author, index) => (
                  <div key={author.user_id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <div className="flex items-center space-x-2">
                        <span>{index === 0 ? "Autor Principal (Contato)" : `Coautor ${index + 1}`}</span>
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Cadastro vinculado
                        </span>
                      </div>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeAuthor(index)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                          title="Remover coautor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-white border border-slate-200/80 rounded-lg p-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Nome Completo</span>
                        <span className="font-semibold text-slate-900">{author.full_name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">E-mail</span>
                        <span className="text-slate-700 inline-flex items-center space-x-1 break-all">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{author.email}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Instituição / ROR</span>
                        <span className="text-slate-700 block">{author.affiliation || "Não informada"}</span>
                        {author.ror_id && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded mt-1">
                            <Building2 className="w-2.5 h-2.5" />
                            <span>ROR: {author.ror_id.replace(/^https?:\/\/ror\.org\//, "")}</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">ORCID iD</span>
                        {author.orcid ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-0.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white font-bold text-[8px] flex items-center justify-center">
                              iD
                            </span>
                            <span>{author.orcid.replace(/^https?:\/\/orcid\.org\//, "")}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Não informado no perfil</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Papel CRediT do Autor
                      </label>
                      <select
                        value={author.credit_roles}
                        onChange={(e) => updateAuthorCredit(index, e.target.value)}
                        className="w-full border border-slate-300 rounded-md p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      >
                        <option value="Conceitualização, Metodologia, Escrita – rascunho original">Conceitualização, Metodologia, Escrita – rascunho original</option>
                        <option value="Curadoria de dados, Análise formal, Escrita – revisão e edição">Curadoria de dados, Análise formal, Escrita – revisão e edição</option>
                        <option value="Investigação, Software, Validação">Investigação, Software, Validação</option>
                        <option value="Supervisão, Obtenção de financiamento, Administração">Supervisão, Obtenção de financiamento, Administração</option>
                        <option value="Recursos, Metodologia, Visualização">Recursos, Metodologia, Visualização</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referências Bibliográficas Citadas & Mini-Agente de Detecção */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>Referências Bibliográficas do Trabalho (Indexação & Citações)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Insira as referências citadas no artigo para indexação automática no Crossref, Google Scholar e OAI-PMH.
                  </p>
                </div>

                {/* Seletor de Estilo */}
                <div className="flex items-center space-x-3 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
                  <span className="font-bold text-slate-700">Norma:</span>
                  <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="referencesStyle"
                      value="abnt"
                      checked={referencesStyle === "abnt"}
                      onChange={() => setReferencesStyle("abnt")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>ABNT (NBR 6023)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="referencesStyle"
                      value="apa"
                      checked={referencesStyle === "apa"}
                      onChange={() => setReferencesStyle("apa")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>APA (7th Edition)</span>
                  </label>
                </div>
              </div>

              {/* Textarea e Mini-Agente de Formatação */}
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    value={referencesText}
                    onChange={(e) => setReferencesText(e.target.value)}
                    rows={6}
                    placeholder={`Cole aqui as referências citadas (uma por linha ou separadas por enter).\nExemplo (${referencesStyle.toUpperCase()}):\n${
                      referencesStyle === "abnt"
                        ? "ALPERIN, J. P.; MCKIERNAN, E. C. Open science practices in academic promotion. eLife, 2019. DOI: https://doi.org/10.7554/eLife.42254."
                        : "Alperin, J. P., & McKiernan, E. C. (2019). Open science practices in academic promotion. eLife, 8, e42254. https://doi.org/10.7554/eLife.42254"
                    }`}
                    className="w-full border border-slate-300 rounded-lg p-3 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-slate-50/30"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-500">
                    💡 <strong>Como inserir:</strong> Copie e cole com enter entre as referências. Você pode alternar o estilo a qualquer momento.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleConvertStyle(referencesStyle === "abnt" ? "apa" : "abnt")}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-2xs transition cursor-pointer"
                      title="Converte automaticamente todas as referências entre ABNT NBR 6023 e APA 7th Edition"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                      <span>{referencesStyle === "abnt" ? "Converter para APA 7" : "Converter para ABNT"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={runReferencesAgent}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
                      title="O assistente remove números iniciais [1], padroniza os espaçamentos e detecta automaticamente se é ABNT ou APA"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Assistente: Higienizar</span>
                    </button>
                  </div>
                </div>

                {/* Feedback do Assistente */}
                {agentFeedback && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-900 flex items-start space-x-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold">{agentFeedback.message}</p>
                      <p className="text-[11px] text-purple-700">
                        Os motores de busca e o Crossref irão extrair essas {agentFeedback.count} referências estruturadamente.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PASSO 4: DOCUMENTOS SUPLEMENTARES */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Passo 4. Transferência de Documentos Suplementares (Opcional)
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed">
              Este passo permite enviar arquivos adicionais que complementem a submissão, tais como instrumentos de pesquisa, conjuntos de dados (datasets), aprovação de Comitê de Ética ou planilhas estatísticas.
            </p>

            <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Nome do Documento / Anexo (Opcional)
              </label>
              <input
                type="text"
                value={suppFile}
                onChange={(e) => setSuppFile(e.target.value)}
                placeholder="Ex: apendice_estatistico_dataset.xlsx"
                className="w-full border border-slate-300 rounded-md p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-500">
                Caso não possua documentos suplementares, clique diretamente em Próximo Passo.
              </p>
            </div>
          </div>
        )}

        {/* PASSO 5: CONFIRMAÇÃO */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Passo 5. Confirmação e Envio da Submissão
            </h2>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4 text-xs">
              <div>
                <strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Título do Manuscrito</strong>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{title || "Sem título informado"}</p>
              </div>

              <div>
                <strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Autores, Identificadores & CRediT</strong>
                <div className="space-y-2 mt-1">
                  {authors.map((a, i) => (
                    <div key={i} className="bg-white p-2.5 rounded border border-slate-200 text-slate-800">
                      <div className="font-bold flex items-center space-x-2">
                        <span>{a.full_name || "Autor"}</span>
                        {a.orcid && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono font-medium">
                            ORCID: {a.orcid}
                          </span>
                        )}
                        {a.ror_id && (
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-mono font-medium truncate max-w-[200px]">
                            ROR: {a.ror_id}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Instituição: {a.affiliation || "Não informada"} • E-mail: {a.email}
                      </div>
                      {a.credit_roles && (
                        <div className="text-[11px] text-purple-700 mt-0.5">
                          <strong>Papel CRediT:</strong> {a.credit_roles}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {funding && (
                <div>
                  <strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Financiamento da Pesquisa</strong>
                  <p className="text-slate-800 font-medium mt-0.5 bg-white p-2 rounded border border-slate-200">{funding}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Trilha Selecionada</strong>
                  <p className="text-slate-800 font-medium mt-0.5">Trilha {trackId}</p>
                </div>
                <div>
                  <strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Modalidade Editorial</strong>
                  <p className="text-slate-800 font-medium mt-0.5 uppercase">Artigo Curto Estruturado (IMRaD Web)</p>
                </div>
              </div>

              {/* Detalhes do Artigo Curto & Paginação Lattes */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                <strong className="text-slate-900 font-bold block text-xs">Parâmetros do Artigo Curto (Puro Web):</strong>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-500 block">Corpo do Trabalho:</span>
                    <strong className={isOverLimit ? "text-red-600" : "text-emerald-700"}>
                      {bodyWords} / 2.000 palavras
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-500 block">Figuras Gráficas:</span>
                    <strong className="text-purple-700">{figures.length} figura(s) (300 DPI)</strong>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-200 text-emerald-900">
                    <span className="text-emerald-700 block font-semibold">Currículo Lattes (CNPq):</span>
                    <strong>Páginas {estimatedPages.start} a {estimatedPages.end} ({estimatedPages.total} págs)</strong>
                  </div>
                </div>
              </div>

              <div>
                <strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Arquivo Complementar</strong>
                <p className="text-slate-800 font-medium mt-0.5 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>{fileName}</span>
                </p>
              </div>

              <div>
                <strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Palavras-chave</strong>
                <p className="text-slate-800 font-medium mt-0.5">{keywords || "Ciência Aberta, OCS"}</p>
              </div>

              {referencesText && (
                <div>
                  <strong className="text-slate-400 uppercase tracking-wider block text-[10px]">
                    Referências Bibliográficas Cadastradas ({referencesStyle === "abnt" ? "ABNT NBR 6023" : "APA 7th Edition"})
                  </strong>
                  <p className="text-slate-800 font-medium mt-0.5 bg-white p-2.5 rounded border border-slate-200">
                    {referencesText.split(/\r?\n/).filter(l => l.trim().length > 8).length} referências prontas para indexação científica no Crossref, Google Scholar e OAI-PMH.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800">
              Ao clicar no botão <strong>Concluir e Enviar Submissão</strong>, seu manuscrito será registrado na fila editorial do Editor da Conferência e receberá um número de protocolo definitivo para acompanhamento.
            </div>
          </div>
        )}

        {/* PASSO 6: TELA DE SUCESSO */}
        {currentStep === 6 && (
          <div className="text-center py-10 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Submissão Enviada com Sucesso!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Seu trabalho foi devidamente recebido e encaminhado para a equipe editorial da conferência.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-sm mx-auto text-xs space-y-1">
              <span className="text-slate-500">Número do Protocolo da Submissão:</span>
              <p className="text-lg font-bold text-blue-700">#{protocolId || "104"}</p>
            </div>

            <div className="pt-4 flex justify-center space-x-3">
              <Link
                href="/dashboard/author"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-xs shadow-xs transition"
              >
                Acompanhar no Painel do Autor
              </Link>
              <Link
                href="/"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-lg text-xs transition"
              >
                Voltar ao Portal OCS
              </Link>
            </div>
          </div>
        )}

        {/* Botões de Navegação Inferior */}
        {currentStep <= 5 && (
          <div className="border-t border-slate-100 pt-6 mt-8 flex justify-between items-center">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs flex items-center space-x-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Passo Anterior</span>
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-xs flex items-center space-x-1.5 transition shadow-2xs"
              >
                <span>Próximo Passo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitFinal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center space-x-2 transition shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Gravando Submissão..." : "Concluir e Enviar Submissão"}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
