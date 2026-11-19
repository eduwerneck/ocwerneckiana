"use server";

import { revalidatePath } from "next/cache";
import {
  createPaper,
  assignReviewer,
  submitReview,
  submitAuthorRevision,
  recordEditorialDecision,
  markPaperPresented,
  registerAttendee,
  createConference,
  updateUserRole,
  getSuggestedReviewersForPaper,
  autoAssignBestReviewersForPaper,
  updateUserReviewerProfile,
  getPaperOwnerId,
  getReviewAssignmentOwner,
} from "@/lib/ocs-service";
import { testSmtpConnection } from "@/lib/email-service";
import { ADMIN_ROLES, requireActionAuth } from "@/lib/auth";
import {
  isValidDecision,
  isValidEmail,
  isValidPresentationType,
  isValidRefStyle,
  isValidRole,
  isValidSlug,
  parseBoundedInt,
  parseNonEmptyString,
  parseOptionalString,
  parsePositiveInt,
} from "@/lib/validation";

// 1. Autor envia versão revisada (requer autenticação + ser dono do artigo ou admin)
export async function submitAuthorRevisionAction(formData: FormData) {
  const auth = await requireActionAuth();
  if (!auth.ok) return { success: false, error: auth.error };

  const paper_id = parsePositiveInt(formData.get("paper_id"));
  const revised_file_name = parseOptionalString(formData.get("revised_file_name"), 255) || "manuscrito_revisao.pdf";
  const author_response = parseNonEmptyString(formData.get("author_response"), 15000);

  if (!paper_id || !author_response) {
    return { success: false, error: "Informe o trabalho e preencha a resposta aos pareceristas." };
  }

  const ownerId = getPaperOwnerId(paper_id);
  if (!ownerId) {
    return { success: false, error: "Trabalho não encontrado." };
  }
  if (ownerId !== auth.user.id && !ADMIN_ROLES.includes(auth.user.role)) {
    return { success: false, error: "Acesso negado: apenas o autor responsável pode enviar revisão." };
  }

  try {
    submitAuthorRevision({
      paper_id,
      revised_file_name,
      author_response,
    });
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao enviar revisão." };
  }

  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/author");
  revalidatePath("/dashboard/reviewer");
  revalidatePath("/dashboard/director");
  return { success: true };
}

// 2. Autor submete novo artigo (requer autenticação; user_id sempre vem da sessão)
export async function submitPaperAction(formData: FormData) {
  const auth = await requireActionAuth();
  if (!auth.ok) return { success: false, error: auth.error };

  const sched_conf_id = parsePositiveInt(formData.get("sched_conf_id"));
  const track_id = parsePositiveInt(formData.get("track_id"));
  const title = parseNonEmptyString(formData.get("title"), 400);
  const abstract = parseNonEmptyString(formData.get("abstract"), 5000);
  const keywords = parseOptionalString(formData.get("keywords"), 500);
  const rawPresType = parseOptionalString(formData.get("presentation_type"), 32) || "oral";
  const presentation_type = isValidPresentationType(rawPresType) ? rawPresType : "oral";
  const comments_to_director = parseOptionalString(formData.get("comments_to_director"), 4000);
  const file_name = parseOptionalString(formData.get("file_name"), 255) || "manuscrito_submissao.pdf";
  const funding = parseOptionalString(formData.get("funding"), 1000);

  if (!sched_conf_id || !track_id || !title || !abstract) {
    return { success: false, error: "Preencha conferência, trilha, título e resumo obrigatórios." };
  }

  const author_names = formData.getAll("author_name").map((v) => String(v || "").trim());
  const author_emails = formData.getAll("author_email").map((v) => String(v || "").trim());
  const author_affiliations = formData.getAll("author_affiliation").map((v) => String(v || "").trim());
  const author_orcids = formData.getAll("author_orcid").map((v) => String(v || "").trim());
  const author_rors = formData.getAll("author_ror").map((v) => String(v || "").trim());
  const author_credits = formData.getAll("author_credit").map((v) => String(v || "").trim());

  const authors = author_names
    .map((name, i) => ({
      full_name: name,
      email: author_emails[i] || "",
      affiliation: author_affiliations[i] || "",
      orcid: author_orcids[i] || "",
      ror_id: author_rors[i] || "",
      credit_roles: author_credits[i] || "",
      is_primary: i === 0,
    }))
    .filter((a) => a.full_name.length > 0);

  if (authors.length === 0) {
    authors.push({
      full_name: auth.user.full_name,
      email: auth.user.email,
      affiliation: auth.user.affiliation || "",
      orcid: "",
      ror_id: "",
      credit_roles: "Conceitualização, Metodologia, Escrita – rascunho original",
      is_primary: true,
    });
  }

  const references_text = parseOptionalString(formData.get("references_text"), 30000);
  const rawRefStyle = parseOptionalString(formData.get("references_style"), 16) || "abnt";
  const references_style = isValidRefStyle(rawRefStyle) ? rawRefStyle : "abnt";

  const section_intro = parseOptionalString(formData.get("section_intro"), 20000);
  const section_methods = parseOptionalString(formData.get("section_methods"), 20000);
  const section_results = parseOptionalString(formData.get("section_results"), 20000);
  const section_conclusion = parseOptionalString(formData.get("section_conclusion"), 20000);
  const figures_json = parseOptionalString(formData.get("figures_json"), 20000) || "[]";
  const page_start = parseBoundedInt(formData.get("page_start"), 1, 9999, 1) ?? 1;
  const page_end = parseBoundedInt(formData.get("page_end"), page_start, 9999, Math.max(page_start, 5)) ?? Math.max(page_start, 5);

  const paperId = createPaper({
    sched_conf_id,
    track_id,
    user_id: auth.user.id,
    title,
    abstract,
    keywords,
    presentation_type,
    funding,
    file_name,
    file_size: 0,
    comments_to_director,
    references_text,
    references_style,
    section_intro,
    section_methods,
    section_results,
    section_conclusion,
    figures_json,
    page_start,
    page_end,
    authors,
  });

  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/author");
  revalidatePath("/dashboard/director");
  return { success: true, paperId };
}

