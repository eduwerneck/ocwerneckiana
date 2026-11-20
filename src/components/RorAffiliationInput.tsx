"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Loader2 } from "lucide-react";

interface RorSuggestion {
  id: string;
  name: string;
  acronym?: string;
  country?: string;
}

interface Props {
  id?: string;
  label?: string;
  value: string;
  rorId: string;
  onChange: (affiliation: string, rorId: string) => void;
  placeholder?: string;
}

export default function RorAffiliationInput({
  id = "affiliation-ror",
  label = "Instituição / Filiação (com busca ROR)",
  value,
  rorId,
  onChange,
  placeholder = "Digite o nome ou sigla da instituição (ex.: USP, UNESP, UFMG)...",
}: Props) {
  const [suggestions, setSuggestions] = useState<RorSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 3 || rorId) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://api.ror.org/v2/organizations?query=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        const rawItems = Array.isArray(data?.items) ? data.items.slice(0, 6) : [];
        const parsed: RorSuggestion[] = rawItems
          .map((item: Record<string, unknown>) => {
            const names = Array.isArray(item.names) ? (item.names as Array<{ value?: string; types?: string[] }>) : [];
            const display =
              names.find((n) => Array.isArray(n.types) && n.types.includes("ror_display"))?.value ||
              names[0]?.value ||
              "";
            const acronym = names.find((n) => Array.isArray(n.types) && n.types.includes("acronym"))?.value;
            const locations = Array.isArray(item.locations)
              ? (item.locations as Array<{ geonames_details?: { country_name?: string } }>)
              : [];
            const country = locations[0]?.geonames_details?.country_name;
            return {
              id: typeof item.id === "string" ? item.id : "",
              name: display,
              acronym,
              country,
            };
          })
          .filter((item: RorSuggestion) => Boolean(item.id && item.name));

        setSuggestions(parsed);
        setOpen(parsed.length > 0);
      } catch (err: unknown) {
        if (!(err instanceof Error && err.name === "AbortError")) {
          // Falha de rede nunca bloqueia texto livre
          setSuggestions([]);
        }
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, rorId]);

  const handleInputChange = (nextVal: string) => {
    // Limpa rorId ao editar manualmente para evitar inconsistência entre nome e identificador
    onChange(nextVal, "");
  };

  const handleSelect = (item: RorSuggestion) => {
    onChange(item.name, item.id);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1 gap-2">
        <label htmlFor={id} className="text-xs font-bold text-slate-700">
          {label}
        </label>
        {rorId && (
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>ROR: {rorId.replace("https://ror.org/", "")}</span>
          </span>
        )}
      </div>

      <div className="relative">
        <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
        />
        {searching && (
          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-3 top-3" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-900 block">
                  {item.name} {item.acronym ? `(${item.acronym})` : ""}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {item.country ? `${item.country} · ` : ""}
                  {item.id}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-slate-400 mt-1">
        Selecione uma instituição oficial do catálogo ROR ou mantenha o texto digitado manualmente.
      </p>
    </div>
  );
}
