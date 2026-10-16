"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  LogIn, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Lock, 
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function LoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [simulatedUser, setSimulatedUser] = useState<string | null>(null);

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Por favor, preencha o usuário e a senha.");
      return;
    }
    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);
      // Redirecionamento inteligente baseado no nome do usuário
      if (username.toLowerCase().includes("admin") || username.toLowerCase().includes("editor")) {
        router.push("/dashboard/director");
      } else {
        router.push("/dashboard/user");
      }
    }, 600);
  };

  const handleOrcidLogin = () => {
    setLoading(true);
    setSimulatedUser("ORCID iD: 0000-0002-1825-0097 (Dr. Lucas Martins)");
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard/user");
    }, 800);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setSimulatedUser("Conta Google: lucas.martins@unesp.br");
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard/user");
    }, 800);
  };

  const handleQuickLogin = (role: "admin" | "user") => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (role === "admin") {
        router.push("/dashboard/director");
      } else {
        router.push("/dashboard/user");
      }
    }, 400);
  };

  return (
    <div className="max-w-md w-full space-y-6">
      {/* Card Principal */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
        {/* Cabeçalho do Card */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-700 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-xl shadow-md">
            OCW
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Acesso ao Sistema
          </h2>
          <p className="text-xs text-slate-500">
            Open Conference Werneckiana • Autenticação Integrada
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Botão Oficial de Login com ORCID (Padrão Ciência Aberta) */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleOrcidLogin}
            disabled={loading}
            className="w-full bg-[#A6CE39] hover:bg-[#95ba32] text-slate-900 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2.5 transition shadow-xs hover:shadow-md cursor-pointer border border-[#8fae2d]"
          >
            <span className="w-5 h-5 rounded-full bg-white text-[#A6CE39] flex items-center justify-center font-black text-[11px] shadow-2xs">
              iD
            </span>
            <span>Entrar com ORCID iD Oficial</span>
          </button>

          {/* 2. Botão de Login com Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2.5 transition border border-slate-300 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar com Google</span>
          </button>
        </div>

        {/* Divisor */}
        <div className="relative flex py-1 items-center">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink mx-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            ou usuário institucional
          </span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        {/* 3. Formulário Tradicional Institucional (Usuário / Senha) */}
        <form onSubmit={handleStandardLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Usuário ou E-mail
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: lucas.martins ou admin"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Senha
              </label>
              <a href="#" className="text-[11px] text-blue-600 hover:underline">
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{loading ? "Autenticando..." : "Entrar no Sistema"}</span>
          </button>
        </form>

        {/* Atalhos Rápidos de Acesso (Demonstração do Sistema) */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
            Acesso Rápido de Demonstração (1 Clique)
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin")}
              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-left transition cursor-pointer"
            >
              <div className="flex items-center space-x-1 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Administrador</span>
              </div>
              <span className="text-[10px] text-purple-700 block mt-0.5">
                Editor Chefe / Gestão
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("user")}
              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-left transition cursor-pointer"
            >
              <div className="flex items-center space-x-1 text-xs font-bold">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Autor & Parecerista</span>
              </div>
              <span className="text-[10px] text-blue-700 block mt-0.5">
                Painel Unificado
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé com link de cadastro */}
      <div className="text-center text-xs text-slate-500 space-y-1">
        <p>
          Ainda não tem cadastro?{" "}
          <Link href="/register" className="font-bold text-blue-600 hover:underline">
            Cadastre-se na conferência
          </Link>
        </p>
        <p className="text-[11px] text-slate-400">
          Open Conference Werneckiana (v1.0) • Baseado nos padrões PKP OCS
        </p>
      </div>
    </div>
  );
}