// 3. Diretor designa parecerista (restrito a ADMIN_ROLES)
export async function assignReviewerAction(formData: FormData) {
  const auth = await requireActionAuth(ADMIN_ROLES);
  if (!auth.ok) return { success: false, error: auth.error };

  const paper_id = parsePositiveInt(formData.get("paper_id"));
  const reviewer_id = parsePositiveInt(formData.get("reviewer_id"));

  if (!paper_id || !reviewer_id) {
    return { success: false, error: "Parâmetros inválidos." };
  }

  try {
    assignReviewer(paper_id, reviewer_id);
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao designar avaliador." };
  }
  revalidatePath("/dashboard/director");
  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/reviewer");
  return { success: true };
}

// 4. Parecerista envia avaliação (requer autenticação + ser o parecerista designado)
export async function submitReviewAction(formData: FormData) {
  const auth = await requireActionAuth();
  if (!auth.ok) return { success: false, error: auth.error };

  const assignment_id = parsePositiveInt(formData.get("assignment_id"));
  const rawRec = parseOptionalString(formData.get("recommendation"), 32);
  const score_originality = parseBoundedInt(formData.get("score_originality"), 1, 5, 4);
  const score_methodology = parseBoundedInt(formData.get("score_methodology"), 1, 5, 4);
  const score_clarity = parseBoundedInt(formData.get("score_clarity"), 1, 5, 4);
  const score_relevance = parseBoundedInt(formData.get("score_relevance"), 1, 5, 4);
  const comments_author = parseOptionalString(formData.get("comments_author"), 15000);
  const comments_director = parseOptionalString(formData.get("comments_director"), 15000);

  if (!assignment_id || !isValidDecision(rawRec) || !score_originality || !score_methodology || !score_clarity || !score_relevance) {
    return { success: false, error: "Dados de parecer inválidos." };
  }

  const assignment = getReviewAssignmentOwner(assignment_id);
  if (!assignment) {
    return { success: false, error: "Atribuição de parecer não encontrada." };
  }
  if (assignment.reviewer_id !== auth.user.id && !ADMIN_ROLES.includes(auth.user.role)) {
    return { success: false, error: "Acesso negado: você não está designado para este parecer." };
  }
  if (assignment.status === "completed") {
    return { success: false, error: "Este parecer já foi concluído." };
  }

  try {
    submitReview({
      assignment_id,
      recommendation: rawRec,
      score_originality,
      score_methodology,
      score_clarity,
      score_relevance,
      comments_author,
      comments_director,
    });
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao enviar parecer." };
  }

  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/reviewer");
  revalidatePath("/dashboard/director");
  return { success: true };
}

