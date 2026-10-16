"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  BookOpen, 
  Calendar, 
  ShieldCheck, 
  UserCheck, 
  Menu, 
  X,
  Compass,
  FileCheck,
  Globe,
  LogIn,
  User,
  Sparkles
} from "lucide-react";
import { useLanguage, Locale } from "@/lib/i18n";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const navLinks = [
    { href: "/", label: t("navHome"), icon: Compass },
    { href: "/proceedings", label: t("navProceedings"), icon: BookOpen },
    { href: "/schedule", label: t("navSchedule"), icon: Calendar },
    { href: "/register", label: t("navRegister"), icon: FileCheck },
  ];

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: "pt", label: "PT", flag: "🇧🇷" },
    { code: "en", label: "EN", flag: "🇺🇸" },
    { code: "es", label: "ES", flag: "🇪🇸" },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-xs">
      {/* Barra Superior: Nome no canto superior esquerdo e canto superior direito limpo */}
      <div className="bg-slate-950 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex flex-wrap justify-between items-center gap-2">
        {/* Canto Superior Esquerdo */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-white tracking-wide text-xs sm:text-sm">
            Open Conference Werneckiana
          </span>
          <span className="text-[10px] sm:text-[11px] text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800 font-mono font-bold shrink-0">
            OCW v1.0
          </span>
        </div>

        {/* Canto Superior Direito: Limpo, apenas o seletor de idioma minimalista */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-0.5 bg-slate-900 rounded-md p-0.5 border border-slate-800">
            <Globe className="w-3 h-3 text-slate-400 ml-1.5 mr-1 shrink-0" />
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  lang === l.code
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
                title={`Alterar para ${l.label}`}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navegação Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          {/* Logo Principal */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <Link href="/" className="flex items-center space-x-2.5 group shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-xs group-hover:bg-blue-800 transition shrink-0">
                OCW
              </div>
              <div className="shrink-0">
                <span className="text-sm sm:text-base lg:text-lg font-black text-slate-900 tracking-tight block leading-tight">
                  Open Conference Werneckiana
                </span>
                <span className="text-[10px] sm:text-[11px] text-blue-700 font-semibold tracking-wide uppercase block">
                  Gestão Acadêmica de Conferências
                </span>
              </div>
            </Link>
          </div>

          {/* Links Desktop */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 shrink-0">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? "text-blue-700 bg-blue-50/80 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="h-5 w-px bg-slate-200 mx-1"></div>

            {/* As Duas Páginas Principais: Administrador & Meu Painel (Autor/Avaliador) */}
            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Página do Administrador */}
              <Link
                href="/dashboard/director"
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                  pathname.startsWith("/dashboard/director")
                    ? "border-purple-600 bg-purple-600 text-white shadow-xs"
                    : "border-purple-200 bg-purple-50/60 text-purple-900 hover:bg-purple-100"
                }`}
                title="Página do Administrador: Atribuição de funções e cadastro de conferências"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Admin</span>
              </Link>

              {/* Página do Usuário (Autor & Avaliador unificados) */}
              <Link
                href="/dashboard/user"
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                  pathname.startsWith("/dashboard/user") || pathname.startsWith("/dashboard/author") || pathname.startsWith("/dashboard/reviewer")
                    ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                }`}
                title="Meu Painel: Trabalhos como Autor e Avaliações como Parecerista"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Meu Painel<span className="hidden xl:inline"> (Autor/Avaliador)</span>
                </span>
              </Link>

              {/* Botão de Entrar (Login estilo OJS/ORCID) */}
              <Link
                href="/login"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Entrar</span>
              </Link>
            </div>
          </nav>

          {/* Botão Mobile */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              href="/login"
              className="p-1.5 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg border border-blue-200"
            >
              Entrar
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-200 space-y-1.5">
            <Link
              href="/dashboard/director"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-bold text-purple-700 bg-purple-50 border border-purple-200"
            >
              🛡️ Painel do Administrador
            </Link>
            <Link
              href="/dashboard/user"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200"
            >
              👤 Meu Painel (Autor & Avaliador)
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-bold text-slate-800 bg-slate-100"
            >
              🔑 Entrar (Login com ORCID / Google)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
