"use client";

import React from "react";
import { Image as ImageIcon, ExternalLink, CheckCircle } from "lucide-react";

export interface RenderableFigure {
  id: number;
  caption: string;
  url: string;
  dpi?: number;
  file_name?: string;
  section?: "methods" | "results" | "intro" | "conclusion" | string;
}

interface Props {
  text: string;
  figures?: RenderableFigure[];
  sectionName?: "methods" | "results" | "intro" | "conclusion";
  className?: string;
}

export default function StructuredTextRenderer({
  text,
  figures = [],
  sectionName,
  className = "",
}: Props) {
  if (!text) return null;

  // Rastrear quais figuras foram inseridas inline para não duplicar no final
  const renderedFigureIds = new Set<number>();

  // Regex para identificar tags como: [Figura 1: Titulo], [Figura 2], [Figure 3: ...]
  const tagRegex = /(\[(?:Figura|Figure)\s*\d+[^\]]*\])/gi;
  const parts = text.split(tagRegex);

  return (
    <div className={`space-y-4 ${className}`}>
      {parts.map((part, index) => {
        const match = part.match(/^\[(?:Figura|Figure)\s*(\d+)(?::\s*([^\]]*))?\]/i);

        if (match) {
          const figNum = Number(match[1]);
          const inlineCaption = match[2]?.trim();

          // Buscar a figura correspondente por ID ou menção no título
          const matchedFig = figures.find(
            (f) =>
              f.id === figNum ||
              f.caption?.toLowerCase().includes(`figura ${figNum}`) ||
              f.caption?.toLowerCase().includes(`figura ${figNum}:`)
          );

          if (matchedFig) {
            renderedFigureIds.add(matchedFig.id);
            const caption = matchedFig.caption || (inlineCaption ? `Figura ${figNum}: ${inlineCaption}` : `Figura ${figNum}`);
            const dpi = matchedFig.dpi || 300;

            return (
              <figure
                key={index}
                className="my-5 border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-2.5 shadow-2xs hover:border-purple-200 transition"
              >
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center max-h-[460px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={matchedFig.url}
                    alt={caption}
                    className="w-full h-auto object-contain max-h-[460px]"
                    loading="lazy"
                  />
                </div>

                <figcaption className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-2 pt-1 px-1">
                  <div className="flex items-start space-x-1.5 font-semibold text-slate-800 leading-snug">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span>{caption}</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto text-[11px]">
                    {matchedFig.file_name && (
                      <span className="font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {matchedFig.file_name}
                      </span>
                    )}
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold border border-emerald-200 flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>{dpi} DPI • Padrão Gráfico</span>
                    </span>
                  </div>
                </figcaption>
              </figure>
            );
          } else {
            // Caso a figura citada na tag não exista no array de figuras
            return (
              <div
                key={index}
                className="my-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between"
              >
                <span className="font-medium">
                  🖼️ <strong>{part.replace(/[\[\]]/g, "")}</strong>
                </span>
                <span className="text-[11px] text-amber-700 italic">
                  (Chamada inserida pelo autor no texto)
                </span>
              </div>
            );
          }
        }

        // Parágrafos de texto normais
        const trimmed = part.trim();
        if (!trimmed) return null;

        const paragraphs = trimmed.split(/\n\s*\n/);
        return (
          <React.Fragment key={index}>
            {paragraphs.map((p, pIdx) => (
              <p
                key={pIdx}
                className="text-sm text-slate-800 leading-relaxed text-justify whitespace-pre-line"
              >
                {p}
              </p>
            ))}
          </React.Fragment>
        );
      })}

      {/* Renderizar figuras extras que pertençam explicitamente a esta seção e não foram chamadas inline */}
      {sectionName && (
        <>
          {figures
            .filter((f) => f.section === sectionName && !renderedFigureIds.has(f.id))
            .map((fig) => (
              <figure
                key={`extra-${fig.id}`}
                className="my-5 border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-2.5 shadow-2xs"
              >
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center max-h-[460px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fig.url}
                    alt={fig.caption}
                    className="w-full h-auto object-contain max-h-[460px]"
                    loading="lazy"
                  />
                </div>
                <figcaption className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-2 pt-1 px-1">
                  <span className="font-semibold text-slate-800">{fig.caption}</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold border border-emerald-200 text-[11px]">
                    {fig.dpi || 300} DPI
                  </span>
                </figcaption>
              </figure>
            ))}
        </>
      )}
    </div>
  );
}
