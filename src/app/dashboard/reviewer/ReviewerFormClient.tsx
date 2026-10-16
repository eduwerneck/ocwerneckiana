"use client";

import { useState } from "react";
import { ReviewAssignment } from "@/lib/ocs-service";
import { submitReviewAction } from "@/app/actions";
import { countWords } from "@/lib/references";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Star, 
  Send,
  Eye,
  AlertCircle,
  RotateCcw,
  MessageSquare,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  X,
  BookOpen,
  Image as ImageIcon,
  Check
} from "lucide-react";
import StructuredTextRenderer from "@/components/StructuredTextRenderer";

interface Props {
  assignments: ReviewAssignment[];
}

export default function ReviewerFormClient({ assignments }: Props) {
  const [selectedAssignment, setSelectedAssignment] = useState<ReviewAssignment | null>(null);
  const [readingAssignment, setReadingAssignment] = useState<ReviewAssignment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [recommendation, setRecommendation] = useState<"accept" | "revisions" | "reject">("accept");
  const [scoreOriginality, setScoreOriginality] = useState(5);
  const [scoreMethodology, setScoreMethodology] = useState(4);
  const [scoreClarity, setScoreClarity] = useState(4);
  const [scoreRelevance, setScoreRelevance] = useState(5);
  const [commentsAuthor, setCommentsAuthor] = useState("");
  const [commentsDirector, setCommentsDirector] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpenEvaluation = (assignment: ReviewAssignment) => {
    setSelectedAssignment(assignment);
    setRecommendation(assignment.recommendation || (assignment.round && assignment.round > 1 ? "accept" : "revisions"));
    setScoreOriginality(assignment.score_originality || 5);
    setScoreMethodology(assignment.score_methodology || 4);
    setScoreClarity(assignment.score_clarity || 4);
    setScoreRelevance(assignment.score_relevance || 5);
    setCommentsAuthor(
      assignment.comments_author ||
      (assignment.round && assignment.round > 1
        ? "Após análise das correções efetuadas pelo autor e da carta de resposta, verifico que as solicitações foram atendidas satisfatoriamente."
        : "")
    );
    setCommentsDirector(assignment.comments_director || "");
    setModalOpen(true);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedAssignment) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("assignment_id", selectedAssignment.id.toString());
    formData.append("recommendation", recommendation);
    formData.append("score_originality", scoreOriginality.toString());
    formData.append("score_methodology", scoreMethodology.toString());
    formData.append("score_clarity", scoreClarity.toString());
    formData.append("score_relevance", scoreRelevance.toString());
    formData.append("comments_author", commentsAuthor);
    formData.append("comments_director", commentsDirector);

    try {
      await submitReviewAction(formData);
      setModalOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar parecer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-semibold text-slate-700">
        <span>Trabalhos Atribuídos ({assignments.length})</span>
        <span className="text-slate-500 font-normal">Avaliação Duplo-Cego: nomes de autores desidentificados</span>
      </div>

      <div className="divide-y divide-slate-100">
        {assignments.map((assignment) => {
          const isCompleted = assignment.status === "completed";
          const isRound2 = assignment.round && assignment.round > 1;

          return (
            <div key={assignment.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-blue-700">{assignment.track_title}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">Designado em: {assignment.date_assigned}</span>

                    {/* Badge de Rodada 2 / Reavaliação */}
                    {isRound2 ? (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center space-x-1 shadow-2xs">
                          <RotateCcw className="w-3 h-3 text-purple-600 animate-spin-slow" />
                          <span>Rodada {assignment.round}: Reavaliação Solicitada</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded text-[11px]">
                          Rodada 1 (Avaliação Inicial)
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {assignment.paper_title}
                  </h3>

                  {/* Alerta de Retorno com Versão Corrigida */}
                  {isRound2 && assignment.author_response && (
                    <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3 text-xs space-y-1 text-purple-950">
                      <strong className="flex items-center space-x-1.5 font-bold text-purple-900">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                        <span>O autor reenviou o trabalho respondendo às suas solicitações:</span>
                      </strong>
                      <p className="italic bg-white/80 p-2 rounded border border-purple-100 text-slate-700">
                        &quot;{assignment.author_response}&quot;
                      </p>
                      {assignment.revised_file_name && (
                        <span className="text-[11px] text-purple-700 font-medium block pt-0.5">
                          Novo manuscrito corrigido anexado: <strong>{assignment.revised_file_name}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs text-slate-600 leading-relaxed">
                    <strong className="block text-slate-800 mb-1">Resumo do Manuscrito para Parecer:</strong>
                    {assignment.paper_abstract}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  {isCompleted ? (
                    <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Parecer Enviado</span>
                    </span>
                  ) : (
                    <span className={`inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isRound2 ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isRound2 ? "Reavaliação Pendente" : "Aguardando Parecer"}</span>
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReadingAssignment(assignment)}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-semibold px-3 py-2 rounded-lg text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                      title="Abrir o leitor de avaliação cega na tela (sem risco de metadados de arquivos)"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-600" />
                      <span>Ler Artigo Cego Online</span>
                    </button>

                    <button
                      onClick={() => handleOpenEvaluation(assignment)}
                      className={`font-semibold px-4 py-2 rounded-lg text-xs flex items-center space-x-1.5 transition cursor-pointer ${
                        isCompleted
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          : isRound2
                          ? "bg-purple-700 hover:bg-purple-800 text-white shadow-2xs"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                      }`}
                    >
                      <span>
                        {isCompleted
                          ? "Revisar Parecer Enviado"
                          : isRound2
                          ? "Realizar Reavaliação (Rodada 2)"
                          : "Preencher Formulário de Avaliação"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Se já foi preenchido, exibir notas */}
              {isCompleted && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold text-emerald-950">
                    <span>Recomendação registrada: {assignment.recommendation?.toUpperCase()}</span>
                    <span className="text-[11px] font-normal text-emerald-800">{assignment.date_completed}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-emerald-900">
                    <div>Originalidade: <strong>{assignment.score_originality}/5</strong></div>
                    <div>Metodologia: <strong>{assignment.score_methodology}/5</strong></div>
                    <div>Clareza: <strong>{assignment.score_clarity}/5</strong></div>
                    <div>Relevância: <strong>{assignment.score_relevance}/5</strong></div>
                  </div>
                  {assignment.comments_author && (
                    <p className="italic text-emerald-800 pt-1">
                      &quot;{assignment.comments_author}&quot;
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: FORMULÁRIO DE PARECER / REAVALIAÇÃO */}
      {modalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>
                    {selectedAssignment.round && selectedAssignment.round > 1
                      ? `Formulário de Reavaliação (Rodada ${selectedAssignment.round})`
                      : "Formulário de Parecer Científico (Peer Review)"}
                  </span>
                </h3>
                <span className="text-xs text-slate-500">Avaliação Duplo-Cego • PKP OCS Standard</span>
              </div>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded uppercase">
                {selectedAssignment.round && selectedAssignment.round > 1 ? "Rodada 2" : "Rodada 1"}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Título do Manuscrito</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedAssignment.paper_title}</p>
            </div>

            {/* Painel Especial de Reavaliação: Carta de Resposta e Histórico */}
            {selectedAssignment.round && selectedAssignment.round > 1 && (
              <div className="bg-purple-50/80 border border-purple-200 rounded-lg p-4 space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-purple-900 font-bold">
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  <span>Reavaliação: O trabalho retornou para você</span>
                </div>
                
                <p className="text-purple-800 leading-relaxed">
                  O autor revisou o texto atendendo às exigências da primeira rodada e enviou a versão corrigida acompanhada da carta de esclarecimento abaixo:
                </p>

                {selectedAssignment.author_response && (
                  <div className="bg-white p-3 rounded-lg border border-purple-200 space-y-1">
                    <strong className="text-purple-950 font-bold block flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                      <span>Carta de Resposta do Autor:</span>
                    </strong>
                    <p className="text-slate-700 italic leading-relaxed">
                      &quot;{selectedAssignment.author_response}&quot;
                    </p>
                  </div>
                )}

                {selectedAssignment.previous_review && (
                  <div className="bg-purple-100/50 p-2.5 rounded border border-purple-200 text-[11px] space-y-1">
                    <strong className="text-purple-900 block font-semibold">
                      Lembrete: O que você solicitou na Rodada 1:
                    </strong>
                    <p className="text-purple-800 italic">
                      &quot;{selectedAssignment.previous_review.comments_author}&quot;
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Critérios de Avaliação (Notas de 1 a 5) */}
            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Critérios Objetivos de Avaliação (Escala 1 a 5)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    1. Originalidade e Inovação
                  </label>
                  <select
                    value={scoreOriginality}
                    onChange={(e) => setScoreOriginality(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="5">5 - Excelente</option>
                    <option value="4">4 - Muito Bom</option>
                    <option value="3">3 - Satisfatório</option>
                    <option value="2">2 - Insuficiente</option>
                    <option value="1">1 - Não atende</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    2. Rigor Metodológico e Fundamentação
                  </label>
                  <select
                    value={scoreMethodology}
                    onChange={(e) => setScoreMethodology(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="5">5 - Excelente</option>
                    <option value="4">4 - Muito Bom</option>
                    <option value="3">3 - Satisfatório</option>
                    <option value="2">2 - Insuficiente</option>
                    <option value="1">1 - Não atende</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    3. Clareza e Qualidade do Texto
                  </label>
                  <select
                    value={scoreClarity}
                    onChange={(e) => setScoreClarity(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="5">5 - Excelente</option>
                    <option value="4">4 - Muito Bom</option>
                    <option value="3">3 - Satisfatório</option>
                    <option value="2">2 - Insuficiente</option>
                    <option value="1">1 - Não atende</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    4. Relevância para a Trilha
                  </label>
                  <select
                    value={scoreRelevance}
                    onChange={(e) => setScoreRelevance(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="5">5 - Altamente Relevante</option>
                    <option value="4">4 - Relevante</option>
                    <option value="3">3 - Moderada</option>
                    <option value="2">2 - Baixa aderência</option>
                    <option value="1">1 - Fora do escopo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recomendação */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Recomendação Final do Parecerista *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRecommendation("accept")}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition text-center ${
                    recommendation === "accept"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="block font-bold">Aceitar Submissão</span>
                  <span className="text-[10px] opacity-80 font-normal">Aprovado para anais</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecommendation("revisions")}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition text-center ${
                    recommendation === "revisions"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-300"
                      : "bg-amber-50/60 text-amber-900 border-amber-300 hover:bg-amber-100"
                  }`}
                >
                  <span className="block font-bold">Solicitar Revisões (Reavaliar)</span>
                  <span className="text-[10px] opacity-80 font-normal">Retorna para este parecerista</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecommendation("reject")}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition text-center ${
                    recommendation === "reject"
                      ? "bg-red-600 text-white border-red-600 shadow-xs ring-2 ring-red-300"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="block font-bold">Rejeitar</span>
                  <span className="text-[10px] opacity-80 font-normal">Não aceito no evento</span>
                </button>
              </div>

              {recommendation === "revisions" && (
                <div className="mt-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Garantia de Retorno ao Mesmo Avaliador:</strong>
                    <span>
                      Ao solicitar revisões, o trabalho é encaminhado ao autor com seus apontamentos. Assim que o autor enviar a versão corrigida com a carta de resposta, <strong>o sistema encaminhará automaticamente o manuscrito de volta para você reavaliar na Rodada 2</strong>.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Pareceres Textuais */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Parecer Detalhado para os Autores *
                </label>
                <textarea
                  value={commentsAuthor}
                  onChange={(e) => setCommentsAuthor(e.target.value)}
                  rows={4}
                  placeholder="Apresente suas considerações, críticas construtivas e as correções necessárias que o autor deve implementar..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800 uppercase mb-1">
                  Comentários Confidenciais ao Editor de Conferência (Opcional)
                </label>
                <textarea
                  value={commentsDirector}
                  onChange={(e) => setCommentsDirector(e.target.value)}
                  rows={2}
                  placeholder="Observações que não serão exibidas aos autores (ex: suspeitas de plágio, conflitos de interesse)..."
                  className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-amber-50/30"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading || !commentsAuthor.trim()}
                onClick={handleSubmitEvaluation}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded-lg disabled:opacity-50 flex items-center space-x-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {loading
                    ? "Enviando Parecer..."
                    : selectedAssignment.round && selectedAssignment.round > 1
                    ? "Concluir Reavaliação"
                    : recommendation === "revisions"
                    ? "Enviar e Solicitar Reavaliação ao Autor"
                    : "Finalizar e Gravar Parecer"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LEITOR DO MANUSCRITO DUPLO-CEGO POR DESIGN (PURE WEB) */}
      {readingAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header do Leitor */}
            <div className="border-b border-slate-200 pb-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded uppercase flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                    <span>Avaliação Cega por Design (Double-Blind Pure Web)</span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                    {readingAssignment.track_title}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {readingAssignment.paper_title}
                </h2>
                <p className="text-xs text-slate-500">
                  Visualização 100% anonimizada. Nomes de autores, afiliações e metadados de software proprietário foram purificados pelo sistema.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReadingAssignment(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumo do Artigo */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Resumo (Abstract)
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {readingAssignment.paper_abstract}
              </p>
            </div>

            {/* Contagem de Palavras no Corpo */}
            {(() => {
              const body = `${readingAssignment.paper_section_intro || ""} ${readingAssignment.paper_section_methods || ""} ${readingAssignment.paper_section_results || ""} ${readingAssignment.paper_section_conclusion || ""}`.trim();
              const words = countWords(body);
              let figs: any[] = [];
              if (readingAssignment.paper_figures_json) {
                try {
                  figs = JSON.parse(readingAssignment.paper_figures_json);
                } catch {
                  figs = [];
                }
              }

              return (
                <div className="space-y-6">
                  {words > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50/70 border border-blue-200 px-3.5 py-2 rounded-lg text-xs text-blue-900">
                      <span className="font-medium">
                        Extensão do Artigo Curto: <strong>{words} palavras</strong> (Teto regulamentar: 2.000 palavras)
                      </span>
                      <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-blue-200 font-semibold text-blue-800">
                        {figs.length} figura(s) em alta resolução (300 DPI)
                      </span>
                    </div>
                  )}

                  {/* Seção 1: Introdução */}
                  {readingAssignment.paper_section_intro && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                        <span>1. Introdução</span>
                      </h3>
                      <StructuredTextRenderer
                        text={readingAssignment.paper_section_intro}
                        figures={figs}
                        sectionName="intro"
                      />
                    </section>
                  )}

                  {/* Seção 2: Materiais e Métodos */}
                  {readingAssignment.paper_section_methods && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                        <span>2. Materiais e Métodos</span>
                      </h3>
                      <StructuredTextRenderer
                        text={readingAssignment.paper_section_methods}
                        figures={figs}
                        sectionName="methods"
                      />
                    </section>
                  )}

                  {/* Seção 3: Resultados e Discussão */}
                  {readingAssignment.paper_section_results && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                        <span>3. Resultados e Discussão</span>
                      </h3>
                      <StructuredTextRenderer
                        text={readingAssignment.paper_section_results}
                        figures={figs}
                        sectionName="results"
                      />
                    </section>
                  )}

                  {/* Seção 4: Considerações Finais */}
                  {readingAssignment.paper_section_conclusion && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">4</span>
                        <span>4. Considerações Finais</span>
                      </h3>
                      <StructuredTextRenderer
                        text={readingAssignment.paper_section_conclusion}
                        figures={figs}
                        sectionName="conclusion"
                      />
                    </section>
                  )}

                  {/* Referências Bibliográficas Citadas */}
                  {readingAssignment.paper_references_text && (
                    <section className="space-y-2 border-t border-slate-200 pt-4">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        <span>Referências Bibliográficas Citadas</span>
                      </h3>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-serif text-slate-800 leading-relaxed whitespace-pre-line">
                        {readingAssignment.paper_references_text}
                      </div>
                    </section>
                  )}
                </div>
              );
            })()}

            {/* Footer do Leitor com Atalho para Emitir Parecer */}
            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Concluiu a leitura? Prossiga para a avaliação por notas e parecer editorial.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setReadingAssignment(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  Fechar Leitor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const toEval = readingAssignment;
                    setReadingAssignment(null);
                    handleOpenEvaluation(toEval);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center space-x-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Emitir Parecer deste Trabalho</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
