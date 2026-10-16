import Link from "next/link";
import { notFound } from "next/navigation";
import { getConferenceBySlug } from "@/lib/ocs-service";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  BookOpen, 
  Send, 
  Layers, 
  Bell, 
  User, 
  Mail,
  ChevronRight,
  FileCheck,
  Barcode
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConferencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const conf = getConferenceBySlug(slug);

  if (!conf) {
    notFound();
  }

  const active = conf.active_edition;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-700">Início</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800">{conf.acronym}</span>
      </nav>

      {/* Banner Principal da Conferência */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">
              {conf.acronym}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {conf.title}
            </h1>
            <p className="text-sm text-slate-500">
              Contato: {conf.contact_name} ({conf.contact_email})
            </p>
          </div>

          {active && (
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/conference/${conf.slug}/submit`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-2 text-sm"
              >
                <Send className="w-4 h-4" />
                <span>Submeter Artigo</span>
              </Link>
              <Link
                href="/register"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-2 text-sm"
              >
                <FileCheck className="w-4 h-4" />
                <span>Inscrição no Evento</span>
              </Link>
            </div>
          )}
        </div>

        <div className="pt-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">Sobre a Conferência</h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
            {conf.description}
          </p>
        </div>
      </div>

      {/* Grade de Conteúdo: Edição Ativa + Trilhas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Trilhas e Comunicados */}
        <div className="lg:col-span-2 space-y-8">
          {/* Trilhas Temáticas */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Modalidades e Trilhas Temáticas (Tracks)
              </h2>
            </div>

            <div className="space-y-4 pt-1">
              {conf.tracks.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Nenhuma trilha cadastrada no momento.</p>
              ) : (
                conf.tracks.map((track) => (
                  <div
                    key={track.id}
                    className="border border-slate-200/80 rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">
                        {track.title}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                        Máx. {track.max_words} palavras
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {track.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comunicados e Notícias */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Bell className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">
                Notícias e Comunicados da Conferência
              </h2>
            </div>

            <div className="space-y-4 pt-1">
              {conf.announcements.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Nenhum comunicado recente.</p>
              ) : (
                conf.announcements.map((ann) => (
                  <article key={ann.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                      <span className="text-[11px] text-slate-400">{ann.date_posted}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Barra Lateral: Cronograma e Edições */}
        <div className="space-y-6">
          {active && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Edição em Andamento: {active.acronym}
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                {active.city && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span><strong>Cidade Sede:</strong> {active.city}</span>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span><strong>Local:</strong> {active.location}</span>
                </div>
                {active.isbn && (
                  <div className="flex items-start space-x-2 text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 font-mono text-[11px]">
                    <Barcode className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-emerald-950 font-sans">ISBN do Evento:</strong>
                      <span className="font-bold">{active.isbn}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span><strong>Realização:</strong> {active.start_date} até {active.end_date}</span>
                </div>
                <div className="flex items-start space-x-2 text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-blue-900">Prazo de Submissão (CFP)</strong>
                    <span>{active.cfp_deadline}</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span><strong>Resultado das Avaliações:</strong> {active.results_date}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Link
                  href={`/conference/${conf.slug}/submit`}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Submissão</span>
                </Link>
                <Link
                  href={`/proceedings/${active.id}`}
                  className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Consultar Anais Publicados</span>
                </Link>
                <Link
                  href={`/schedule`}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ver Programação</span>
                </Link>
              </div>
            </div>
          )}

          {/* Histórico de Edições */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Edições Anteriores & Anais
            </h3>
            <ul className="space-y-2 text-xs">
              {conf.editions?.map((edition) => (
                <li key={edition.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="font-medium text-slate-700">{edition.title}</span>
                  <Link
                    href={`/proceedings/${edition.id}`}
                    className="text-purple-600 hover:text-purple-800 font-semibold flex items-center space-x-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Anais</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
