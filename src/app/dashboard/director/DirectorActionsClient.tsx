"use client";

import { useState } from "react";
import { Paper, User, EmailLog, ReviewerMatch } from "@/lib/ocs-service";
import { 
  assignReviewerAction, 
  recordDecisionAction,
  createConferenceAction,
  updateUserRoleAction,
  markPaperPresentedAction,
  getSuggestedReviewersAction,
  autoAssignReviewersAction,
  testSmtpConnectionAction,
  saveSmtpSettingsAction
} from "@/app/actions";
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock, 
  FileText, 
  BookOpen, 
  Star, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Building2, 
  Calendar, 
  Tag, 
  Barcode, 
  MapPin, 
  ShieldCheck, 
  Users, 
  X, 
  Sparkles, 
  Loader2, 
  Globe, 
  Send, 
  ExternalLink, 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  Mail, 
  Inbox, 
  Eye, 
  CheckCircle, 
  HelpCircle, 
  Zap,
  KeyRound,
  Shield,
  Info
} from "lucide-react";

interface Props {
  submissions: Paper[];
  reviewers: User[];
  allUsers?: User[];
  emailLogs?: EmailLog[];
  smtpSettings?: {
    host: string;
    port: number;
    user: string;
    from: string;
    hasPass: boolean;
  };
}

