"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
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
  updateUserReviewerProfile
} from "@/lib/ocs-service";
import { testSmtpConnection, saveSmtpSettings } from "@/lib/email-service";

export async function submitAuthorRevisionAction(formData: FormData) {
  const paper_id = Number(formData.get("paper_id"));
  const revised_file_name = String(formData.get("revised_file_name") || "manuscrito_revisao_r2.pdf");
  const author_response = String(formData.get("author_response") || "").trim();

  if (!paper_id || !author_response) {
    return { success: false, error: "Preencha a resposta aos pareceristas." };
  }

  submitAuthorRevision({
    paper_id,
    revised_file_name,
    author_response,
  });

  revalidatePath("/dashboard/author");
  revalidatePath("/dashboard/reviewer");
  revalidatePath("/dashboard/director");
  return { success: true };
}

export async function submitPaperAction(formData: FormData) {
  const sched_conf_id = Number(formData.get("sched_conf_id"));
  const track_id = Number(formData.get("track_id"));
  const user_id = Number(formData.get("user_id") || 6); // default Dr. Lucas Martins
  const title = String(formData.get("title") || "").trim();
  const abstract = String(formData.get("abstract") || "").trim();
  const keywords = String(formData.get("keywords") || "").trim();
  const presentation_type = String(formData.get("presentation_type") || "oral");
  const comments_to_director = String(formData.get("comments_to_director") || "");
  const file_name = String(formData.get("file_name") || "manuscrito_submissao.pdf");
  const funding = String(formData.get("funding") || "").trim();

  // Coautores
  const author_names = formData.getAll("author_name") as string[];
  const author_emails = formData.getAll("author_email") as string[];
  const author_affiliations = formData.getAll("author_affiliation") as string[];
  const author_orcids = formData.getAll("author_orcid") as string[];
  const author_rors = formData.getAll("author_ror") as string[];
  const author_credits = formData.getAll("author_credit") as string[];

  const authors = author_names.map((name, i) => ({
    full_name: name,
    email: author_emails[i] || "",
    affiliation: author_affiliations[i] || "",
    orcid: author_orcids[i] || "",
    ror_id: author_rors[i] || "",
    credit_roles: author_credits[i] || "",
    is_primary: i === 0,
  }));

  if (authors.length === 0) {
    authors.push({
      full_name: "Autor Principal",
      email: "autor@exemplo.com",
      affiliation: "Universidade",
      orcid: "",
      ror_id: "",
      credit_roles: "Conceitualização, Metodologia, Escrita – rascunho original",
      is_primary: true,
    });
  }

  const references_text = String(formData.get("references_text") || "").trim();
  const references_style = String(formData.get("references_style") || "abnt").trim();

  // Seções Estruturadas do Artigo Curto (IMRaD puro web - máx 2.000 palavras)
  const section_intro = String(formData.get("section_intro") || "").trim();
  const section_methods = String(formData.get("section_methods") || "").trim();
  const section_results = String(formData.get("section_results") || "").trim();
  const section_conclusion = String(formData.get("section_conclusion") || "").trim();
  const figures_json = String(formData.get("figures_json") || "[]").trim();
  const page_start = Number(formData.get("page_start") || 1);
  const page_end = Number(formData.get("page_end") || 5);

  const paperId = createPaper({
    sched_conf_id,
    track_id,
    user_id,
    title,
    abstract,
    keywords,
    presentation_type,
    funding,
    file_name,
    file_size: 480210,
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

  revalidatePath("/dashboard/author");
  revalidatePath("/dashboard/director");
  return { success: true, paperId };
}

export async function assignReviewerAction(formData: FormData) {
  const paper_id = Number(formData.get("paper_id"));
  const reviewer_id = Number(formData.get("reviewer_id"));

  if (!paper_id || !reviewer_id) {
    return { success: false, error: "Parâmetros inválidos" };
  }

  assignReviewer(paper_id, reviewer_id);
  revalidatePath("/dashboard/director");
  revalidatePath("/dashboard/reviewer");
  return { success: true };
}

export async function submitReviewAction(formData: FormData) {
  const assignment_id = Number(formData.get("assignment_id"));
  const recommendation = formData.get("recommendation") as "accept" | "revisions" | "reject";
  const score_originality = Number(formData.get("score_originality") || 4);
  const score_methodology = Number(formData.get("score_methodology") || 4);
  const score_clarity = Number(formData.get("score_clarity") || 4);
  const score_relevance = Number(formData.get("score_relevance") || 4);
  const comments_author = String(formData.get("comments_author") || "");
  const comments_director = String(formData.get("comments_director") || "");

  submitReview({
    assignment_id,
    recommendation,
    score_originality,
    score_methodology,
    score_clarity,
    score_relevance,
    comments_author,
    comments_director,
  });

  revalidatePath("/dashboard/reviewer");
  revalidatePath("/dashboard/director");
  return { success: true };
}

export async function recordDecisionAction(formData: FormData) {
  const paper_id = Number(formData.get("paper_id"));
  const director_id = Number(formData.get("director_id") || 3);
  const decision = formData.get("decision") as "accept" | "revisions" | "reject";
  const comments = String(formData.get("comments") || "");
  const publish_proceedings = formData.get("publish_proceedings") === "true";
  const confirm_presented = formData.get("confirm_presented") === "true";

  recordEditorialDecision({
    paper_id,
    director_id,
    decision,
    comments,
    publish_proceedings,
    confirm_presented,
  });

  revalidatePath("/dashboard/director");
  revalidatePath("/dashboard/author");
  revalidatePath("/proceedings");
  return { success: true };
}

export async function markPaperPresentedAction(formData: FormData) {
  const paper_id = Number(formData.get("paper_id"));
  const is_presented = formData.get("is_presented") === "true";
  const presented_by = String(formData.get("presented_by") || "Editor Responsável");

  if (!paper_id) {
    return { success: false, error: "ID de trabalho inválido" };
  }

  markPaperPresented(paper_id, is_presented, presented_by);

  revalidatePath("/dashboard/director");
  revalidatePath("/schedule");
  revalidatePath("/proceedings");
  return { success: true };
}

export async function registerAttendeeAction(formData: FormData) {
  const sched_conf_id = Number(formData.get("sched_conf_id"));
  const full_name = String(formData.get("full_name") || "");
  const email = String(formData.get("email") || "");
  const affiliation = String(formData.get("affiliation") || "");
  const category = String(formData.get("category") || "Profissional");
  const is_reviewer_candidate = formData.get("is_reviewer_candidate") === "true";
  const review_interests = String(formData.get("review_interests") || "").trim();
  const preferred_track_ids = String(formData.get("preferred_track_ids") || "").trim();
  const lattes_url = String(formData.get("lattes_url") || "").trim();

  registerAttendee({
    sched_conf_id,
    full_name,
    email,
    affiliation,
    category,
  });

  if (is_reviewer_candidate) {
    try {
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
      if (existing) {
        updateUserReviewerProfile(existing.id, {
          is_reviewer_candidate: true,
          review_interests,
          preferred_track_ids,
          lattes_url,
        });
      } else {
        const username = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase() + Math.floor(Math.random() * 100);
        db.prepare(`
          INSERT INTO users (username, email, full_name, affiliation, role, bio, is_reviewer_candidate, review_interests, preferred_track_ids, lattes_url)
          VALUES (?, ?, ?, ?, 'reviewer', 'Parecerista cadastrado no credenciamento', 1, ?, ?, ?)
        `).run(username, email, full_name, affiliation, review_interests, preferred_track_ids, lattes_url);
      }
    } catch (e) {
      console.error("Erro ao registrar perfil de parecerista:", e);
    }
  }

  revalidatePath("/register");
  revalidatePath("/dashboard/director");
  return { success: true };
}

export async function createConferenceAction(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const acronym = String(formData.get("acronym") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const city = String(formData.get("city") || "").trim();
  const location = String(formData.get("location") || city).trim();
  const start_date = String(formData.get("start_date") || "2026-11-10");
  const end_date = String(formData.get("end_date") || "2026-11-13");
  const cfp_deadline = String(formData.get("cfp_deadline") || "2026-08-30");
  const review_deadline = String(formData.get("review_deadline") || "2026-09-30");
  const results_date = String(formData.get("results_date") || "2026-10-15");
  const proceedings_doi = String(formData.get("proceedings_doi") || `10.5281/zenodo.${slug}`);
  const isbn = String(formData.get("isbn") || "978-65-89123-99-9");
  const description = String(formData.get("description") || "").trim();

  if (!title || !slug) {
    return { success: false, error: "Título e identificador (slug) são obrigatórios." };
  }

  const result = createConference({
    title,
    acronym: acronym || slug.toUpperCase(),
    slug,
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
}

export async function updateUserRoleAction(formData: FormData) {
  const userId = Number(formData.get("user_id"));
  const role = String(formData.get("role") || "author");

  if (!userId || !role) {
    return { success: false, error: "Usuário e papel são obrigatórios." };
  }

  updateUserRole(userId, role);

  revalidatePath("/dashboard/director");
  revalidatePath("/dashboard/user");
  return { success: true };
}

export async function getSuggestedReviewersAction(paperId: number) {
  try {
    const matches = getSuggestedReviewersForPaper(paperId);
    return { success: true, matches };
  } catch (e: any) {
    return { success: false, error: e.message || "Erro ao calcular matching de avaliadores" };
  }
}

export async function autoAssignReviewersAction(formData: FormData) {
  const paper_id = Number(formData.get("paper_id"));
  const count = Number(formData.get("count") || 2);

  if (!paper_id) {
    return { success: false, error: "ID do trabalho não informado." };
  }

  try {
    const assigned = autoAssignBestReviewersForPaper(paper_id, count);
    revalidatePath("/dashboard/director");
    revalidatePath("/dashboard/reviewer");
    return { success: true, assigned };
  } catch (e: any) {
    return { success: false, error: e.message || "Erro na atribuição automática." };
  }
}

export async function testSmtpConnectionAction(formData: FormData) {
  const targetEmail = String(formData.get("email") || "").trim();
  if (!targetEmail) {
    return { success: false, error: "Informe um e-mail de destino para o teste." };
  }

  try {
    const result = await testSmtpConnection(targetEmail);
    revalidatePath("/dashboard/director");
    return { success: true, status: result.status, error: result.error };
  } catch (e: any) {
    return { success: false, error: e.message || "Falha ao testar SMTP." };
  }
}

export async function updateUserReviewerProfileAction(formData: FormData) {
  const user_id = Number(formData.get("user_id"));
  const is_reviewer_candidate = formData.get("is_reviewer_candidate") === "true";
  const review_interests = String(formData.get("review_interests") || "").trim();
  const preferred_track_ids = String(formData.get("preferred_track_ids") || "").trim();
  const lattes_url = String(formData.get("lattes_url") || "").trim();
  const orcid = String(formData.get("orcid") || "").trim();

  if (!user_id) {
    return { success: false, error: "Usuário não identificado." };
  }

  updateUserReviewerProfile(user_id, {
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

export async function saveSmtpSettingsAction(formData: FormData) {
  const host = String(formData.get("host") || "smtp.gmail.com").trim();
  const port = Number(formData.get("port") || 587);
  const user = String(formData.get("user") || "rev.estrabao@gmail.com").trim();
  const from = String(formData.get("from") || '"Open Conference Werneckiana (Revista Estrabão)" <rev.estrabao@gmail.com>').trim();
  const pass = String(formData.get("pass") || "").trim();

  try {
    saveSmtpSettings({
      host,
      port,
      user,
      from,
      ...(pass ? { pass } : {})
    });
    revalidatePath("/dashboard/director");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Erro ao salvar configurações de SMTP" };
  }
}

