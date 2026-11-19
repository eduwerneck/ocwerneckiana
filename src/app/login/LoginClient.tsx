"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, ShieldCheck, AlertCircle, User, Lock, UserPlus, Mail, Building2 } from "lucide-react";
import { loginAction, registerUserAction, demoLoginAction } from "@/app/auth-actions";

interface Props {
  demoMode?: boolean;
  nextPath?: string;
}

export default function LoginClient({ demoMode = false, nextPath = "" }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Informe usuário/e-mail e senha.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("password", password);
      if (nextPath) formData.append("next", nextPath);

      const res = await loginAction(formData);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      } else {
        setError(res.error || "Falha na autenticação.");
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || password.length < 8) {
      setError("Preencha nome completo, e-mail válido e senha com pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("full_name", fullName.trim());
      formData.append("email", email.trim());
      formData.append("affiliation", affiliation.trim());
      formData.append("password", password);

      const res = await registerUserAction(formData);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      } else {
        setError(res.error || "Não foi possível criar a conta.");
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: "admin" | "user") => {
    setLoading(true);
    setError("");
    try {
      const res = await demoLoginAction(role);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      } else {
        setError(res.error || "Modo demonstração indisponível.");
      }
    } catch {
      setError("Erro no acesso de demonstração.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-700 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-xl shadow-md">
            OCW
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === "login" ? "Acesso ao Sistema" : "Criar Conta"}
          </h1>
          <p className="text-xs text-slate-500">
            Open Conference Werneckiana • Autenticação de Sessão
          </p>
        </div>

        {/* Seletor de modo: Entrar | Criar conta */}
        <div role="tablist" className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => { setMode("login"); setError(""); }}
            className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              mode === "login" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => { setMode("register"); setError(""); }}
            className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              mode === "register" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Criar Conta
          </button>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="text-xs font-bold text-slate-700 block mb-1">
                Usuário ou E-mail
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: autor@unesp.br ou director"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="text-xs font-bold text-slate-700 block mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{loading ? "Autenticando..." : "Entrar no Sistema"}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-fullname" className="text-xs font-bold text-slate-700 block mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="text-xs font-bold text-slate-700 block mb-1">
                E-mail Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pesquisador@universidade.edu.br"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-affiliation" className="text-xs font-bold text-slate-700 block mb-1">
                Instituição / Filiação
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="reg-affiliation"
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="Universidade / Instituto"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="text-xs font-bold text-slate-700 block mb-1">
                Senha (mínimo 8 caracteres)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{loading ? "Criando conta..." : "Criar Conta"}</span>
            </button>
          </form>
        )}

        {demoMode && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Acesso Rápido de Demonstração (OCW_DEMO_MODE)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin("admin")}
                className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-left transition cursor-pointer"
              >
                <div className="flex items-center space-x-1 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Administrador</span>
                </div>
                <span className="text-[10px] text-purple-700 block mt-0.5">Editor / Gestão</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin("user")}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-left transition cursor-pointer"
              >
                <div className="flex items-center space-x-1 text-xs font-bold">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Autor &amp; Parecerista</span>
                </div>
                <span className="text-[10px] text-blue-700 block mt-0.5">Painel Unificado</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-500 space-y-1">
        <p>
          Deseja apenas se inscrever como ouvinte?{" "}
          <Link href="/register" className="font-bold text-blue-600 hover:underline">
            Inscrição na conferência
          </Link>
        </p>
      </div>
    </div>
  );
}