export default function DirectorActionsClient({ 
  submissions, 
  reviewers, 
  allUsers = [], 
  emailLogs = [],
  smtpSettings
}: Props) {
  const [activeTab, setActiveTab] = useState<"submissions" | "users" | "interop" | "reports" | "emails">("submissions");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [expandedReviewsPaperId, setExpandedReviewsPaperId] = useState<number | null>(null);

  // Form states de atribuição de parecerista e decisão
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>(reviewers[0]?.id?.toString() || "");
  const [decision, setDecision] = useState<"accept" | "revisions" | "reject">("accept");
  const [decisionComments, setDecisionComments] = useState("");
  const [publishToProceedings, setPublishToProceedings] = useState(true);
  const [confirmPresentedInModal, setConfirmPresentedInModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [presentationLoadingId, setPresentationLoadingId] = useState<number | null>(null);

  // Estados de Distribuição Inteligente por Área de Conhecimento
  const [suggestedMatches, setSuggestedMatches] = useState<ReviewerMatch[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [autoAssignSuccess, setAutoAssignSuccess] = useState<string | null>(null);

  // Estados da Central de E-mails e Visualizador
  const [viewingEmail, setViewingEmail] = useState<EmailLog | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; status?: string; message?: string } | null>(null);
  const [smtpUser, setSmtpUser] = useState(smtpSettings?.user || "rev.estrabao@gmail.com");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState(smtpSettings?.from || '"Open Conference Werneckiana (Revista Estrabão)" <rev.estrabao@gmail.com>');
  const [hasPassState, setHasPassState] = useState(Boolean(smtpSettings?.hasPass));
  const [smtpSaveLoading, setSmtpSaveLoading] = useState(false);
  const [smtpSaveResult, setSmtpSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAppPasswordGuide, setShowAppPasswordGuide] = useState(false);

  // Form states de Nova Conferência
  const [createConfModalOpen, setCreateConfModalOpen] = useState(false);
  const [confTitle, setConfTitle] = useState("");
  const [confAcronym, setConfAcronym] = useState("");
  const [confSlug, setConfSlug] = useState("");
  const [confCity, setConfCity] = useState("");
  const [confLocation, setConfLocation] = useState("");
  const [confStartDate, setConfStartDate] = useState("2027-05-18");
  const [confEndDate, setConfEndDate] = useState("2027-05-21");
  const [confCfpDeadline, setConfCfpDeadline] = useState("2027-02-28");
  const [confReviewDeadline, setConfReviewDeadline] = useState("2027-03-31");
  const [confResultsDate, setConfResultsDate] = useState("2027-04-15");
  const [confProceedingsDoi, setConfProceedingsDoi] = useState("");
  const [confIsbn, setConfIsbn] = useState("978-65-89123-99-9");
  const [confDesc, setConfDesc] = useState("");
  const [confLoading, setConfLoading] = useState(false);
  const [confSuccessMsg, setConfSuccessMsg] = useState<string | null>(null);

  // User roles states
  const [userRoles, setUserRoles] = useState<Record<number, string>>(
    allUsers.reduce((acc, u) => ({ ...acc, [u.id]: u.role }), {})
  );
  const [roleUpdatingId, setRoleUpdatingId] = useState<number | null>(null);
  const [roleNotification, setRoleNotification] = useState<string | null>(null);

  // Estados do Depósito Direto Crossref via API (Exclusivo Administrador / Editor)
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [crossrefUser, setCrossrefUser] = useState("");
  const [crossrefPass, setCrossrefPass] = useState("");
  const [depositEnv, setDepositEnv] = useState<"sandbox" | "production">("sandbox");
  const [depositing, setDepositing] = useState(false);
  const [depositResult, setDepositResult] = useState<any | null>(null);

  const handleOpenAssign = async (paper: Paper) => {
    setSelectedPaper(paper);
    setAssignModalOpen(true);
    setMatchingLoading(true);
    setAutoAssignSuccess(null);
    try {
      const res = await getSuggestedReviewersAction(paper.id);
      if (res.success && res.matches) {
        setSuggestedMatches(res.matches);
        const topAvailable = res.matches.find(m => !m.isConflict);
        if (topAvailable) {
          setSelectedReviewerId(topAvailable.reviewer.id.toString());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!selectedPaper) return;
    setActionLoading(true);
    const formData = new FormData();
    formData.append("paper_id", selectedPaper.id.toString());
    formData.append("count", "2");

    try {
      const res = await autoAssignReviewersAction(formData);
      if (res.success && res.assigned) {
        setAutoAssignSuccess(`Atribuídos com sucesso: ${res.assigned.map(a => a.name).join(" e ")}`);
        setTimeout(() => {
          setAssignModalOpen(false);
          window.location.reload();
        }, 1200);
      } else {
        alert(res.error || "Não foi possível realizar a atribuição automática.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro na atribuição automática.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress.trim()) return;
    setTestEmailLoading(true);
    setTestEmailResult(null);

    const formData = new FormData();
    formData.append("email", testEmailAddress.trim());

    try {
      const res = await testSmtpConnectionAction(formData);
      if (res.success) {
        setTestEmailResult({
          success: true,
          status: res.status,
          message: res.status === "sent_smtp"
            ? "E-mail de teste enviado com sucesso via servidor SMTP real!"
            : "E-mail registrado com sucesso na Caixa de Saída (Auditoria). Em produção, configure as variáveis SMTP no .env.",
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setTestEmailResult({
          success: false,
          message: res.error || "Erro no teste de e-mail.",
        });
      }
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: err.message || "Falha na requisição de teste.",
      });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaveLoading(true);
    setSmtpSaveResult(null);

    const formData = new FormData();
    formData.append("user", smtpUser.trim());
    formData.append("pass", smtpPass.trim());
    formData.append("from", smtpFrom.trim());
    formData.append("host", "smtp.gmail.com");
    formData.append("port", "587");

    try {
      const res = await saveSmtpSettingsAction(formData);
      if (res.success) {
        if (smtpPass.trim()) {
          setHasPassState(true);
        }
        setSmtpSaveResult({
          success: true,
          message: "Configuração do e-mail oficial (rev.estrabao@gmail.com) atualizada com sucesso!"
        });
        setSmtpPass("");
      } else {
        setSmtpSaveResult({
          success: false,
          message: res.error || "Erro ao salvar credenciais do Gmail."
        });
      }
    } catch (err: any) {
      setSmtpSaveResult({
        success: false,
        message: err.message || "Falha na requisição."
      });
    } finally {
      setSmtpSaveLoading(false);
    }
  };

  const handleOpenDecision = (paper: Paper) => {
    setSelectedPaper(paper);
    setConfirmPresentedInModal(paper.is_presented === 1);
    setPublishToProceedings(paper.status === "published" || paper.is_presented === 1);
    setDecisionComments(
      paper.status === "accepted" || paper.status === "published"
        ? "Parabéns, seu trabalho foi aceito para apresentação oral e publicação nos anais."
        : "Prezado(s) autor(es), após análise dos pareceres emitidos pela comissão científica, registramos a decisão editorial a seguir."
    );
    setDecisionModalOpen(true);
  };

  const handleTogglePresentation = async (paper: Paper) => {
    setPresentationLoadingId(paper.id);
    const newStatus = paper.is_presented !== 1;
    const formData = new FormData();
    formData.append("paper_id", paper.id.toString());
    formData.append("is_presented", newStatus ? "true" : "false");
    formData.append("presented_by", "Editor Responsável (Diretor)");

    try {
      await markPaperPresentedAction(formData);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar status de apresentação.");
    } finally {
      setPresentationLoadingId(null);
    }
  };

  const handleAssignReviewer = async () => {
    if (!selectedPaper || !selectedReviewerId) return;
    setActionLoading(true);
    const formData = new FormData();
    formData.append("paper_id", selectedPaper.id.toString());
    formData.append("reviewer_id", selectedReviewerId);

    try {
      await assignReviewerAction(formData);
      setAssignModalOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Erro ao designar parecerista.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordDecision = async () => {
    if (!selectedPaper) return;
    setActionLoading(true);
    const formData = new FormData();
    formData.append("paper_id", selectedPaper.id.toString());
    formData.append("director_id", "3"); // Carlos Eduardo
    formData.append("decision", decision);
    formData.append("comments", decisionComments);
    formData.append("publish_proceedings", publishToProceedings ? "true" : "false");
    formData.append("confirm_presented", confirmPresentedInModal ? "true" : "false");

    try {
      await recordDecisionAction(formData);
      setDecisionModalOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Erro ao gravar decisão.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateConference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confTitle.trim() || !confSlug.trim()) {
      alert("Preencha ao menos o Título e o identificador (slug) da conferência.");
      return;
    }
    setConfLoading(true);

    const formData = new FormData();
    formData.append("title", confTitle);
    formData.append("acronym", confAcronym || confSlug.toUpperCase());
    formData.append("slug", confSlug);
    formData.append("city", confCity || "São Paulo, SP, Brasil");
    formData.append("location", confLocation || confCity);
    formData.append("start_date", confStartDate);
    formData.append("end_date", confEndDate);
    formData.append("cfp_deadline", confCfpDeadline);
    formData.append("review_deadline", confReviewDeadline);
    formData.append("results_date", confResultsDate);
    formData.append("proceedings_doi", confProceedingsDoi || `10.5281/zenodo.${confSlug}`);
    formData.append("isbn", confIsbn || "978-65-89123-99-9");
    formData.append("description", confDesc);

    try {
      const res = await createConferenceAction(formData);
      if (res.success) {
        setConfSuccessMsg(`Conferência "${confTitle}" cadastrada com sucesso!`);
        setTimeout(() => {
          setCreateConfModalOpen(false);
          window.location.reload();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar conferência.");
    } finally {
      setConfLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setRoleUpdatingId(userId);
    setUserRoles((prev) => ({ ...prev, [userId]: newRole }));

    const formData = new FormData();
    formData.append("user_id", userId.toString());
    formData.append("role", newRole);

    try {
      await updateUserRoleAction(formData);
      setRoleNotification(`Função do usuário #${userId} atualizada para "${newRole}" com sucesso.`);
      setTimeout(() => setRoleNotification(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar papel do usuário.");
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleExecuteDeposit = async () => {
    setDepositing(true);
    setDepositResult(null);

    try {
      const res = await fetch("/api/export/crossref/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedConfId: 1,
          username: crossrefUser,
          password: crossrefPass,
          environment: depositEnv,
        }),
      });

      const data = await res.json();
      setDepositResult(data);
    } catch (err: any) {
      setDepositResult({
        success: false,
        message: `Falha na requisição: ${err.message}`,
      });
    } finally {
      setDepositing(false);
    }
  };

  const approvedPapersCount = submissions.filter(
    (p) => p.status === "accepted" || p.status === "published"
  ).length;

  return (
    <div className="space-y-6">
      {/* Barra de Navegação de Abas do Administrador & Botão Nova Conferência */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("submissions")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "submissions"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Fila Editorial ({submissions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "users"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Atribuição de Funções ({allUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("interop")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "interop"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Interoperabilidade & Depósito Crossref (Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "reports"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Relatórios & Exportações</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("emails")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "emails"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Central de E-mails ({emailLogs.length})</span>
          </button>
        </div>

        {/* Botão de Destaque: Cadastrar Nova Conferência */}
        <button
          type="button"
          onClick={() => {
            setConfSuccessMsg(null);
            setCreateConfModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cadastrar Nova Conferência</span>
        </button>
      </div>

      {roleNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{roleNotification}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 1: FILA EDITORIAL DE SUBMISSÕES                      */}
      {/* ======================================================== */}
      {activeTab === "submissions" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center text-xs font-semibold text-slate-700">
            <span>Fila Editorial Completa ({submissions.length} trabalhos)</span>
            <span className="text-slate-500 font-normal">Designação de pareceristas duplo-cegos e registro de decisões</span>
          </div>

          <div className="divide-y divide-slate-100">
            {submissions.map((paper) => {
              const completedReviews = paper.reviews?.filter((r) => r.status === "completed") || [];
              const pendingReviews = paper.reviews?.filter((r) => r.status === "pending") || [];
              const isExpanded = expandedReviewsPaperId === paper.id;

              return (
                <div key={paper.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-4xl">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-slate-700">#{paper.id}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-blue-700">{paper.track_title}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 uppercase">{paper.presentation_type}</span>
                        {paper.sched_title && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium text-[11px]">
                              {paper.sched_title}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {paper.title}
                      </h3>

                      <p className="text-xs text-slate-600">
                        <strong>Autores:</strong> {paper.authors?.map((a) => `${a.full_name} (${a.affiliation})`).join("; ")}
                      </p>
                    </div>

                    {/* Status e Ações */}
                    <div className="flex flex-wrap lg:flex-col items-end gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          paper.status === "published"
                            ? "bg-purple-100 text-purple-800"
                            : paper.status === "accepted"
                            ? "bg-emerald-100 text-emerald-800"
                            : paper.current_round && paper.current_round > 1 && paper.status === "under_review"
                            ? "bg-purple-100 text-purple-800 border border-purple-300 font-bold"
                            : paper.status === "under_review"
                            ? "bg-blue-100 text-blue-800"
                            : paper.status === "revisions_required"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {paper.current_round && paper.current_round > 1 && paper.status === "under_review" ? (
                          <span>🔄 Rodada 2: Em Reavaliação</span>
                        ) : paper.status === "published" ? (
                          <span>Publicado nos Anais</span>
                        ) : paper.status === "accepted" ? (
                          <span>Aceito para Publicação</span>
                        ) : paper.status === "under_review" ? (
                          <span>Em Avaliação Duplo-Cega</span>
                        ) : paper.status === "revisions_required" ? (
                          <span>Revisões Solicitadas</span>
                        ) : (
                          <span>Aguardando Parecerista</span>
                        )}
                      </span>

                      {/* Badge e Ação de Apresentação no Evento (Trava de Publicação) */}
                      <div className="flex items-center space-x-1.5">
                        {paper.is_presented === 1 ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Apresentado no Evento</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Apresentação Pendente</span>
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={presentationLoadingId === paper.id}
                          onClick={() => handleTogglePresentation(paper)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer border ${
                            paper.is_presented === 1
                              ? "bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-600 border-slate-200"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs"
                          }`}
                          title={paper.is_presented === 1 ? "Clique para reverter ou registrar No-Show" : "Clique para confirmar que o autor apresentou o trabalho"}
                        >
                          {presentationLoadingId === paper.id ? (
                            "Atualizando..."
                          ) : paper.is_presented === 1 ? (
                            "Registrar No-Show"
                          ) : (
                            "Atestar Presença"
                          )}
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAssign(paper)}
                          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-2xs"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                          <span>Designar Revisor</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDecision(paper)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs"
                        >
                          Gravar Decisão
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pareceres Recebidos */}
                  {paper.reviews && paper.reviews.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setExpandedReviewsPaperId(isExpanded ? null : paper.id)}
                        className="text-xs text-blue-700 font-semibold flex items-center space-x-1 hover:underline cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>
                          Ver Pareceres ({completedReviews.length} concluído(s), {pendingReviews.length} pendente(s))
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          {paper.reviews.map((r) => (
                            <div key={r.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">
                                  Revisor: {r.reviewer_name} ({r.reviewer_affiliation})
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                  {r.status === "completed" ? "Parecer Concluído" : "Aguardando Parecer"}
                                </span>
                              </div>
                              {r.comments_author && (
                                <p className="text-slate-700 whitespace-pre-line text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                                  {r.comments_author}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: ATRIBUIÇÃO DE FUNÇÕES AOS USUÁRIOS                */}
      {/* ======================================================== */}
      {activeTab === "users" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Gerenciamento e Atribuição de Funções Editoriais
              </h3>
              <p className="text-xs text-slate-500">
                O Administrador pode designar qualquer usuário como Autor, Avaliador (Parecerista) ou Editor.
              </p>
            </div>
            <span className="text-xs font-semibold bg-purple-50 text-purple-800 px-3 py-1 rounded-lg border border-purple-200 self-start sm:self-auto">
              Total: {allUsers.length} usuários registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nome Completo</th>
                  <th className="py-3 px-4">E-mail / Usuário</th>
                  <th className="py-3 px-4">Filiação Institucional</th>
                  <th className="py-3 px-4">Função Atual</th>
                  <th className="py-3 px-4 text-right">Alterar Função</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map((user) => {
                  const currentRole = userRoles[user.id] || user.role;
                  const isUpdating = roleUpdatingId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {user.full_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {user.affiliation || "Instituição de Ensino Superior"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          currentRole === "director" || currentRole === "admin"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : currentRole === "reviewer"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {currentRole === "admin"
                            ? "Administrador"
                            : currentRole === "director"
                            ? "Editor Chefe"
                            : currentRole === "reviewer"
                            ? "Avaliador (Parecerista)"
                            : "Autor"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={currentRole}
                          disabled={isUpdating}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-hidden cursor-pointer"
                        >
                          <option value="author">Autor</option>
                          <option value="reviewer">Avaliador (Parecerista)</option>
                          <option value="director">Editor de Seção</option>
                          <option value="admin">Administrador Geral</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 3: INTEROPERABILIDADE GLOBAL & DEPÓSITO CROSSREF      */}
      {/* (Exclusivo do Administrador - "vai tudo em 1 único lote") */}
      {/* ======================================================== */}
      {activeTab === "interop" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-6 p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Acesso Restrito ao Administrador / Editor Geral</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Governança de Metadados & Depósito Global Crossref (Lote dos Anais)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              O DOI dos Anais é exclusivo do Editor de Conferência. No XML oficial enviado à Crossref, o Editor é formalmente atribuído com seu ORCID, enquanto os artigos indexados levam os metadados dos seus autores.
            </p>
          </div>

          {/* Cards de Metadados Editoriais do Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* DOI dos Anais (Visível Apenas para o Admin) */}
            <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 space-y-1.5">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                DOI dos Anais (Editor Only)
              </span>
              <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-purple-950">
                <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>10.5281/zenodo.citeca2026</span>
              </div>
              <p className="text-[10px] text-purple-700">Identificador persistente do volume completo</p>
            </div>

            {/* Editor Responsável Atribuído com ORCID */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Editor Atribuído (ORCID)
              </span>
              <div className="text-xs font-bold text-slate-900">
                Prof. Dr. Carlos Eduardo Dias
              </div>
              <div className="text-[11px] text-emerald-700 font-mono flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[8px]">iD</span>
                <span>0000-0003-4567-8901</span>
              </div>
            </div>

            {/* ISBN Oficial dos Anais */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                ISBN do Evento / Livro
              </span>
              <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-emerald-950">
                <Barcode className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>978-65-89123-45-6</span>
              </div>
              <p className="text-[10px] text-emerald-700">Normas ABNT NBR 6023 e APA 7th</p>
            </div>

            {/* Artigos no Pacote Global */}
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 space-y-1.5">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                Volume a Depositar ("Vai Tudo")
              </span>
              <div className="text-lg font-black text-blue-950">
                {approvedPapersCount} artigos aprovados
              </div>
              <p className="text-[10px] text-blue-700">Pacote doi_batch 4.4.2 consolidado</p>
            </div>
          </div>

          {/* Painel de Ações de Interoperabilidade com 1 Clique */}
          <div className="bg-gradient-to-r from-slate-50 to-purple-50/40 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-lg">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>Transmissão Automatizada para a Crossref & OAI-PMH</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Envie o pacote de metadados em lote de todos os artigos e anais diretamente para o servidor da Crossref com apenas 1 clique ou baixe o arquivo XML para auditoria manual.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setDepositModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-xs transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Subir na API Crossref (1 Clique)</span>
              </button>

              <a
                href="/api/export/crossref?schedConfId=1"
                target="_blank"
                download="crossref_citeca2026_proceedings.xml"
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                <span>Baixar XML Crossref</span>
              </a>

              <a
                href="/api/oai?verb=ListRecords&metadataPrefix=oai_dc"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>OAI-PMH (Dublin Core)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 4: RELATÓRIOS & EXPORTAÇÕES (CSV PARA EXCEL)         */}
      {/* ======================================================== */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Cabeçalho da Aba de Relatórios */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  <span>Gestão & Conformidade Científica</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Centro de Relatórios & Exportações da Conferência
                </h3>
                <p className="text-xs text-slate-500">
                  Exporte relatórios em formato CSV compatível com Microsoft Excel e LibreOffice para prestação de contas, CAPES/Qualis, emissão de certificados e auditoria de publicação.
                </p>
              </div>

              <div className="shrink-0 bg-purple-50 border border-purple-200 text-purple-900 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                <span>Formato UTF-8 com BOM para Excel</span>
              </div>
            </div>

            {/* Painel Métrico de Conformidade */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[11px] text-slate-500 font-medium block">Total de Submissões</span>
                <strong className="text-lg font-black text-slate-900">{submissions.length}</strong>
              </div>
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
                <span className="text-[11px] text-blue-700 font-medium block">Aprovados / Aceitos</span>
                <strong className="text-lg font-black text-blue-900">
                  {submissions.filter(p => p.status === "accepted" || p.status === "published").length}
                </strong>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                <span className="text-[11px] text-emerald-800 font-medium block">Apresentados no Evento</span>
                <strong className="text-lg font-black text-emerald-950">
                  {submissions.filter(p => p.is_presented === 1).length}
                </strong>
              </div>
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                <span className="text-[11px] text-amber-800 font-medium block">Apresentação Pendente</span>
                <strong className="text-lg font-black text-amber-950">
                  {submissions.filter(p => p.is_presented !== 1).length}
                </strong>
              </div>
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-purple-800 font-medium block">Publicados nos Anais</span>
                <strong className="text-lg font-black text-purple-950">
                  {submissions.filter(p => p.status === "published").length}
                </strong>
              </div>
            </div>
          </div>

          {/* Cards dos 3 Relatórios Disponíveis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Relatório 1: Submissões & Pareceres */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Processo Editorial
                  </span>
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  Relatório Geral de Submissões e Pareceres
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Planilha completa com protocolo, título, autores, ORCIDs, filiações, trilhas temáticas, pareceres recebidos, notas médias, agências de financiamento e situação de apresentação.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <a
                  href="/api/export/report?type=submissions&schedConfId=1"
                  download
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Planilha de Submissões (CSV)</span>
                </a>
              </div>
            </div>

            {/* Relatório 2: Apresentações & Presenças */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Controle de No-Show
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  Relatório de Apresentações & Presenças
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lista para conferência de apresentações orais e pôsteres com sala, modalidade (presencial ou online), horário agendado, atesto de comparecimento do autor e certificação.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <a
                  href="/api/export/report?type=presentations&schedConfId=1"
                  download
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Controle de Apresentações (CSV)</span>
                </a>
              </div>
            </div>

            {/* Relatório 3: Metadados Lattes & Crossref */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Indexadores & Lattes
                  </span>
                  <Tag className="w-4 h-4 text-purple-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  Relatório de Metadados Lattes, DOIs e ISBN
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tabela consolidada com links permanentes individuais (Target URLs), DOIs oficiais, ISBN dos anais, paginação simulada (p. 1-6) e agências de fomento para preenchimento de Lattes e CAPES.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <a
                  href="/api/export/report?type=metadata&schedConfId=1"
                  download
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Metadados Lattes / DOIs (CSV)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Banner de Esclarecimento sobre a Trava de Apresentação */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Regra Editorial Ativa: Política de Apresentação Obrigatória (No-Show Gatekeeper)</span>
            </div>
            <p className="leading-relaxed text-amber-800">
              O sistema <strong>Open Conference Werneckiana</strong> opera com a trava de segurança científica: artigos aceitos pelo comitê só são indexados nos Anais e só são submetidos para emissão de DOI na Crossref caso o autor compareça e apresente o trabalho na sessão presencial ou online. Trabalhos marcados como <em>Apresentação Pendente</em> ou <em>No-Show</em> permanecem retidos fora do volume de anais.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 5: CENTRAL DE E-MAILS & NOTIFICAÇÕES (WORKFLOW & SMTP) */}
      {/* ======================================================== */}
      {activeTab === "emails" && (
        <div className="space-y-6">
          {/* Cabeçalho da Central de E-mails */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  <span>Comunicação & Auditoria Editorial</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Central de Notificações, E-mails & Declarações Acadêmicas
                </h3>
                <p className="text-xs text-slate-500">
                  Histórico de avisos automáticos de ajustes aos autores, convites de avaliação por afinidade temática e certificados oficiais emitidos.
                </p>
              </div>

              <div className="shrink-0 bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{emailLogs.length} e-mails registrados</span>
              </div>
            </div>

            {/* Métricas dos E-mails */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[11px] text-slate-500 block">Total de Disparos</span>
                <strong className="text-lg font-black text-slate-900">{emailLogs.length}</strong>
              </div>
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                <span className="text-[11px] text-amber-800 font-medium block">Revisões Solicitadas</span>
                <strong className="text-lg font-black text-amber-950">
                  {emailLogs.filter(e => e.template_type === "revisions_required").length}
                </strong>
              </div>
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3">
                <span className="text-[11px] text-purple-800 font-medium block">Avaliadores Convocados</span>
                <strong className="text-lg font-black text-purple-950">
                  {emailLogs.filter(e => e.template_type === "review_assigned").length}
                </strong>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                <span className="text-[11px] text-emerald-800 font-medium block">Declarações Emitidas</span>
                <strong className="text-lg font-black text-emerald-950">
                  {emailLogs.filter(e => e.template_type === "presentation_certificate" || e.template_type === "reviewer_certificate").length}
                </strong>
              </div>
            </div>
          </div>

          {/* Painel de Configuração do Gmail & Teste de Disparo */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bloco 1: Conexão Gmail da Revista Estrabão (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                    <KeyRound className="w-4 h-4 text-purple-600" />
                    <span>Conexão Gmail • Revista Estrabão</span>
                  </div>
                  {hasPassState ? (
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      <span>SMTP Gmail Ativo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Modo Outbox (Auditoria)</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Envie notificações com o remetente oficial da <strong>Revista Estrabão</strong> (<code className="text-purple-700 font-semibold font-mono">rev.estrabao@gmail.com</code>).
                </p>

                <form onSubmit={handleSaveSmtp} className="mt-4 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        E-mail Institucional
                      </label>
                      <input
                        type="email"
                        required
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="rev.estrabao@gmail.com"
                        className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono text-slate-800 bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                        <span>Senha de App (16 letras)</span>
                        {hasPassState && <span className="text-[10px] text-emerald-600 font-bold lowercase">●●●● configurada</span>}
                      </label>
                      <input
                        type="password"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder={hasPassState ? "Alterar senha de app (16 letras)" : "ex: abcd efgh ijkl mnop"}
                        className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nome & Assinatura de Remetente (From Header)
                    </label>
                    <input
                      type="text"
                      required
                      value={smtpFrom}
                      onChange={(e) => setSmtpFrom(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-700"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAppPasswordGuide(!showAppPasswordGuide)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline flex items-center space-x-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showAppPasswordGuide ? "Ocultar instruções do Google" : "Como gerar a Senha de App no Google (1 min)?"}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={smtpSaveLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 text-xs"
                    >
                      {smtpSaveLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Salvar Credenciais do Gmail</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {smtpSaveResult && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs ${
                      smtpSaveResult.success
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-red-50 border-red-200 text-red-900"
                    }`}
                  >
                    <p className="font-semibold text-[11px]">{smtpSaveResult.message}</p>
                  </div>
                )}

                {/* Guia Expansível de Senha de Aplicativo do Gmail */}
                {showAppPasswordGuide && (
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2.5">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span>Passo a Passo: Gerando a Senha de Aplicativo no Google</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      O Google protege contas contra envio automatizado exigindo uma <strong>Senha de Aplicativo (16 dígitos)</strong> exclusiva para sistemas web, sem expor sua senha pessoal:
                    </p>
                    <ol className="list-decimal list-inside text-[11px] text-slate-700 space-y-1.5 pl-1">
                      <li>
                        Acesse as senhas de app da conta <strong>rev.estrabao@gmail.com</strong>:{" "}
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-blue-600 underline inline-flex items-center space-x-1"
                        >
                          <span>myaccount.google.com/apppasswords</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>
                        <em>(Caso solicite, certifique-se de que a &quot;Verificação em duas etapas&quot; esteja ativa na conta Google).</em>
                      </li>
                      <li>
                        No campo &quot;Nome do app&quot;, digite: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300">Open Conference Werneckiana</strong> e clique em <strong>Criar</strong>.
                      </li>
                      <li>
                        O Google exibirá um código amarelo de 16 letras (ex: <code className="font-mono text-purple-700 font-bold">abcd efgh ijkl mnop</code>).
                      </li>
                      <li>
                        Copie esse código de 16 letras, cole no campo <strong>Senha de App</strong> acima e clique em <strong>Salvar Credenciais do Gmail</strong>!
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Disparador de Teste de E-mail (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Testar Disparo de Notificação</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Envie uma mensagem de teste para qualquer endereço para validar a entrega na caixa de entrada.
                </p>

                <form onSubmit={handleTestSmtp} className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      E-mail de Destino para Teste
                    </label>
                    <input
                      type="email"
                      required
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="ex: seu.email@universidade.br"
                      className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={testEmailLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {testEmailLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Disparando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Disparar E-mail de Teste</span>
                      </>
                    )}
                  </button>
                </form>

                {testEmailResult && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs ${
                      testEmailResult.success
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-red-50 border-red-200 text-red-900"
                    }`}
                  >
                    <div className="font-bold flex items-center space-x-1.5">
                      {testEmailResult.success ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      )}
                      <span>{testEmailResult.success ? "Sucesso no Envio!" : "Aviso:"}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed">{testEmailResult.message}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800 block">✨ Auditoria à prova de falhas:</span>
                Mesmo sem conexão à internet ou antes de inserir a senha, todas as mensagens ficam salvas no histórico abaixo para conferência e reimpressão a qualquer momento.
              </div>
            </div>
          </div>

          {/* Tabela de E-mails Enviados / Registrados */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Histórico de Mensagens & Notificações</h4>
                <p className="text-xs text-slate-500">Registro cronológico de todas as comunicações disparadas pelo fluxo editorial.</p>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                {emailLogs.length} registros
              </span>
            </div>

            {emailLogs.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                <h5 className="text-sm font-bold text-slate-700">Nenhum e-mail registrado ainda</h5>
                <p className="text-xs text-slate-500">
                  Os e-mails serão gerados quando você solicitar revisões, designar pareceristas ou atestar apresentações.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Destinatário</th>
                      <th className="py-3 px-4">Assunto</th>
                      <th className="py-3 px-4">Tipo de Modelo</th>
                      <th className="py-3 px-4">Canal / Status</th>
                      <th className="py-3 px-4">Data e Hora</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {emailLogs.map((log) => {
                      let typeLabel = "Notificação";
                      let typeColor = "bg-slate-100 text-slate-700";

                      if (log.template_type === "revisions_required") {
                        typeLabel = "Revisões Requeridas";
                        typeColor = "bg-amber-100 text-amber-800 border-amber-200";
                      } else if (log.template_type === "review_assigned") {
                        typeLabel = "Convite Avaliador";
                        typeColor = "bg-purple-100 text-purple-800 border-purple-200";
                      } else if (log.template_type === "presentation_certificate") {
                        typeLabel = "Declaração Apresentação";
                        typeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                      } else if (log.template_type === "reviewer_certificate") {
                        typeLabel = "Declaração Parecerista";
                        typeColor = "bg-indigo-100 text-indigo-800 border-indigo-200";
                      } else if (log.template_type === "smtp_test") {
                        typeLabel = "Teste de Conexão";
                        typeColor = "bg-blue-100 text-blue-800 border-blue-200";
                      }

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <strong className="text-slate-900 block">{log.recipient_name}</strong>
                            <span className="text-[11px] text-slate-500 font-mono">{log.recipient_email}</span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <span className="font-medium text-slate-800 line-clamp-1" title={log.subject}>
                              {log.subject}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeColor}`}>
                              {typeLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {log.status === "sent_smtp" ? (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center space-x-1 w-fit">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Enviado via SMTP</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md flex items-center space-x-1 w-fit">
                                <Inbox className="w-3 h-3 text-slate-500" />
                                <span>Caixa de Saída (Auditoria)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString("pt-BR")}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingEmail(log)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition flex items-center space-x-1 ml-auto cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Visualizar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SUBIR DEPÓSITO DIRETO NA API CROSSREF (1 CLIQUE)   */}
      {/* ======================================================== */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                  <Send className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Subir Depósito Global na API Crossref
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transmissão automatizada de metadados dos Anais e de todos os artigos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDepositModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações do Lote */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 text-xs text-purple-950 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-purple-900">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Depósito Consolidado dos Anais:</span>
              </div>
              <p className="leading-relaxed">
                Este lote único inclui o <strong>DOI dos Anais</strong> com o <strong>Editor de Conferência (com ORCID)</strong> e o <strong>DOI de todos os {approvedPapersCount} artigos aprovados</strong> com os respectivos autores e papéis CRediT.
              </p>
            </div>

            {/* Seleção de Ambiente */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Ambiente de Destino
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDepositEnv("sandbox")}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition cursor-pointer ${
                    depositEnv === "sandbox"
                      ? "border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500/20"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-bold flex items-center space-x-1.5">
                    <span>🧪 Sandbox de Demonstração</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Valida a estrutura do XML e gera o protocolo na hora
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositEnv("production")}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition cursor-pointer ${
                    depositEnv === "production"
                      ? "border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500/20"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-bold flex items-center space-x-1.5">
                    <span>🌐 Produção Oficial Crossref</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Transmite para doi.crossref.org com usuário institucional
                  </span>
                </button>
              </div>
            </div>

            {/* Credenciais para Produção */}
            {depositEnv === "production" && (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block">
                  Credenciais da Conta Crossref:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Usuário Crossref (login_id)
                    </label>
                    <input
                      type="text"
                      value={crossrefUser}
                      onChange={(e) => setCrossrefUser(e.target.value)}
                      placeholder="ex: universidade_org"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Senha Crossref (login_passwd)
                    </label>
                    <input
                      type="password"
                      value={crossrefPass}
                      onChange={(e) => setCrossrefPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resultado do Depósito */}
            {depositResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                depositResult.success 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
                  : "bg-red-50 border-red-200 text-red-950"
              }`}>
                <div className="flex items-center space-x-2 font-bold">
                  {depositResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>{depositResult.message}</span>
                </div>

                {depositResult.submissionId && (
                  <div className="pt-1 text-[11px] font-mono space-y-0.5 border-t border-emerald-200/60">
                    <div>Protocolo de Submissão: <strong>{depositResult.submissionId}</strong></div>
                    <div>Schema Validado: <strong>Crossref 4.4.2 (doi_batch)</strong></div>
                    <div>Artigos Incluídos: <strong>{depositResult.recordsDeposited} trabalhos</strong></div>
                    <div>Status: <span className="bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded font-bold">ENVIADO COM SUCESSO</span></div>
                  </div>
                )}
              </div>
            )}

            {/* Botões do Rodapé */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDepositModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={handleExecuteDeposit}
                disabled={depositing}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {depositing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitindo para Crossref...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirmar Envio com 1 Clique</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Nova Conferência */}
      {createConfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Cadastrar Nova Conferência Científica
                  </h3>
                  <p className="text-xs text-slate-500">
                    Insira os dados do evento, prazos de submissão, identificadores e metadados oficiais.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateConfModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {confSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-xl text-xs flex items-center space-x-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{confSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateConference} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Título da Conferência / Evento *
                  </label>
                  <input
                    type="text"
                    required
                    value={confTitle}
                    onChange={(e) => setConfTitle(e.target.value)}
                    placeholder="ex: II Congresso Internacional de Inovação e Ciência Aberta"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Sigla / Acrônimo
                  </label>
                  <input
                    type="text"
                    value={confAcronym}
                    onChange={(e) => setConfAcronym(e.target.value)}
                    placeholder="ex: CIICA 2027"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Identificador de URL (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    value={confSlug}
                    onChange={(e) => setConfSlug(e.target.value)}
                    placeholder="ex: ciica-2027"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Cidade Sede e Estado/País *
                  </label>
                  <input
                    type="text"
                    required
                    value={confCity}
                    onChange={(e) => setConfCity(e.target.value)}
                    placeholder="ex: Campinas, SP, Brasil"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    DOI dos Anais (Proceedings DOI)
                  </label>
                  <input
                    type="text"
                    value={confProceedingsDoi}
                    onChange={(e) => setConfProceedingsDoi(e.target.value)}
                    placeholder="ex: 10.5281/zenodo.ciica2027"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ISBN do Evento / Anais
                  </label>
                  <input
                    type="text"
                    value={confIsbn}
                    onChange={(e) => setConfIsbn(e.target.value)}
                    placeholder="ex: 978-65-89123-88-0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Calendário Editorial & Prazos
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Início do Evento</label>
                    <input
                      type="date"
                      value={confStartDate}
                      onChange={(e) => setConfStartDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Fim do Evento</label>
                    <input
                      type="date"
                      value={confEndDate}
                      onChange={(e) => setConfEndDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Prazo Submissão</label>
                    <input
                      type="date"
                      value={confCfpDeadline}
                      onChange={(e) => setConfCfpDeadline(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Prazo Avaliação</label>
                    <input
                      type="date"
                      value={confReviewDeadline}
                      onChange={(e) => setConfReviewDeadline(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Descrição e Escopo do Congresso
                </label>
                <textarea
                  rows={3}
                  value={confDesc}
                  onChange={(e) => setConfDesc(e.target.value)}
                  placeholder="Apresentação institucional, trilhas temáticas e objetivos da conferência..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateConfModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={confLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {confLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar e Ativar Conferência</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Designação de Parecerista com Matching Inteligente por Área de Conhecimento */}
      {assignModalOpen && selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Avaliação Duplo-Cega
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Designação de Avaliador por Área de Conhecimento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dados do Artigo */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="font-bold text-slate-900">
                #{selectedPaper.id} - {selectedPaper.title}
              </div>
              <div className="text-slate-600 flex flex-wrap items-center gap-x-3 text-[11px]">
                <span><strong>Trilha:</strong> {selectedPaper.track_title}</span>
                {selectedPaper.keywords && <span>• <strong>Keywords:</strong> {selectedPaper.keywords}</span>}
              </div>
            </div>

            {/* Banner de Distribuição Automática */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-purple-950 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Distribuição Automática por Especialidade</span>
                </span>
                <p className="text-[11px] text-purple-800">
                  Nosso algoritmo analisa trilhas e palavras-chave e atribui os melhores pareceristas sem conflito de interesse.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAutoAssign}
                disabled={actionLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center space-x-1.5 shrink-0 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Atribuir 2 Melhores</span>
              </button>
            </div>

            {autoAssignSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{autoAssignSuccess}</span>
              </div>
            )}

            {/* Lista de Avaliadores com Matching Score */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Ou Selecione um Avaliador Compatível:
              </label>

              {matchingLoading ? (
                <div className="p-6 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span>Calculando índices de afinidade por área de conhecimento...</span>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {(suggestedMatches.length > 0 ? suggestedMatches : reviewers.map(r => ({
                    reviewer: r,
                    score: 50,
                    reasons: ["Cadastrado no comitê"],
                    isConflict: false,
                    assignedCount: 0
                  }))).map((item) => {
                    const r = item.reviewer;
                    const isSelected = selectedReviewerId === r.id.toString();
                    const disabled = item.isConflict;

                    return (
                      <label
                        key={r.id}
                        className={`block p-3 rounded-xl border text-xs transition cursor-pointer ${
                          disabled
                            ? "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2.5">
                            <input
                              type="radio"
                              name="reviewer_choice"
                              disabled={disabled}
                              checked={isSelected}
                              onChange={() => setSelectedReviewerId(r.id.toString())}
                              className="mt-0.5 text-purple-600"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center space-x-2">
                                <span>{r.full_name}</span>
                                <span className="text-[10px] text-slate-500 font-normal">({r.affiliation})</span>
                              </div>

                              {r.review_interests && (
                                <p className="text-[11px] text-purple-900 mt-0.5 line-clamp-1">
                                  <strong>Especialidades:</strong> {r.review_interests}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                                {item.reasons.map((reason, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-1.5 py-0.5 rounded ${
                                      item.isConflict
                                        ? "bg-red-100 text-red-800"
                                        : "bg-purple-100 text-purple-800"
                                    }`}
                                  >
                                    {reason}
                                  </span>
                                ))}
                                {item.assignedCount > 0 && (
                                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                    {item.assignedCount} tarefa(s) pendente(s)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {item.isConflict ? (
                              <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                Conflito
                              </span>
                            ) : (
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  item.score >= 80
                                    ? "bg-emerald-100 text-emerald-800"
                                    : item.score >= 50
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {item.score}% afinidade
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-tight">
              Ao confirmar, o sistema enviará automaticamente um <strong>e-mail de convite formal</strong> ao parecerista com as diretrizes do sigilo duplo-cego.
            </p>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading || !selectedReviewerId}
                onClick={handleAssignReviewer}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Confirmar Designação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gravação de Decisão Editorial */}
      {decisionModalOpen && selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Gravar Decisão Editorial
            </h3>
            <p className="text-xs text-slate-600">
              Trabalho: <strong>#{selectedPaper.id} - {selectedPaper.title}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Decisão Final:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision("accept")}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      decision === "accept"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("revisions")}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      decision === "revisions"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Revisões
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("reject")}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      decision === "reject"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Rejeitar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Parecer Formal / Mensagem aos Autores:
                </label>
                <textarea
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {decision === "accept" && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-900 space-y-2.5">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={publishToProceedings}
                      onChange={(e) => setPublishToProceedings(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span>Publicar no Repositório de Anais (Proceedings) e Depositar DOI</span>
                  </label>

                  {/* TRAVA DE APRESENTAÇÃO (POLÍTICA DE NO-SHOW) */}
                  {publishToProceedings && (
                    <div className="pt-2 border-t border-purple-200 space-y-2 bg-white/70 p-2.5 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px] flex items-center space-x-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>Trava de Apresentação (No-Show Policy):</span>
                        </span>
                        {selectedPaper.is_presented === 1 ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            ✅ Já Apresentado
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            ⏳ Apresentação Pendente
                          </span>
                        )}
                      </div>

                      <label className="flex items-start space-x-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={confirmPresentedInModal}
                          onChange={(e) => setConfirmPresentedInModal(e.target.checked)}
                          className="mt-0.5 rounded text-purple-600"
                        />
                        <span className="text-[11px] leading-tight">
                          <strong>Atestar que o autor apresentou o trabalho</strong> (presencial ou online). Sem este atesto, a trava manterá o trabalho como <u>Aceito</u>, impedindo publicação nos Anais e emissão de DOI.
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRecordDecision}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {actionLoading ? "Salvando..." : "Gravar Decisão Editorial"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização da Mensagem de E-mail */}
      {viewingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Auditoria de Mensagem
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-1">
                  {viewingEmail.subject}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Para: <strong>{viewingEmail.recipient_name}</strong> ({viewingEmail.recipient_email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingEmail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Container do HTML do E-mail */}
            <div className="max-h-[500px] overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div
                className="prose prose-sm max-w-none text-xs"
                dangerouslySetInnerHTML={{ __html: viewingEmail.content_html }}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-500">
                Disparado em: {new Date(viewingEmail.created_at).toLocaleString("pt-BR")}
              </span>
              <button
                type="button"
                onClick={() => setViewingEmail(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
