import db from "./db.ts";
import crypto from "node:crypto";
import { escapeHtml, getAppBaseUrl } from "./security.ts";

export interface EmailLog {
  id: number;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  template_type: "revisions_required" | "review_assigned" | "presentation_certificate" | "reviewer_certificate" | "smtp_test";
  content_html: string;
  content_text: string;
  status: "sent_smtp" | "logged_outbox";
  metadata_json?: string;
  created_at: string;
}

export interface AcademicCertificate {
  id: number;
  certificate_code: string;
  user_id: number;
  paper_id?: number;
  sched_conf_id: number;
  type: "presentation" | "reviewer";
  title: string;
  recipient_name: string;
  recipient_email: string;
  description: string;
  verification_url: string;
  issued_at: string;
  conf_title?: string;
  sched_title?: string;
  city?: string;
}

export interface PublicSmtpSettings {
  host: string;
  port: number;
  user: string;
  from: string;
  hasPass: boolean;
}

function getInternalSmtpSettings(): PublicSmtpSettings & { pass: string } {
  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || "").trim();
  const from = (process.env.SMTP_FROM || (user ? `"Open Conference Werneckiana" <${user}>` : "Open Conference Werneckiana <no-reply@example.org>")).trim();
  const pass = (process.env.SMTP_PASS || "").trim();

  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    user,
    from,
    hasPass: pass.length > 0,
    pass,
  };
}

/**
 * Retorna apenas metadados públicos de configuração SMTP (nunca expõe SMTP_PASS).
 * Configuração SMTP é exclusivamente via variáveis de ambiente.
 */
export function getPublicSmtpSettings(): PublicSmtpSettings {
  const cfg = getInternalSmtpSettings();
  return {
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    from: cfg.from,
    hasPass: cfg.hasPass,
  };
}

async function getMailTransporter() {
  const cfg = getInternalSmtpSettings();

  if (cfg.host && cfg.user && cfg.pass) {
    const nodemailer = await import("nodemailer");
    return nodemailer.default.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });
  }
  return null;
}

