export interface ParsedReference {
  raw: string;
  doi?: string;
}

export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function calculateEstimatedPages(wordCount: number, figuresCount: number = 0): { start: number; end: number; total: number } {
  const textPages = Math.ceil(wordCount / 400);
  const figurePages = Math.ceil(figuresCount / 2);
  const total = Math.max(1, textPages + figurePages);
  return { start: 1, end: total, total };
}

export function parseReferences(text: string | null | undefined): ParsedReference[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 8);

  return lines.map((line) => {
    // Buscar DOI na string (ex: 10.1234/... ou https://doi.org/10.1234/...)
    const doiMatch = line.match(/(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/);
    return {
      raw: line,
      doi: doiMatch ? doiMatch[1].replace(/[.,;)]+$/, "") : undefined,
    };
  });
}

function capitalizeSurname(surname: string): string {
  if (!surname) return "";
  return surname
    .toLowerCase()
    .split(/([-'\s])/)
    .map((part) => (part.length > 1 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join("");
}

/**
 * Converte uma referência no formato ABNT (NBR 6023) para o formato APA (7th Edition)
 */
export function convertAbntToApa(ref: string): string {
  let text = ref.trim().replace(/^(\[\d+\]|\d+[\.\)]|\u2022|\-|\*)\s*/, "");
  if (text.length < 10) return text;

  // Se já parecer APA (ano entre parênteses logo no começo), retorna como está
  if (/^[A-Z][a-zA-Z\s.,&]+?\([12]\d{3}[a-z]?\)/.test(text)) {
    return text;
  }

  // 1. Extrair DOI
  let doi: string | undefined;
  const doiMatch = text.match(/(?:DOI:\s*|https?:\/\/doi\.org\/)?(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i);
  if (doiMatch) {
    doi = doiMatch[1].replace(/[.,;)]+$/, "");
    text = text.replace(/(?:DOI:\s*)?(?:https?:\/\/doi\.org\/)?10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+[.,;]?/gi, "").trim();
  }

  // 2. Extrair ano (geralmente próximo ao fim: ", 2019." ou " 2019.")
  let year = "2026";
  const yearMatch = text.match(/[,.\s]\s*([12]\d{3})[a-z]?[.,]?\s*$/i) || text.match(/,\s*([12]\d{3})[a-z]?[.,]/i);
  if (yearMatch) {
    year = yearMatch[1];
    text = text.replace(yearMatch[0], "").trim().replace(/,\s*$/, ".");
  }

  // 3. Separar bloco de autores do título
  // Autores ABNT: SOBRENOME, P. N.; OUTRO, A. Título...
  let authorsFormatted = "Autor";
  let restOfRef = text;

  const abntMatch = text.match(/^((?:[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]{2,},\s*(?:[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]\.\s*)+;\s*)*[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]{2,},\s*(?:[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]\.\s*)+)\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇa-z0-9].*)$/);

  if (abntMatch) {
    const rawAuthors = abntMatch[1].replace(/\.\s*$/, "").trim();
    restOfRef = abntMatch[2].trim();

    const authorList = rawAuthors.split(";").map((a) => a.trim()).filter(Boolean);
    const convertedAuthors = authorList.map((author) => {
      const parts = author.split(",");
      if (parts.length >= 2) {
        const surname = capitalizeSurname(parts[0].trim());
        let initials = parts.slice(1).join(",").trim();
        if (!initials.endsWith(".")) initials += ".";
        return `${surname}, ${initials}`;
      }
      return author;
    });

    if (convertedAuthors.length === 1) {
      authorsFormatted = convertedAuthors[0];
    } else if (convertedAuthors.length === 2) {
      authorsFormatted = `${convertedAuthors[0]}, & ${convertedAuthors[1]}`;
    } else {
      const last = convertedAuthors.pop();
      authorsFormatted = `${convertedAuthors.join(", ")}, & ${last}`;
    }
  } else {
    // Fallback: se não encontrar padrão estrito
    const commaIdx = text.indexOf(",");
    if (commaIdx > 0 && commaIdx < 30) {
      const sur = capitalizeSurname(text.slice(0, commaIdx));
      authorsFormatted = `${sur}, A.`;
      restOfRef = text.slice(commaIdx + 1).trim();
    }
  }

  // Montar em APA: Autores (Ano). Título. Fonte. https://doi.org/...
  restOfRef = restOfRef.replace(/\.+$/, "");
  let apaResult = `${authorsFormatted} (${year}). ${restOfRef}.`;
  if (doi) {
    apaResult += ` https://doi.org/${doi}`;
  }

  return apaResult;
}

/**
 * Converte uma referência no formato APA (7th Edition) para o formato ABNT (NBR 6023)
 */
export function convertApaToAbnt(ref: string): string {
  let text = ref.trim().replace(/^(\[\d+\]|\d+[\.\)]|\u2022|\-|\*)\s*/, "");
  if (text.length < 10) return text;

  // Se já parecer ABNT (sobrenome todo em maiúsculas), retorna como está
  if (/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]{3,}[,\s]/.test(text)) {
    return text;
  }

  // 1. Extrair DOI
  let doi: string | undefined;
  const doiMatch = text.match(/(?:https?:\/\/doi\.org\/)?(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i);
  if (doiMatch) {
    doi = doiMatch[1].replace(/[.,;)]+$/, "");
    text = text.replace(/https?:\/\/doi\.org\/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+[.,;]?/gi, "").trim();
  }

  // 2. Extrair autores e ano usando padrão APA: "Autores (Ano). Título..."
  const apaMatch = text.match(/^(.*?)\s*\(([12]\d{3}[a-z]?)[^)]*\)\.\s*(.*)$/);
  if (!apaMatch) {
    return text.replace(/^([a-zA-ZÀ-ÿ]+),/i, (_, surname) => `${surname.toUpperCase()},`);
  }

  const rawAuthors = apaMatch[1].trim();
  const year = apaMatch[2].trim();
  let restOfRef = apaMatch[3].trim().replace(/\.+$/, "");

  // Separar autores APA
  const authorChunks = rawAuthors
    .split(/(?:,\s*&\s*|,\s*(?=[A-Z][a-zÀ-ÿ]+,\s*[A-Z]\.))/)
    .map((a) => {
      const parts = a.trim().split(",");
      if (parts.length >= 2) {
        const sur = parts[0].trim().toUpperCase();
        const inits = parts.slice(1).join(",").trim();
        return `${sur}, ${inits}`;
      }
      return a.trim().toUpperCase();
    });

  const abntAuthors = authorChunks.length > 0 ? authorChunks.join("; ") : "AUTOR";
  const finalAuthors = abntAuthors.endsWith(".") ? abntAuthors : `${abntAuthors}.`;

  // Montar em ABNT: AUTORES. Título. Fonte, ano. DOI: https://doi.org/...
  let abntResult = `${finalAuthors} ${restOfRef}, ${year}.`;
  if (doi) {
    abntResult += ` DOI: https://doi.org/${doi}.`;
  }

  return abntResult;
}

/**
 * Converte toda a lista de referências (separadas por linha) para o estilo de destino
 */
export function convertReferencesList(text: string | null | undefined, targetStyle: "abnt" | "apa"): string {
  if (!text) return "";
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 8);

  const converted = lines.map((line) => {
    return targetStyle === "apa" ? convertAbntToApa(line) : convertApaToAbnt(line);
  });

  return converted.join("\n\n");
}
