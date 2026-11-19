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
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useLanguage, Locale } from "@/lib/i18n";
import type { SessionUser } from "@/lib/auth-core";
import { logoutAction } from "@/app/auth-actions";

const ADMIN_ROLE_SET = new Set(["admin", "manager", "director"]);

interface Props {
  sessionUser?: SessionUser | null;
}

export default function Navbar({ sessionUser = null }: Props) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const navLinks = [
    { href: "/", label: t("navHome"), icon: Compass },
    { href: "/proceedings", label: t("navProceedings"), icon: BookOpen },
    { href: "/schedule", label: t("navSchedule"), icon: Calendar },
    { href: "/register", label: t("navRegister"), icon: FileCheck },
  ];

  const languages: { code: Locale; label: string }[] = [
    { code: "pt", label: "PT" },
    { code: "en", label: "EN" },
    { code: "es", label: "ES" },
  ];

  const isAdmin = Boolean(sessionUser && ADMIN_ROLE_SET.has(sessionUser.role));

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-base shadow-xs group-hover:bg-blue-800 transition shrink-0">
              OCW
            </div>
            <div className="shrink-0">
              <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight block leading-tight">
                Open Conference Werneckiana
              </span>
              <span className="text-[10px] text-blue-700 font-semibold tracking-wide uppercase block">
                Gestão Acadêmica de Conferências
              </span>
            </div>
          </Link>

          {/* Navegação Desktop (>= 1024px) */}
          <nav aria-label="Navegação principal" className="hidden lg:flex items-center space-x-1 shrink-0">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? "text-blue-700 bg-blue-50 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="h-5 w-px bg-slate-200 mx-2" />

            {/* Seletor compacto de idioma */}
            <label htmlFor="ocw-lang-select" className="sr-only">
              Idioma
            </label>
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
              <select
                id="ocw-lang-select"
                value={lang}
                onChange={(e) => setLang(e.target.value as Locale)}
                className="pl-7 pr-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Menu único de Conta (Entrar ou Dropdown autenticado) */}
            {!sessionUser ? (
              <Link
                href="/login"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shrink-0 ml-1"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Entrar</span>
              </Link>
            ) : (
              <details className="relative ml-1 group">
                <summary className="list-none flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer transition select-none">
                  <UserCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span className="max-w-[140px] truncate">{sessionUser.full_name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </summary>
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{sessionUser.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{sessionUser.email}</p>
                  </div>
                  <Link
                    href="/dashboard/user"
                    className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Meu Painel (Autor/Avaliador)</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/dashboard/director"
                      className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Painel do Administrador</span>
                    </Link>
                  )}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sair</span>
                      </button>
                    </form>
                  </div>
                </div>
              </details>
            )}
          </nav>

          {/* Gatilho Mobile & Tablet (< 1024px — corrige ausência de menu entre 768px e 1023px) */}
          <div className="flex lg:hidden items-center space-x-2">
            {!sessionUser ? (
              <Link
                href="/login"
                className="px-2.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Entrar
              </Link>
            ) : (
              <Link
                href={isAdmin ? "/dashboard/director" : "/dashboard/user"}
                className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg"
              >
                Painel
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              aria-expanded={mobileMenuOpen}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile & Tablet (< 1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                pathname === link.href ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between px-3">
            <span className="text-xs font-semibold text-slate-500">Idioma</span>
            <div className="flex items-center space-x-1">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`px-2 py-1 rounded text-xs font-bold cursor-pointer ${
                    lang === l.code ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-1.5">
            {sessionUser ? (
              <>
                <Link
                  href="/dashboard/user"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200"
                >
                  Meu Painel (Autor &amp; Avaliador)
                </Link>
                {isAdmin && (
                  <Link
                    href="/dashboard/director"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-bold text-purple-700 bg-purple-50 border border-purple-200"
                  >
                    Painel do Administrador
                  </Link>
                )}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-red-700 bg-red-50 border border-red-200 cursor-pointer"
                  >
                    Sair ({sessionUser.full_name})
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 text-center"
              >
                Entrar no Sistema
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
