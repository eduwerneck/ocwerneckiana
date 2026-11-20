"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Paper, ReviewAssignment, User } from "@/lib/ocs-service";
import { AcademicCertificate } from "@/lib/email-service";
import { updateUserReviewerProfileAction } from "@/app/actions";
import { formatDatePtBr } from "@/lib/date";
import AuthorSubmissionsClient from "../author/AuthorSubmissionsClient";
import ReviewerFormClient from "../reviewer/ReviewerFormClient";
import { 
  FileText, 
  UserCheck, 
  ShieldCheck, 
  Send, 
  BookOpen, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Award,
  Layers,
  Building2,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Tag,
  Settings,
  X
} from "lucide-react";

interface Props {
  user: User | null;
  authorPapers: Paper[];
  reviewerAssignments: ReviewAssignment[];
  certificates: AcademicCertificate[];
  initialTab?: "author" | "reviewer" | "certificates";
  activeConfSlug?: string;
  isAdmin?: boolean;
}

export default function UnifiedUserDashboardClient({
  user,
  authorPapers,
  reviewerAssignments,
  certificates,
  initialTab = "author",
  activeConfSlug = "citeca",
  isAdmin = false,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"author" | "reviewer" | "certificates">(initialTab);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Estados do formulário de perfil de avaliador
  const [isReviewerCandidate, setIsReviewerCandidate] = useState(user?.is_reviewer_candidate === 1);
  const [reviewInterests, setReviewInterests] = useState(user?.review_interests || "");
  const [preferredTracks, setPreferredTracks] = useState<string[]>(
    (user?.preferred_track_ids || "1").split(",").map(s => s.trim())
  );
  const [lattesUrl, setLattesUrl] = useState(user?.lattes_url || "");
  const [orcid, setOrcid] = useState(user?.orcid || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const pendingReviewsCount = reviewerAssignments.filter((a) => a.status === "pending").length;
  const completedReviewsCount = reviewerAssignments.filter((a) => a.status === "completed").length;
  const hasReviewerRole = Boolean(
    user?.role === "reviewer" || user?.is_reviewer_candidate === 1 || reviewerAssignments.length > 0
  );
  const submitHref = `/conference/${activeConfSlug}/submit`;

  const handleCopyHash = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Clipboard indisponível em contexto não-HTTPS
    }
  };

  const handleSaveReviewerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileError(null);

    const formData = new FormData();
    formData.append("is_reviewer_candidate", isReviewerCandidate ? "true" : "false");
    formData.append("review_interests", reviewInterests);
    formData.append("preferred_track_ids", preferredTracks.join(","));
    formData.append("lattes_url", lattesUrl);
    formData.append("orcid", orcid);

    try {
      const res = await updateUserReviewerProfileAction(formData);
      if (res.success) {
        setProfileModalOpen(false);
        router.refresh();
      } else {
        setProfileError(res.error || "Erro ao salvar perfil.");
      }
    } catch {
      setProfileError("Erro de conexão ao salvar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleTrack = (tId: string) => {
    if (preferredTracks.includes(tId)) {
      setPreferredTracks(preferredTracks.filter(t => t !== tId));
    } else {
      setPreferredTracks([...preferredTracks, tId]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-700">Início</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800">Meu Painel Acadêmico</span>
      </nav>

      {/* Cartão de Perfil do Usuário com Funções e Interesses */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-blue-200">
                Painel Unificado de Usuário
              </span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-500">Papéis ativos:</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                  Autor
                </span>
                {hasReviewerRole && (
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    Avaliador
                  </span>
                )}
                {isAdmin && (
                  <Link
                    href="/dashboard/director"
                    className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono transition"
                  >
                    Ir para Modo Admin →
                  </Link>
                )}
              </div>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {user?.full_name || "Usuário Autenticado"}
            </h1>
            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
              {user?.affiliation && (
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.affiliation}</span>
                </span>
              )}
              {user?.orcid && (
                <>
                  <span>•</span>
                  <a
                    href={`https://orcid.org/${user.orcid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 font-mono font-semibold hover:underline"
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">iD</span>
                    <span>{user.orcid}</span>
                  </a>
                </>
              )}
            </p>

            {/* Interesses de Avaliação e Matching */}
            {user?.review_interests && (
              <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                <span className="text-[11px] font-bold text-purple-900 flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-purple-600" />
                  <span>Áreas de Parecer:</span>
                </span>
                {user.review_interests.split(/[,;]+/).map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-medium px-2 py-0.5 rounded-md"
                  >
                    {item.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer border border-slate-200"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Interesses de Avaliação</span>
            </button>

            <Link
              href={submitHref}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition flex items-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submeter Novo Artigo</span>
            </Link>
          </div>
        </div>

        {/* Resumo de Atividades */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-slate-500 text-[11px] block">Artigos Submetidos (Autor)</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">{authorPapers.length}</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
            <span className="text-amber-800 text-[11px] block font-medium">Pareceres Pendentes</span>
            <span className="text-lg font-black text-amber-900 mt-0.5 block">{pendingReviewsCount}</span>
          </div>

          <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3">
            <span className="text-purple-800 text-[11px] block font-medium">Pareceres Concluídos</span>
            <span className="text-lg font-black text-purple-900 mt-0.5 block">{completedReviewsCount}</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
            <span className="text-emerald-800 text-[11px] block font-medium">Declarações & Certificados</span>
            <span className="text-lg font-black text-emerald-900 mt-0.5 block">{certificates.length}</span>
          </div>
        </div>
      </div>

      {/* Navegador de Abas: Autor vs Avaliador vs Certificados */}
      <div role="tablist" aria-label="Modos do painel acadêmico" className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "author"}
          onClick={() => setActiveTab("author")}
          className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === "author"
              ? "border-blue-600 text-blue-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Minhas Submissões (Autor)</span>
          <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {authorPapers.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "reviewer"}
          onClick={() => setActiveTab("reviewer")}
          className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === "reviewer"
              ? "border-purple-600 text-purple-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Minhas Avaliações (Parecerista)</span>
          <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {reviewerAssignments.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "certificates"}
          onClick={() => setActiveTab("certificates")}
          className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === "certificates"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Declarações &amp; Certificados</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {certificates.length}
          </span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Autor */}
      {activeTab === "author" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-100/70 px-4 py-2.5 rounded-xl border border-slate-200">
            <span>
              Exibindo artigos submetidos pelo seu usuário. Acompanhe avaliações, decisões editoriais e rodadas de revisão.
            </span>
            <Link href={submitHref} className="text-blue-700 font-bold hover:underline shrink-0 ml-2">
              + Nova Submissão
            </Link>
          </div>
          {authorPapers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Você ainda não submeteu nenhum artigo</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Envie seu manuscrito estruturado para iniciar a avaliação por pares duplo-cega.
              </p>
              <Link
                href={submitHref}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Criar Primeira Submissão</span>
              </Link>
            </div>
          ) : (
            <AuthorSubmissionsClient papers={authorPapers} />
          )}
        </div>
      )}

      {/* Conteúdo da Aba 2: Avaliador */}
      {activeTab === "reviewer" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-purple-900 bg-purple-50/70 px-4 py-2.5 rounded-xl border border-purple-200">
            <span>
              Manuscritos atribuídos a você pela Comissão Editorial para emissão de parecer duplo-cego (<em>double-blind review</em>).
            </span>
            <span className="font-semibold text-purple-800 shrink-0 ml-2">
              {pendingReviewsCount} tarefa(s) pendente(s)
            </span>
          </div>
          {reviewerAssignments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Nenhuma avaliação atribuída no momento</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {hasReviewerRole
                  ? "Seu perfil de parecerista está ativo. Assim que a coordenação editorial designar um manuscrito na sua área, ele aparecerá aqui."
                  : "Ative seu perfil de parecerista ad-hoc e informe suas áreas de interesse para receber convites de avaliação."}
              </p>
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{hasReviewerRole ? "Atualizar Áreas de Parecer" : "Ativar Perfil de Parecerista"}</span>
              </button>
            </div>
          ) : (
            <ReviewerFormClient assignments={reviewerAssignments} />
          )}
        </div>
      )}

      {/* Conteúdo da Aba 3: Declarações & Certificados Acadêmicos */}
      {activeTab === "certificates" && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Declarações com assinatura eletrônica e código de autenticidade para comprovação em relatórios da CAPES e Plataforma Lattes (CNPq).
              </span>
            </div>
            <span className="font-bold text-emerald-800 shrink-0">
              {certificates.length} documento(s) emitido(s)
            </span>
          </div>

          {certificates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Nenhum certificado emitido até o momento</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                As declarações oficiais de apresentação de trabalho e de parecerista ad-hoc são geradas automaticamente quando o trabalho é apresentado ou quando a avaliação é concluída.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => {
                const isPres = cert.type === "presentation";
                return (
                  <div
                    key={cert.id}
                    className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isPres
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {isPres ? "Apresentação de Trabalho" : "Parecerista Ad-hoc"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDatePtBr(cert.issued_at)}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {cert.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {cert.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg font-mono">
                        <span className="truncate">{cert.certificate_code}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(cert.certificate_code)}
                          className="text-slate-400 hover:text-slate-700 ml-2 shrink-0 cursor-pointer"
                          title="Copiar código de autenticidade"
                        >
                          {copiedCode === cert.certificate_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/certificate/${cert.certificate_code}`}
                          target="_blank"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Visualizar & Imprimir</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal para Editar Interesses de Avaliação & Áreas de Pesquisa */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Áreas de Conhecimento & Interesses de Avaliação</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atualize suas especialidades para receber manuscritos afinados com sua linha de pesquisa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReviewerProfile} className="space-y-3.5 text-xs">
              <label className="flex items-start space-x-2.5 cursor-pointer bg-purple-50/70 p-3 rounded-xl border border-purple-200">
                <input
                  type="checkbox"
                  checked={isReviewerCandidate}
                  onChange={(e) => setIsReviewerCandidate(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600"
                />
                <div>
                  <span className="font-bold text-purple-950 block">
                    Disponível para atuar como Parecerista Ad-hoc
                  </span>
                  <span className="text-[11px] text-purple-700 block">
                    Seu perfil participará da distribuição automática e manual de avaliações.
                  </span>
                </div>
              </label>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Palavras-chave e Áreas de Especialidade *
                </label>
                <textarea
                  rows={2}
                  value={reviewInterests}
                  onChange={(e) => setReviewInterests(e.target.value)}
                  placeholder="Ex: Inteligência Artificial, Ciência Aberta, Big Data, Repositórios Digitais..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required={isReviewerCandidate}
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Termos separados por vírgula. Comparados automaticamente com as submissões.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Trilhas Temáticas de Interesse:
                </label>
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={preferredTracks.includes("1")}
                      onChange={() => toggleTrack("1")}
                      className="rounded text-purple-600"
                    />
                    <span>Trilha 1: Ciência Aberta, FAIR Principles e Repositórios</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={preferredTracks.includes("2")}
                      onChange={() => toggleTrack("2")}
                      className="rounded text-purple-600"
                    />
                    <span>Trilha 2: Inteligência Artificial e Tecnologias Emergentes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={preferredTracks.includes("3")}
                      onChange={() => toggleTrack("3")}
                      className="rounded text-purple-600"
                    />
                    <span>Trilha 3: Políticas Públicas, Avaliação por Pares e Metaciência</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currículo Lattes (URL)</label>
                  <input
                    type="text"
                    value={lattesUrl}
                    onChange={(e) => setLattesUrl(e.target.value)}
                    placeholder="http://lattes.cnpq.br/..."
                    className="w-full border border-slate-300 rounded-xl p-2 bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ORCID iD</label>
                  <input
                    type="text"
                    value={orcid}
                    onChange={(e) => setOrcid(e.target.value)}
                    placeholder="0000-0002-..."
                    className="w-full border border-slate-300 rounded-xl p-2 bg-slate-50/50 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {savingProfile ? "Salvando..." : "Salvar Especialidades"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
