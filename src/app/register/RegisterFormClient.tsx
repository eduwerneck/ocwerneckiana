"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAttendeeAction } from "@/app/actions";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  schedConfId?: number;
  conferenceTitle?: string;
}

export default function RegisterFormClient({
  schedConfId = 1,
  conferenceTitle = "Conferência Científica",
}: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [category, setCategory] = useState("Professor/Pesquisador");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("sched_conf_id", String(schedConfId));
    formData.append("full_name", fullName.trim());
    formData.append("email", email.trim());
    formData.append("affiliation", affiliation.trim());
    formData.append("category", category);

    try {
      const res = await registerAttendeeAction(formData);
      if (res.success) {
        setSuccess(true);
        setFullName("");
        setEmail("");
        setAffiliation("");
        router.refresh();
      } else {
        setError(res.error || "Não foi possível efetivar a inscrição.");
      }
    } catch {
      setError("Erro de conexão ao realizar inscrição.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center space-y-3">
        <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
        <h3 className="text-sm font-bold text-emerald-900">Inscrição Confirmada!</h3>
        <p className="text-xs text-emerald-700">
          Seu credenciamento para <strong>{conferenceTitle}</strong> foi registrado.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="text-xs font-semibold text-emerald-800 underline cursor-pointer"
        >
          Realizar nova inscrição
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="att-fullname" className="block font-bold text-slate-700 uppercase mb-1">
          Nome Completo (Para Certificado) *
        </label>
        <input
          id="att-fullname"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ex: Profa. Maria Clara Santos"
          className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          required
        />
      </div>

      <div>
        <label htmlFor="att-email" className="block font-bold text-slate-700 uppercase mb-1">
          E-mail Institucional *
        </label>
        <input
          id="att-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ex: mclara@universidade.edu.br"
          className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          required
        />
      </div>

      <div>
        <label htmlFor="att-affiliation" className="block font-bold text-slate-700 uppercase mb-1">
          Instituição / Universidade de Origem *
        </label>
        <input
          id="att-affiliation"
          type="text"
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          placeholder="Ex: Universidade Federal de Minas Gerais (UFMG)"
          className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          required
        />
      </div>

      <div>
        <label htmlFor="att-category" className="block font-bold text-slate-700 uppercase mb-1">
          Categoria de Inscrição *
        </label>
        <select
          id="att-category"
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

      <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
        Deseja atuar como avaliador(a) ad-hoc? Crie sua conta em <strong>Entrar</strong> e ative seu perfil de parecerista no seu painel autenticado.
      </p>

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