// 5. Diretor registra decisão editorial (restrito a ADMIN_ROLES; director_id vem da sessão)
export async function recordDecisionAction(formData: FormData) {
  const auth = await requireActionAuth(ADMIN_ROLES);
  if (!auth.ok) return { success: false, error: auth.error };

  const paper_id = parsePositiveInt(formData.get("paper_id"));
  const rawDecision = parseOptionalString(formData.get("decision"), 32);
  const comments = parseOptionalString(formData.get("comments"), 10000);
  const publish_proceedings = formData.get("publish_proceedings") === "true";
  const confirm_presented = formData.get("confirm_presented") === "true";

  if (!paper_id || !isValidDecision(rawDecision)) {
    return { success: false, error: "Parâmetros de decisão inválidos." };
  }

  recordEditorialDecision({
    paper_id,
    director_id: auth.user.id,
    decision: rawDecision,
    comments,
    publish_proceedings,
    confirm_presented,
  });

  revalidatePath("/dashboard/director");
  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/author");
  revalidatePath("/proceedings");
  return { success: true };
}

// 6. Diretor atesta apresentação (restrito a ADMIN_ROLES)
export async function markPaperPresentedAction(formData: FormData) {
  const auth = await requireActionAuth(ADMIN_ROLES);
  if (!auth.ok) return { success: false, error: auth.error };

  const paper_id = parsePositiveInt(formData.get("paper_id"));
  const is_presented = formData.get("is_presented") === "true";

  if (!paper_id) {
    return { success: false, error: "ID de trabalho inválido." };
  }

  markPaperPresented(paper_id, is_presented, auth.user.full_name);

  revalidatePath("/dashboard/director");
  revalidatePath("/schedule");
  revalidatePath("/proceedings");
  return { success: true };
}

// 7. Inscrição pública de participante em conferência (PÚBLICA — nunca cria/altera tabela users!)
export async function registerAttendeeAction(formData: FormData) {
  const sched_conf_id = parsePositiveInt(formData.get("sched_conf_id"));
  const full_name = parseNonEmptyString(formData.get("full_name"), 150);
  const email = parseNonEmptyString(formData.get("email"), 254)?.toLowerCase();
  const affiliation = parseOptionalString(formData.get("affiliation"), 200);
  const category = parseNonEmptyString(formData.get("category"), 100) || "Profissional";

  if (!sched_conf_id || !full_name || !email || !isValidEmail(email)) {
    return { success: false, error: "Preencha nome completo, e-mail válido e conferência." };
  }

  registerAttendee({
    sched_conf_id,
    full_name,
    email,
    affiliation,
    category,
  });

  revalidatePath("/register");
  revalidatePath("/dashboard/director");
  return { success: true };
}

// 8. Diretor cria nova conferência (restrito a ADMIN_ROLES)
export async function createConferenceAction(formData: FormData) {
  const auth = await requireActionAuth(ADMIN_ROLES);
  if (!auth.ok) return { success: false, error: auth.error };

  const title = parseNonEmptyString(formData.get("title"), 250);
  const rawSlug = parseOptionalString(formData.get("slug"), 64).toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const acronym = parseOptionalString(formData.get("acronym"), 40);
  const city = parseOptionalString(formData.get("city"), 120);
  const location = parseOptionalString(formData.get("location"), 200) || city;
  const start_date = parseOptionalString(formData.get("start_date"), 20) || "2026-11-10";
  const end_date = parseOptionalString(formData.get("end_date"), 20) || "2026-11-13";
  const cfp_deadline = parseOptionalString(formData.get("cfp_deadline"), 20) || "2026-08-30";
  const review_deadline = parseOptionalString(formData.get("review_deadline"), 20) || "2026-09-30";
  const results_date = parseOptionalString(formData.get("results_date"), 20) || "2026-10-15";
  const proceedings_doi = parseOptionalString(formData.get("proceedings_doi"), 120);
  const isbn = parseOptionalString(formData.get("isbn"), 40);
  const description = parseOptionalString(formData.get("description"), 5000);

  if (!title || !rawSlug || !isValidSlug(rawSlug)) {
    return { success: false, error: "Título e identificador (slug válido com letras/números) são obrigatórios." };
  }

  try {
    const result = createConference({
      title,
      acronym: acronym || rawSlug.toUpperCase(),
      slug: rawSlug,
      city,
      location,
      start_date,
      end_date,
      cfp_deadline,
      review_deadline,
      results_date,
      proceedings_doi,
      isbn,
      description,
    });

    revalidatePath("/");
    revalidatePath("/proceedings");
    revalidatePath("/dashboard/director");
    return { success: true, result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("UNIQUE")) {
      return { success: false, error: "Já existe uma conferência cadastrada com este slug." };
    }
    return { success: false, error: "Não foi possível cadastrar a conferência." };
  }
}

