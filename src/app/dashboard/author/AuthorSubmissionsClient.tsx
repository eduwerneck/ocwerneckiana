"use client";

import { useState } from "react";
import Link from "next/link";
import { Paper } from "@/lib/ocs-service";
import { submitAuthorRevisionAction } from "@/app/actions";
import { 
  FileText, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  BookOpen, 
  Calendar,
  Layers,
  Upload,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Check
} from "lucide-react";

interface Props {
  papers: Paper[];
}

export default function AuthorSubmissionsClient({ papers }: Props) {
  const [selectedPaperForRevision, setSelectedPaperForRevision] = useState<Paper | null>(null);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisedFileName, setRevisedFileName] = useState("manuscrito_revisado_r2.pdf");
  const [authorResponse, setAuthorResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpenRevisionModal = (paper: Paper) => {
    setSelectedPaperForRevision(paper);
    setRevisedFileName(`artigo_revisado_r2_paper${paper.id}.pdf`);
    setAuthorResponse(
      "Prezados pareceristas e editores, agradecemos pelas considerações emitidas. Todas as sugestões foram incorporadas no texto, especialmente o detalhamento da metodologia na seção 3 e a atualização das referências bibliográficas."
    );
    setRevisionModalOpen(true);
  };

  const handleSendRevision = async () => {
    if (!selectedPaperForRevision || !authorResponse.trim()) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("paper_id", selectedPaperForRevision.id.toString());
    formData.append("revised_file_name", revisedFileName);
    formData.append("author_response", authorResponse);

    try {
      const res = await submitAuthorRevisionAction(formData);
      if (res.success) {
        setRevisionModalOpen(false);
        window.location.reload();
      } else {
        alert(res.error || "Erro ao enviar revisão.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar versão revisada.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (paper: Paper) => {
    if (paper.current_round && paper.current_round > 1 && paper.status === "under_review") {
      return (
        <span className="inline-flex items-center space-x-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
          <RotateCcw className="w-3.5 h-3.5 text-purple-600 animate-spin-slow" />
          <span>Rodada 2: Em Reavaliação pelo Parecerista</span>
        </span>
      );
    }

    switch (paper.status) {
      case "submitted":
        return (
          <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Submetido (Aguardando Pareceristas)</span>
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3 text-blue-600 animate-pulse" />
            <span>Em Avaliação por Pares</span>
          </span>
        );
      case "revisions_required":
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Revisões Solicitadas (Ação Necessária)</span>
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Trabalho Aceito</span>
          </span>
        );
      case "published":
        return (
          <span className="inline-flex items-center space-x-1 bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <BookOpen className="w-3 h-3 text-purple-600" />
            <span>Publicado nos Anais</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center space-x-1 bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>Não Aceito</span>
          </span>
        );
      default:
        return <span>{paper.status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {papers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500 space-y-4">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Você ainda não possui submissões ativas.</p>
          <Link
            href="/conference/citeca/submit"
            className="inline-flex items-center space-x-1.5 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-blue-700 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submeter Primeiro Artigo</span>
          </Link>
        </div>
      ) : (
        papers.map((paper) => {
          const isRevisionsRequired = paper.status === "revisions_required";
          const isRound2UnderReview = paper.current_round && paper.current_round > 1 && paper.status === "under_review";
          const latestReview = paper.reviews?.[paper.reviews.length - 1];

          return (
            <div
              key={paper.id}
              className={`bg-white border rounded-xl p-6 shadow-xs space-y-4 transition ${
                isRevisionsRequired
                  ? "border-amber-300 ring-2 ring-amber-100"
                  : "border-slate-200 hover:shadow-md"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700">#{paper.id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-purple-700">{paper.sched_title}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{paper.track_title}</span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {paper.title}
                  </h2>

                  <p className="text-xs text-slate-500">
                    <strong>Autores:</strong> {paper.authors?.map((a) => a.full_name).join(", ")}
                  </p>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(paper)}
                </div>
              </div>

              {/* CARD DE AÇÃO: REVISÕES REQUERIDAS */}
              {isRevisionsRequired && (
                <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-5 space-y-3 text-xs text-amber-950">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                    <strong className="font-bold text-amber-900 flex items-center space-x-1.5 text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Reavaliação Solicitada: O parecerista solicitou ajustes no manuscrito</span>
                    </strong>
                    <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px] self-start sm:self-auto">
                      Rodada 1 Concluída
                    </span>
                  </div>

                  {/* Parecer do Avaliador para os Autores */}
                  {latestReview?.comments_author && (
                    <div className="space-y-1 bg-white p-3 rounded-lg border border-amber-200">
                      <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                        Apontamentos e Correções Solicitadas pelo Parecerista:
                      </span>
                      <p className="text-slate-800 italic leading-relaxed">
                        &quot;{latestReview.comments_author}&quot;
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-amber-900">
                      Envie a nova versão do arquivo com as alterações. <strong>O trabalho retornará diretamente para o mesmo parecerista original</strong> para verificação.
                    </p>

                    <button
                      onClick={() => handleOpenRevisionModal(paper)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-sm shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Enviar Versão Corrigida para Reavaliação (Rodada 2)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STATUS DE REAVALIAÇÃO EM ANDAMENTO (RODADA 2) */}
              {isRound2UnderReview && (
                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-2 text-xs text-purple-950">
                  <div className="flex items-center space-x-1.5 font-bold text-purple-900">
                    <RotateCcw className="w-4 h-4 text-purple-600" />
                    <span>Versão Corrigida Enviada • Em Reavaliação pelo Parecerista Original</span>
                  </div>
                  <p className="text-purple-800">
                    Você enviou a versão corrigida (<strong>{paper.revised_file_name || "arquivo_revisado.pdf"}</strong>) acompanhada da sua carta de resposta. O parecerista original foi notificado e está realizando a reavaliação.
                  </p>
                  {paper.author_response && (
                    <div className="bg-white p-2.5 rounded border border-purple-200 text-slate-600 italic">
                      &quot;{paper.author_response}&quot;
                    </div>
                  )}
                </div>
              )}

              {/* Resumo */}
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {paper.abstract}
              </p>

              {/* Parecer do Editor (se houver) */}
              {paper.decision && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-blue-900 font-bold">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Parecer do Editor de Conferência:</span>
                    </span>
                    <span className="text-[11px] font-normal text-blue-700">{paper.decision.date_decided}</span>
                  </div>
                  <p className="text-blue-800 leading-relaxed italic">
                    &quot;{paper.decision.comments}&quot;
                  </p>
                </div>
              )}

              {/* Ações da Linha */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                <div className="flex items-center space-x-3 text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Submetido em: {paper.date_submitted}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{paper.file_name}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {paper.status === "published" && (
                    <Link
                      href={`/paper/${paper.id}`}
                      className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-semibold px-3 py-1.5 rounded-md flex items-center space-x-1 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Ver nos Anais</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* MODAL: SUBMETER VERSÃO CORRIGIDA PARA REAVALIAÇÃO */}
      {revisionModalOpen && selectedPaperForRevision && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Enviar Versão Corrigida para Reavaliação</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Submissão #{selectedPaperForRevision.id} • Rodada 2 de Avaliação por Pares
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
              <p>
                <strong>Importante:</strong> Esta versão corrigida será encaminhada <strong>diretamente para o mesmo parecerista original</strong> que avaliou seu trabalho na primeira rodada.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  1. Nome do Arquivo Revisado (PDF):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={revisedFileName}
                    onChange={(e) => setRevisedFileName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                    placeholder="manuscrito_revisao_r2.pdf"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  2. Carta de Resposta aos Pareceristas (Response to Reviewers) *:
                </label>
                <p className="text-slate-500 text-[11px] mb-1.5">
                  Descreva pontualmente as alterações efetuadas em resposta às considerações do parecerista:
                </p>
                <textarea
                  value={authorResponse}
                  onChange={(e) => setAuthorResponse(e.target.value)}
                  rows={5}
                  placeholder="Prezados avaliadores, agradecemos pelas contribuições. Conforme solicitado, reformulamos a introdução, adicionamos o experimento de validação na seção 4 e corrigimos a legenda da figura 2..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading || !authorResponse.trim()}
                onClick={handleSendRevision}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2 rounded-lg disabled:opacity-50 flex items-center space-x-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? "Enviando..." : "Confirmar Envio para o Mesmo Parecerista"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
