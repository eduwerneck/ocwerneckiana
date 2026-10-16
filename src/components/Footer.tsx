import Link from "next/link";
import { BookOpen, ShieldCheck, Globe, GitFork, ExternalLink, Award, Code2, Database } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                OCW
              </div>
              <div>
                <span className="text-white font-bold text-base tracking-tight block">
                  Open Conference Werneckiana
                </span>
                <span className="text-[11px] text-blue-400 font-medium tracking-wide uppercase">
                  Clone Funcional do PKP OCS (v1.0)
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Plataforma acadêmica contemporânea de código aberto para submissões, avaliação por pares duplo-cega (*double-blind pure web*), gestão editorial e publicação de anais científicos (*proceedings*), desenvolvida sob os padrões abertos da <strong>Public Knowledge Project (PKP)</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center space-x-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Double-Blind Review</span>
              </span>
              <span className="flex items-center space-x-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Open Access</span>
              </span>
              <span className="flex items-center space-x-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Crossref & OAI-PMH 2.0</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">
              Navegação Pública
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Portal de Conferências
                </Link>
              </li>
              <li>
                <Link href="/proceedings" className="hover:text-white transition">
                  Anais e Publicações (Proceedings)
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="hover:text-white transition">
                  Grade de Programação (Híbrida/Online)
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">
                  Credenciamento / Inscrições
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition">
                  Entrar no Sistema (Login / ORCID)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">
              Páginas de Gestão
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard/director" className="hover:text-white transition flex items-center space-x-1">
                  <span>Painel do Administrador (Gestão & Eventos)</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/user" className="hover:text-white transition flex items-center space-x-1">
                  <span>Meu Painel (Autor & Avaliador)</span>
                </Link>
              </li>
              <li className="pt-2 text-slate-500">
                <span>Versão do Sistema: v1.0.0</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bloco Discreto de Autoria e Ciência Aberta */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-slate-400">
            <span>
              Desenvolvido por <strong>Eduardo Augusto Werneck Ribeiro</strong> (2026).
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span>Projeto científico e tecnológico em Ciência Aberta.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Badge GitHub */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-md border border-slate-700 transition"
              title="Repositório de código aberto no GitHub"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-[11px]">Código Aberto no GitHub</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
            </a>

            {/* Badge Zenodo */}
            <a
              href="https://zenodo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 hover:text-purple-100 px-2.5 py-1 rounded-md border border-purple-800/60 transition"
              title="Arquivo permanente de software e dados de pesquisa no Zenodo"
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono text-[11px] font-semibold">Zenodo • DOI: 10.5281/zenodo.werneckiana.2026</span>
              <ExternalLink className="w-2.5 h-2.5 text-purple-400" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