// 9. Diretor altera papel de usuário (restrito a ADMIN_ROLES; revoga sessões do usuário)
export async function updateUserRoleAction(formData: FormData) {
  const auth = await requireActionAuth(ADMIN_ROLES);
  if (!auth.ok) return { success: false, error: auth.error };

  const userId = parsePositiveInt(formData.get("user_id"));
  const role = parseOptionalString(formData.get("role"), 32);

  if (!userId || !isValidRole(role)) {
    return { success: false, error: "Usuário e papel válido são obrigatórios." };
  }

  updateUserRole(userId, role);

  revalidatePath("/dashboard/director");
  revalidatePath("/dashboard/user");
  return { success: true };
}

// 10. Sugestão de avaliadores por afinidade (restrito a ADMIN_ROLES)
export async function getSuggestedReviewersAction(paperId: number) {
  const auth = await requireActionAuth(ADMIN_ROLES);
  if (!auth.ok) return { success: false, error: auth.error };

  const validId = parsePositiveInt(paperId);
  if (!validId) {
    return { success: false, error: "ID de trabalho inválido." };
  }

  try {
    const matches = getSuggestedReviewersForPaper(validId);
    return { success: true, matches };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao calcular matching de avaliadores." };
  }
}

// 11. Atribuição automática de pareceristas (restrito a ADMIN_ROLES)
export async function autoAssignReviewersAction(formData: FormData) {
  const auth = await requireActionAuth(ADMIN_ROLES);
  if (!auth.ok) return { success: false, error: auth.error };

  const paper_id = parsePositiveInt(formData.get("paper_id"));
  const count = parseBoundedInt(formData.get("count"), 1, 5, 2) ?? 2;

  if (!paper_id) {
    return { success: false, error: "ID do trabalho não informado." };
  }

  try {
    const assigned = autoAssignBestReviewersForPaper(paper_id, count);
    revalidatePath("/dashboard/director");
    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/reviewer");
    return { success: true, assigned };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Erro na atribuição automática." };
  }
}

// 12. Teste de conexão SMTP (restrito a ADMIN_ROLES)
export async function testSmtpConnectionAction(formData: FormData) {
  const auth = await requireActionAuth(ADMIN_ROLES);
  if (!auth.ok) return { success: false, error: auth.error };

  const targetEmail = parseNonEmptyString(formData.get("email"), 254);
  if (!targetEmail || !isValidEmail(targetEmail)) {
    return { success: false, error: "Informe um e-mail de destino válido para o teste." };
  }

  try {
    const result = await testSmtpConnection(targetEmail);
    revalidatePath("/dashboard/director");
    return { success: true, status: result.status, error: result.error };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Falha ao testar SMTP." };
  }
}

// 13. Usuário atualiza próprio perfil de parecerista (usa sessionUser.id — sem IDOR)
export async function updateUserReviewerProfileAction(formData: FormData) {
  const auth = await requireActionAuth();
  if (!auth.ok) return { success: false, error: auth.error };

  const is_reviewer_candidate = formData.get("is_reviewer_candidate") === "true";
  const review_interests = parseOptionalString(formData.get("review_interests"), 1000);
  const preferred_track_ids = parseOptionalString(formData.get("preferred_track_ids"), 200);
  const lattes_url = parseOptionalString(formData.get("lattes_url"), 300);
  const orcid = parseOptionalString(formData.get("orcid"), 64);

  updateUserReviewerProfile(auth.user.id, {
    is_reviewer_candidate,
    review_interests,
    preferred_track_ids,
    lattes_url,
    orcid,
  });

  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/director");
  return { success: true };
}

// 14. Configuração SMTP é exclusivamente via variáveis de ambiente (nunca grava senha no banco)
export async function saveSmtpSettingsAction(_formData: FormData) {
  const auth = await requireActionAuth(ADMIN_ROLES);
  if (!auth.ok) return { success: false, error: auth.error };

  return {
    success: false,
    error: "Por segurança, as credenciais SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM) são configuradas exclusivamente via variáveis de ambiente do servidor.",
  };
}