async function dispatchEmail(options: {
  to: string;
  recipientName: string;
  subject: string;
  templateType: EmailLog["template_type"];
  html: string;
  text: string;
  metadata?: Record<string, unknown>;
}): Promise<{ status: "sent_smtp" | "logged_outbox"; error?: string }> {
  let status: "sent_smtp" | "logged_outbox" = "logged_outbox";
  let errorMessage: string | undefined;

  const cfg = getInternalSmtpSettings();
  const transporter = await getMailTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: cfg.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      status = "sent_smtp";
    } catch (err: unknown) {
      console.warn("Falha no envio SMTP real, salvando na Caixa de Saída (Outbox):", err);
      errorMessage = err instanceof Error ? err.message : String(err);
      status = "logged_outbox";
    }
  }

  try {
    const meta = {
      ...(options.metadata || {}),
      error: errorMessage,
      smtp_configured: Boolean(transporter),
      smtp_user: cfg.user,
    };

    db.prepare(`
      INSERT INTO email_logs (recipient_email, recipient_name, subject, template_type, content_html, content_text, status, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      options.to,
      options.recipientName,
      options.subject,
      options.templateType,
      options.html,
      options.text,
      status,
      JSON.stringify(meta)
    );
  } catch (dbErr) {
    console.error("Erro ao registrar log de e-mail:", dbErr);
  }

  return { status, error: errorMessage };
}

function extractYear(dateStr?: string | null): string {
  const match = String(dateStr || "").match(/\b(20\d{2})\b/);
  return match ? match[1] : String(new Date().getFullYear());
}

// -------------------------------------------------------------
// Templates & Disparadores do Fluxo Acadêmico (HTML escapado)
// -------------------------------------------------------------

function getEmailHeader(title: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding: 24px 32px; color: #ffffff;">
        <span style="background: #3b82f6; color: #ffffff; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px;">OCW • Open Conference Werneckiana</span>
        <h1 style="margin: 10px 0 2px 0; font-size: 20px; font-weight: 800; color: #ffffff;">Open Conference Werneckiana</h1>
        <p style="margin: 0; font-size: 12px; color: #93c5fd;">Secretaria Científica &amp; Coordenação Editorial</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">${escapeHtml(title)}</h2>
  `;
}

function getEmailFooter() {
  return `
        <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6;">
          <p style="margin: 0 0 6px 0;"><strong>Open Conference Werneckiana (OCW)</strong> — Sistema de Gestão de Conferências Científicas.</p>
        </div>
      </div>
    </div>
  `;
}

// 1. Notificar autor quando o trabalho requer ajustes
export async function sendRevisionRequiredEmail(paperId: number, editorComments: string) {
  const paper = db.prepare(`
    SELECT p.*, sc.title as sched_title, sc.slug as sched_slug, c.title as conf_title,
           u.full_name as author_name, u.email as author_email
    FROM papers p
    JOIN sched_confs sc ON sc.id = p.sched_conf_id
    JOIN conferences c ON c.id = sc.conference_id
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
  `).get(paperId) as Record<string, string | number | null> | undefined;

  if (!paper) return;

  const authors = db.prepare("SELECT * FROM paper_authors WHERE paper_id = ? ORDER BY seq ASC").all(paperId) as Array<Record<string, string>>;
  const targetEmail = String(paper.author_email || authors[0]?.email || "");
  const targetName = String(paper.author_name || authors[0]?.full_name || "Prezado(a) Autor(a)");
  if (!targetEmail) return;

  const baseUrl = getAppBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard/user`;
  const schedTitle = String(paper.sched_title || "");
  const paperTitle = String(paper.title || "");
  const comments = editorComments || "Favor revisar o manuscrito considerando as considerações dos pareceristas na plataforma.";

  const subject = `[OCW - ${schedTitle}] Decisão Editorial: Revisões Requeridas no Trabalho #${paper.id}`;

  const html = `
    ${getEmailHeader("Decisão Editorial: Revisões Requeridas")}
    <p style="font-size: 13px; color: #334155; line-height: 1.6;">Prezado(a) <strong>${escapeHtml(targetName)}</strong>,</p>
    <p style="font-size: 13px; color: #334155; line-height: 1.6;">
      Informamos que a avaliação por pares duplo-cega referente à submissão do trabalho <strong>"#${escapeHtml(paper.id)} - ${escapeHtml(paperTitle)}"</strong> no evento <strong>${escapeHtml(schedTitle)}</strong> foi concluída pelo Comitê Científico.
    </p>
    <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase;">Parecer Editorial &amp; Orientações de Ajuste:</h3>
      <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(comments)}</p>
    </div>
    <p style="font-size: 13px; color: #334155; line-height: 1.6;">
      Para submeter a versão corrigida com a respectiva Carta de Resposta aos Avaliadores, acesse o seu painel acadêmico no sistema.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${escapeHtml(dashboardUrl)}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block;">Acessar Meu Painel e Enviar Revisão</a>
    </div>
    ${getEmailFooter()}
  `;

  const text = `Prezado(a) ${targetName},\n\nA submissão #${paper.id} - ${paperTitle} requer ajustes no evento ${schedTitle}.\nParecer: ${comments}\n\nAcesse seu painel para reenviar: ${dashboardUrl}`;

  return await dispatchEmail({
    to: targetEmail,
    recipientName: targetName,
    subject,
    templateType: "revisions_required",
    html,
    text,
    metadata: { paperId, schedTitle },
  });
}

// 2. Notificar avaliador quando o trabalho estiver disponível para avaliação
export async function sendReviewerAssignedEmail(paperId: number, reviewerId: number) {
  const paper = db.prepare(`
    SELECT p.*, sc.title as sched_title, t.title as track_title
    FROM papers p
    JOIN sched_confs sc ON sc.id = p.sched_conf_id
    JOIN tracks t ON t.id = p.track_id
    WHERE p.id = ?
  `).get(paperId) as Record<string, string | number | null> | undefined;

  const reviewer = db.prepare("SELECT id, full_name, email FROM users WHERE id = ?").get(reviewerId) as { id: number; full_name: string; email: string } | undefined;

  if (!paper || !reviewer) return;

  const baseUrl = getAppBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard/user`;
  const schedTitle = String(paper.sched_title || "");
  const trackTitle = String(paper.track_title || "");
  const paperTitle = String(paper.title || "");
  const paperAbstract = String(paper.abstract || "");
  const paperKeywords = String(paper.keywords || "Não informadas");

  const subject = `[OCW - ${schedTitle}] Convite para Avaliação de Manuscrito Duplo-Cego: #${paper.id}`;

  const html = `
    ${getEmailHeader("Convite para Avaliação Científica por Pares")}
    <p style="font-size: 13px; color: #334155; line-height: 1.6;">Prezado(a) <strong>${escapeHtml(reviewer.full_name)}</strong>,</p>
    <p style="font-size: 13px; color: #334155; line-height: 1.6;">
      Convidamos você para atuar como Parecerista Ad-hoc na avaliação do manuscrito acadêmico abaixo:
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; margin-bottom: 4px;">${escapeHtml(trackTitle)}</div>
      <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #0f172a;">${escapeHtml(paperTitle)}</h3>
      <p style="margin: 0 0 10px 0; font-size: 12px; color: #475569; line-height: 1.5;"><strong>Resumo Anônimo:</strong> ${escapeHtml(paperAbstract)}</p>
      <div style="font-size: 11px; color: #64748b;"><strong>Palavras-chave:</strong> ${escapeHtml(paperKeywords)}</div>
    </div>
    <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
      <em>Observação Ética:</em> Este processo é duplo-cego. Os dados de autoria foram omitidos. Ao concluir sua avaliação, o sistema emitirá sua <strong>Declaração Oficial de Parecerista Ad-hoc</strong>.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${escapeHtml(dashboardUrl)}" style="background: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block;">Acessar Tarefa e Realizar Parecer</a>
    </div>
    ${getEmailFooter()}
  `;

  const text = `Prezado(a) ${reviewer.full_name},\n\nVocê foi designado para avaliar o trabalho #${paper.id} - ${paperTitle} na trilha ${trackTitle}.\nAcesse para preencher o parecer: ${dashboardUrl}`;

  return await dispatchEmail({
    to: reviewer.email,
    recipientName: reviewer.full_name,
    subject,
    templateType: "review_assigned",
    html,
    text,
    metadata: { paperId, reviewerId, trackTitle },
  });
}

// 3. Emitir e enviar por e-mail a declaração de apresentação (idempotente)
export async function sendPresentationCertificateEmail(paperId: number) {
  const paper = db.prepare(`
    SELECT p.*, sc.title as sched_title, sc.location, sc.city, sc.start_date, c.title as conf_title,
           u.full_name as user_name, u.email as user_email
    FROM papers p
    JOIN sched_confs sc ON sc.id = p.sched_conf_id
    JOIN conferences c ON c.id = sc.conference_id
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
  `).get(paperId) as Record<string, string | number | null> | undefined;

  if (!paper) return;

  const authors = db.prepare("SELECT * FROM paper_authors WHERE paper_id = ? ORDER BY seq ASC").all(paperId) as Array<Record<string, string>>;
  const allAuthorNames = authors.length > 0 ? authors.map((a) => a.full_name).join(", ") : String(paper.user_name || "");
  const primaryEmail = String(paper.user_email || authors[0]?.email || "");
  const primaryName = String(paper.user_name || authors[0]?.full_name || "");
  if (!primaryEmail) return;

  // Idempotência: reutilizar declaração já emitida para o mesmo artigo/usuário
  const existingCert = db.prepare(`
    SELECT certificate_code, title, description, verification_url
    FROM certificates
    WHERE user_id = ? AND paper_id = ? AND sched_conf_id = ? AND type = 'presentation'
    LIMIT 1
  `).get(paper.user_id, paper.id, paper.sched_conf_id) as { certificate_code: string; title: string; description: string; verification_url: string } | undefined;

  let certCode: string;
  let certTitle: string;
  let certDescription: string;
  let verificationUrl: string;

  if (existingCert) {
    certCode = existingCert.certificate_code;
    certTitle = existingCert.title;
    certDescription = existingCert.description;
    verificationUrl = existingCert.verification_url;
  } else {
    const year = extractYear(paper.start_date as string | null);
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    certCode = `OCW-${year}-PRES-${paper.id}-${randomSuffix}`;
    verificationUrl = `/certificate/${certCode}`;
    certTitle = "Declaração de Apresentação de Trabalho";
    certDescription = `Certificamos que o trabalho intitulado '${paper.title}', de autoria de ${allAuthorNames}, foi apresentado na modalidade ${paper.presentation_type === "poster" ? "Pôster" : "Comunicação Oral"} durante o evento ${paper.sched_title}, realizado em ${paper.city || paper.location || "Brasil"}.`;

    db.prepare(`
      INSERT INTO certificates (certificate_code, user_id, paper_id, sched_conf_id, type, title, recipient_name, recipient_email, description, verification_url)
      VALUES (?, ?, ?, ?, 'presentation', ?, ?, ?, ?, ?)
    `).run(
      certCode,
      paper.user_id,
      paper.id,
      paper.sched_conf_id,
      certTitle,
      allAuthorNames,
      primaryEmail,
      certDescription,
      verificationUrl
    );
  }

  const baseUrl = getAppBaseUrl();
  const fullCertUrl = `${baseUrl}${verificationUrl}`;
  const schedTitle = String(paper.sched_title || "");
  const subject = `[OCW - ${schedTitle}] Declaração de Apresentação de Trabalho: #${paper.id}`;

  const html = `
    ${getEmailHeader("Declaração de Apresentação Emitida")}
    <p style="font-size: 13px; color: #334155; line-height: 1.6;">Prezado(a)s autore(a)s <strong>${escapeHtml(allAuthorNames)}</strong>,</p>
    <p style="font-size: 13px; color: #334155; line-height: 1.6;">
      Informamos que a declaração de apresentação do trabalho no evento <strong>${escapeHtml(schedTitle)}</strong> foi emitida e está disponível para consulta e comprovação.
    </p>
    <div style="background: #f0fdf4; border: 2px dashed #bbf7d0; border-radius: 14px; padding: 24px; margin: 20px 0; text-align: center;">
      <span style="background: #16a34a; color: #ffffff; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 4px; text-transform: uppercase;">Declaração Emitida</span>
      <h3 style="margin: 12px 0 6px 0; font-size: 16px; font-weight: 800; color: #14532d;">${escapeHtml(certTitle)}</h3>
      <p style="margin: 0 0 16px 0; font-size: 12px; color: #166534; line-height: 1.5;">${escapeHtml(certDescription)}</p>
      <div style="background: #ffffff; border: 1px solid #dcfce7; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #15803d; font-weight: 700;">
        Código de Autenticidade: ${escapeHtml(certCode)}
      </div>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${escapeHtml(fullCertUrl)}" style="background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block;">Visualizar e Imprimir Declaração</a>
    </div>
    ${getEmailFooter()}
  `;

  const text = `Prezado(a) ${primaryName},\n\nSua declaração de apresentação do trabalho #${paper.id} - ${paper.title} está pronta.\nCódigo de Autenticidade: ${certCode}\nAcesse: ${fullCertUrl}`;

  return await dispatchEmail({
    to: primaryEmail,
    recipientName: primaryName,
    subject,
    templateType: "presentation_certificate",
    html,
    text,
    metadata: { paperId, certCode },
  });
}

// 4. Emitir e enviar declaração de parecerista ad-hoc (idempotente)
export async function sendReviewerCertificateEmail(assignmentId: number) {
  const assignment = db.prepare(`
    SELECT r.*, p.title as paper_title, p.sched_conf_id, sc.title as sched_title, sc.location, sc.city, sc.start_date,
           t.title as track_title, u.full_name as reviewer_name, u.email as reviewer_email, u.affiliation
    FROM review_assignments r
    JOIN papers p ON p.id = r.paper_id
    JOIN tracks t ON t.id = p.track_id
    JOIN sched_confs sc ON sc.id = p.sched_conf_id
    JOIN users u ON u.id = r.reviewer_id
    WHERE r.id = ?
  `).get(assignmentId) as Record<string, string | number | null> | undefined;

  if (!assignment) return;

  const existingCert = db.prepare(`
    SELECT certificate_code, title, description, verification_url
    FROM certificates
    WHERE user_id = ? AND paper_id = ? AND sched_conf_id = ? AND type = 'reviewer'
    LIMIT 1
  `).get(assignment.reviewer_id, assignment.paper_id, assignment.sched_conf_id) as { certificate_code: string; title: string; description: string; verification_url: string } | undefined;

  let certCode: string;
  let certTitle: string;
  let certDescription: string;
  let verificationUrl: string;

  if (existingCert) {
    certCode = existingCert.certificate_code;
    certTitle = existingCert.title;
    certDescription = existingCert.description;
    verificationUrl = existingCert.verification_url;
  } else {
    const year = extractYear(assignment.start_date as string | null);
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    certCode = `OCW-${year}-REV-${assignment.reviewer_id}-${randomSuffix}`;
    verificationUrl = `/certificate/${certCode}`;
    certTitle = "Declaração de Atuação como Parecerista Ad-hoc";
    certDescription = `Certificamos que ${assignment.reviewer_name} (${assignment.affiliation || "Instituição"}) atuou como parecerista ad-hoc no ${assignment.sched_title}, tendo avaliado o trabalho submetido à ${assignment.track_title} sob o método duplo-cego (double-blind review).`;

    db.prepare(`
      INSERT INTO certificates (certificate_code, user_id, paper_id, sched_conf_id, type, title, recipient_name, recipient_email, description, verification_url)
      VALUES (?, ?, ?, ?, 'reviewer', ?, ?, ?, ?, ?)
    `).run(
      certCode,
      assignment.reviewer_id,
      assignment.paper_id,
      assignment.sched_conf_id,
      certTitle,
      assignment.reviewer_name,
      assignment.reviewer_email,
      certDescription,
      verificationUrl
    );
  }

  const baseUrl = getAppBaseUrl();
  const fullCertUrl = `${baseUrl}${verificationUrl}`;
  const schedTitle = String(assignment.sched_title || "");
  const reviewerName = String(assignment.reviewer_name || "");
  const reviewerEmail = String(assignment.reviewer_email || "");

  const subject = `[OCW - ${schedTitle}] Declaração de Parecerista Ad-hoc Emitida`;

  const html = `
    ${getEmailHeader("Declaração de Parecerista Emitida")}
    <p style="font-size: 13px; color: #334155; line-height: 1.6;">Prezado(a) <strong>${escapeHtml(reviewerName)}</strong>,</p>
    <p style="font-size: 13px; color: #334155; line-height: 1.6;">
      Agradecemos a sua colaboração na avaliação por pares do evento <strong>${escapeHtml(schedTitle)}</strong>. A sua declaração oficial foi emitida e está disponível para consulta.
    </p>
    <div style="background: #faf5ff; border: 2px dashed #e9d5ff; border-radius: 14px; padding: 24px; margin: 20px 0; text-align: center;">
      <span style="background: #9333ea; color: #ffffff; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 4px; text-transform: uppercase;">Declaração Emitida</span>
      <h3 style="margin: 12px 0 6px 0; font-size: 16px; font-weight: 800; color: #581c87;">${escapeHtml(certTitle)}</h3>
      <p style="margin: 0 0 16px 0; font-size: 12px; color: #6b21a8; line-height: 1.5;">${escapeHtml(certDescription)}</p>
      <div style="background: #ffffff; border: 1px solid #f3e8ff; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #7e22ce; font-weight: 700;">
        Código de Autenticidade: ${escapeHtml(certCode)}
      </div>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${escapeHtml(fullCertUrl)}" style="background: #7e22ce; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block;">Visualizar e Imprimir Declaração</a>
    </div>
    ${getEmailFooter()}
  `;

  const text = `Prezado(a) ${reviewerName},\n\nSua declaração de parecerista do evento ${schedTitle} está disponível.\nCódigo de Autenticidade: ${certCode}\nAcesse: ${fullCertUrl}`;

  return await dispatchEmail({
    to: reviewerEmail,
    recipientName: reviewerName,
    subject,
    templateType: "reviewer_certificate",
    html,
    text,
    metadata: { assignmentId, certCode },
  });
}

// 5. Testar conexão SMTP
export async function testSmtpConnection(targetEmail: string) {
  const subject = "[OCW] Teste de Conexão SMTP e Caixa de Notificações";
  const html = `
    ${getEmailHeader("Teste de Conectividade de E-mail")}
    <p style="font-size: 13px; color: #334155; line-height: 1.6;">
      Este é um e-mail de teste disparado pelo painel administrativo do <strong>Open Conference Werneckiana (OCW)</strong>.
    </p>
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 12px; color: #1e40af;">
      <strong>Status:</strong> O motor de envio do OCW está operante e conectado ao banco de dados relacional.
    </div>
    ${getEmailFooter()}
  `;
  const text = "Este é um e-mail de teste disparado pelo sistema OCW.";

  return await dispatchEmail({
    to: targetEmail,
    recipientName: "Administrador / Testador",
    subject,
    templateType: "smtp_test",
    html,
    text,
    metadata: { test: true },
  });
}

function toPlain<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}

// 6. Consultas para o painel administrativo e de usuário
export function getEmailLogs(limit: number = 50): EmailLog[] {
  const rows = db.prepare("SELECT * FROM email_logs ORDER BY created_at DESC LIMIT ?").all(limit);
  return toPlain(rows as unknown as EmailLog[]);
}

export function getCertificatesForUser(userId: number): AcademicCertificate[] {
  const rows = db.prepare(`
    SELECT c.*, sc.title as sched_title, sc.city
    FROM certificates c
    JOIN sched_confs sc ON sc.id = c.sched_conf_id
    WHERE c.user_id = ?
    ORDER BY c.issued_at DESC
  `).all(userId);
  return toPlain(rows as unknown as AcademicCertificate[]);
}

export function getCertificateByCode(code: string): AcademicCertificate | null {
  const cert = db.prepare(`
    SELECT c.*, sc.title as sched_title, sc.city, cf.title as conf_title
    FROM certificates c
    JOIN sched_confs sc ON sc.id = c.sched_conf_id
    JOIN conferences cf ON cf.id = sc.conference_id
    WHERE c.certificate_code = ?
  `).get(code);

  return toPlain((cert || null) as unknown as AcademicCertificate | null);
}
