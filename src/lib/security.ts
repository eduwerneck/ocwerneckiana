/**
 * Utilitários de segurança: escape HTML, neutralização CSV, base URL e validação de redirect.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);
}

/**
 * Neutraliza injeção de fórmulas em planilhas (Excel/LibreOffice) e aplica escape CSV padrão.
 */
export function escapeCsvCell(input: string | number | null | undefined): string {
  const raw = input === null || input === undefined ? "" : String(input);
  const neutralized = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

/**
 * Retorna a URL base configurada em NEXT_PUBLIC_APP_URL (sem barra final).
 * Em ambiente local ou rotas HTTP confiáveis, aceita fallback opcional.
 */
export function getAppBaseUrl(fallbackOrigin?: string): string {
  const envUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
  if (envUrl && /^https?:\/\/[^/\s]+/i.test(envUrl)) {
    return envUrl.replace(/\/+$/, "");
  }
  if (fallbackOrigin && /^https?:\/\/[^/\s]+/i.test(fallbackOrigin)) {
    return fallbackOrigin.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}

/**
 * Valida caminhos de redirecionamento interno contra Open Redirect.
 * Aceita apenas caminhos relativos iniciados por "/" (e nunca "//" ou "/\").
 */
export function sanitizeNextPath(nextPath: string | null | undefined, fallback: string = "/dashboard/user"): string {
  if (!nextPath) return fallback;
  const trimmed = nextPath.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }
  return trimmed;
}
