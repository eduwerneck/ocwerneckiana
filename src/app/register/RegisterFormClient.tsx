"use client";

import { useState } from "react";
import { registerAttendeeAction } from "@/app/actions";
import { Send, CheckCircle } from "lucide-react";

export default function RegisterFormClient() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [category, setCategory] = useState("Professor/Pesquisador");
  const [isReviewer, setIsReviewer] = useState(false);
  const [reviewInterests, setReviewInterests] = useState("");
  const [preferredTracks, setPreferredTracks] = useState<string[]>(["1"]);
  const [lattesUrl, setLattesUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleTrack = (trackId: string) => {
    if (preferredTracks.includes(trackId)) {
      setPreferredTracks(preferredTracks.filter((t) => t !== trackId));
    } else {
      setPreferredTracks([...preferredTracks, trackId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("sched_conf_id", "1");
    formData.append("full_name", fullName);
    formData.append("email", email);
    formData.append("affiliation", affiliation);
    formData.append("category", category);
    formData.append("is_reviewer_candidate", isReviewer ? "true" : "false");
    formData.append("review_interests", reviewInterests);
    formData.append("preferred_track_ids", preferredTracks.join(","));
    formData.append("lattes_url", lattesUrl);

    try {
      await registerAttendeeAction(formData);
      setSuccess(true);
      setFullName("");
      setEmail("");
      setAffiliation("");
      setReviewInterests("");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Erro ao realizar inscrição.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center space-y-2">
        <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
        <h3 className="text-sm font-bold text-emerald-900">Inscrição Confirmada com Sucesso!</h3>
        <p className="text-xs text-emerald-700">
          Seu credenciamento para o X CITECA 2026 foi registrado na base de dados do OCW.
          {isReviewer && " Seu perfil foi adicionado ao Banco de Pareceristas Ad-hoc por área de conhecimento."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div>
        <label className="block font-bold text-slate-700 uppercase mb-1">
          Nome Completo (Para Certificado) *
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ex: Profa. Maria Clara Santos"
          className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          required
        />
      </div>

      <div>
        <label className="block font-bold text-slate-700 uppercase mb-1">
          E-mail Institucional *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ex: mclara@universidade.edu.br"
          className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          required
        />
      </div>

      <div>
        <label className="block font-bold text-slate-700 uppercase mb-1">
          Instituição / Universidade de Origem *
        </label>
        <input
          type="text"
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          placeholder="Ex: Universidade Federal de Minas Gerais (UFMG)"
          className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          required
        />
      </div>

      <div>
        <label className="block font-bold text-slate-700 uppercase mb-1">
          Categoria de Inscrição *
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
        >
          <option value="Estudante de Graduação">Estudante de Graduação</option>
          <option value="Pós-Graduando">Pós-Graduando (Mestrado / Doutorado)</option>
          <option value="Professor/Pesquisador">Professor / Pesquisador</option>
          <option value="Profissional">Profissional da Informação / Indústria</option>
        </select>
      </div>

      {/* Opção para se voluntariar como Parecerista / Avaliador Ad-hoc */}
      <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-3">
        <label className="flex items-start space-x-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isReviewer}
            onChange={(e) => setIsReviewer(e.target.checked)}
            className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
          />
          <div>
            <span className="font-bold text-purple-950 block">
              Desejo atuar como Avaliador(a) / Parecerista Ad-hoc neste evento
            </span>
            <span className="text-[11px] text-purple-700 block leading-tight mt-0.5">
              Receba convites de avaliação por afinidade temática e obtenha declaração com validação acadêmica para o Lattes.
            </span>
          </div>
        </label>

        {isReviewer && (
          <div className="pt-2 border-t border-purple-200 space-y-3 text-xs">
            <div>
              <label className="block font-bold text-purple-900 mb-1">
                Áreas de Especialidade & Palavras-chave de Interesse *
              </label>
              <input
                type="text"
                value={reviewInterests}
                onChange={(e) => setReviewInterests(e.target.value)}
                placeholder="Ex: Ciência Aberta, Inteligência Artificial, Repositórios, Metadados"
                className="w-full border border-purple-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                required={isReviewer}
              />
              <span className="text-[10px] text-purple-600 mt-0.5 block">
                Separadas por vírgula. Usadas para cálculo do índice de compatibilidade com os trabalhos.
              </span>
            </div>

            <div>
              <label className="block font-bold text-purple-900 mb-1">
                Trilhas Temáticas de Preferência:
              </label>
              <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-purple-200">
                <label className="flex items-center space-x-2 cursor-pointer text-[11px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={preferredTracks.includes("1")}
                    onChange={() => toggleTrack("1")}
                    className="rounded text-purple-600"
                  />
                  <span>Trilha 1: Ciência Aberta, FAIR Principles e Repositórios</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-[11px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={preferredTracks.includes("2")}
                    onChange={() => toggleTrack("2")}
                    className="rounded text-purple-600"
                  />
                  <span>Trilha 2: Inteligência Artificial e Tecnologias Emergentes</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-[11px] text-slate-700">
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

            <div>
              <label className="block font-bold text-purple-900 mb-1">
                Link do Currículo Lattes ou ORCID (Opcional):
              </label>
              <input
                type="text"
                value={lattesUrl}
                onChange={(e) => setLattesUrl(e.target.value)}
                placeholder="http://lattes.cnpq.br/... ou 0000-0002-..."
                className="w-full border border-purple-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{loading ? "Processando Inscrição..." : "Efetivar Inscrição no Congresso"}</span>
        </button>
      </div>
    </form>
  );
}
