/**
 * Formatadores determinísticos de data/hora com fuso fixo para evitar mismatch de hidratação SSR/CSR.
 */

const BR_DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const BR_DATETIME_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatDatePtBr(input?: string | Date | null): string {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return BR_DATE_FMT.format(d);
}

export function formatDateTimePtBr(input?: string | Date | null): string {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return BR_DATETIME_FMT.format(d);
}
