import db, { seedDatabaseIfEmpty } from "./db";
import { 
  sendRevisionRequiredEmail, 
  sendReviewerAssignedEmail, 
  sendPresentationCertificateEmail, 
  sendReviewerCertificateEmail,
  getEmailLogs,
  getCertificatesForUser,
  getCertificateByCode,
  getSmtpSettings,
  type AcademicCertificate,
  type EmailLog
} from "./email-service";

export { 
  getEmailLogs, 
  getCertificatesForUser, 
  getCertificateByCode, 
  getSmtpSettings,
  type AcademicCertificate, 
  type EmailLog 
};

// Garantir banco populado
seedDatabaseIfEmpty();

export interface Conference {
  id: number;
  slug: string;
  title: string;
  acronym: string;
  description: string;
  contact_name: string;
  contact_email: string;
  created_at: string;
  active_edition?: SchedConf;
  editions?: SchedConf[];
}

export interface SchedConf {
  id: number;
  conference_id: number;
  conference_slug?: string;
  conference_title?: string;
  slug: string;
  title: string;
  acronym: string;
  location: string;
  city?: string;
  proceedings_doi?: string;
  isbn?: string;
  start_date: string;
  end_date: string;
  cfp_deadline: string;
  review_deadline: string;
  results_date: string;
  description: string;
  is_active: number;
}

export interface Track {
  id: number;
  sched_conf_id: number;
  title: string;
  abbreviation: string;
  description: string;
  max_words: number;
  is_active: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  affiliation: string;
  role: string;
  bio: string;
  is_reviewer_candidate?: number;
  review_interests?: string;
  preferred_track_ids?: string;
  lattes_url?: string;
  orcid?: string;
}

export interface ReviewerMatch {
  reviewer: User;
  score: number;
  reasons: string[];
  isConflict: boolean;
  assignedCount: number;
}

export interface PaperAuthor {
  id?: number;
  paper_id?: number;
  full_name: string;
  email: string;
  affiliation: string;
  orcid?: string;
  ror_id?: string;
  credit_roles?: string;
  is_primary: number;
  seq: number;
}

export interface Paper {
  id: number;
  sched_conf_id: number;
  sched_title?: string;
  conf_slug?: string;
  sched_slug?: string;
  conference_title?: string;
  city?: string;
  proceedings_doi?: string;
  isbn?: string;
  track_id: number;
  track_title?: string;
  track_abbreviation?: string;
  user_id: number;
  author_name?: string;
  author_email?: string;
  title: string;
  abstract: string;
  keywords: string;
  presentation_type: string;
  status: "submitted" | "under_review" | "revisions_required" | "accepted" | "rejected" | "published";
  doi?: string;
  funding?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  comments_to_director?: string;
  revised_file_name?: string;
  author_response?: string;
  current_round?: number;
  date_submitted: string;
  date_decided?: string;
  authors?: PaperAuthor[];
  reviews?: ReviewAssignment[];
  decision?: EditDecision;
  schedule?: ScheduleItem;
  references_text?: string;
  references_style?: "abnt" | "apa";
  section_intro?: string;
  section_methods?: string;
  section_results?: string;
  section_conclusion?: string;
  figures_json?: string;
  figures?: PaperFigure[];
  page_start?: number;
  page_end?: number;
  is_presented?: number;
  presented_at?: string;
  presented_by?: string;
}

export interface PaperFigure {
  id: number;
  caption: string;
  url: string;
  dpi?: number;
  file_name?: string;
  section?: "methods" | "results" | "intro" | "conclusion";
}

export interface ReviewAssignment {
  id: number;
  paper_id: number;
  reviewer_id: number;
  reviewer_name?: string;
  reviewer_affiliation?: string;
  status: "pending" | "accepted" | "completed" | "declined";
  recommendation?: "accept" | "revisions" | "reject";
  round?: number;
  author_response?: string;
  revised_file_name?: string;
  previous_review?: ReviewAssignment;
  score_originality?: number;
  score_methodology?: number;
  score_clarity?: number;
  score_relevance?: number;
  comments_author?: string;
  comments_director?: string;
  date_assigned: string;
  date_completed?: string;
  paper_title?: string;
  paper_abstract?: string;
  paper_file_name?: string;
  track_title?: string;
  paper_section_intro?: string;
  paper_section_methods?: string;
  paper_section_results?: string;
  paper_section_conclusion?: string;
  paper_figures_json?: string;
  paper_references_text?: string;
}

export interface EditDecision {
  id: number;
  paper_id: number;
  director_id: number;
  director_name?: string;
  decision: "accept" | "revisions" | "reject";
  comments: string;
  date_decided: string;
}

export interface ScheduleItem {
  id: number;
  room_name: string;
  building: string;
  time_block_title: string;
  date: string;
  start_time: string;
  end_time: string;
  paper_id: number;
  paper_title: string;
  track_title: string;
  authors: string;
  modality?: "presential" | "online" | "hybrid";
  meeting_url?: string;
  meeting_instructions?: string;
}

export interface Announcement {
  id: number;
  conference_id: number;
  sched_conf_id?: number;
  title: string;
  summary: string;
  content: string;
  date_posted: string;
}

function toPlain<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}

// -------------------------------------------------------------
// Funções de Consulta (Read Operations)
// -------------------------------------------------------------

export function getAllConferences(): Conference[] {
  const confs = db.prepare("SELECT * FROM conferences ORDER BY id ASC").all() as unknown as Conference[];
  for (const c of confs) {
    const editions = db.prepare("SELECT * FROM sched_confs WHERE conference_id = ? ORDER BY start_date DESC").all(c.id) as unknown as SchedConf[];
    c.editions = editions;
    c.active_edition = editions.find(e => e.is_active === 1) || editions[0];
  }
  return toPlain(confs);
}

export function getConferenceBySlug(slug: string): (Conference & { announcements: Announcement[]; tracks: Track[] }) | null {
  const conf = db.prepare("SELECT * FROM conferences WHERE slug = ?").get(slug) as unknown as Conference | undefined;
  if (!conf) return null;

  const editions = db.prepare("SELECT * FROM sched_confs WHERE conference_id = ? ORDER BY start_date DESC").all(conf.id) as unknown as SchedConf[];
  conf.editions = editions;
  conf.active_edition = editions.find(e => e.is_active === 1) || editions[0];

  const tracks = conf.active_edition
    ? (db.prepare("SELECT * FROM tracks WHERE sched_conf_id = ? AND is_active = 1").all(conf.active_edition.id) as unknown as Track[])
    : [];

  const announcements = db.prepare("SELECT * FROM announcements WHERE conference_id = ? ORDER BY date_posted DESC").all(conf.id) as unknown as Announcement[];

  return toPlain({ ...conf, announcements, tracks });
}

export function getSchedConf(confSlug: string, schedSlug?: string): SchedConf | null {
  const conf = db.prepare("SELECT id FROM conferences WHERE slug = ?").get(confSlug) as { id: number } | undefined;
  if (!conf) return null;

  let sched: SchedConf | undefined;
  if (schedSlug) {
    sched = db.prepare("SELECT sc.*, c.slug as conference_slug, c.title as conference_title FROM sched_confs sc JOIN conferences c ON c.id = sc.conference_id WHERE sc.conference_id = ? AND sc.slug = ?").get(conf.id, schedSlug) as unknown as SchedConf | undefined;
  } else {
    sched = db.prepare("SELECT sc.*, c.slug as conference_slug, c.title as conference_title FROM sched_confs sc JOIN conferences c ON c.id = sc.conference_id WHERE sc.conference_id = ? AND sc.is_active = 1").get(conf.id) as unknown as SchedConf | undefined;
  }

  return toPlain(sched || null);
}

export interface ProceedingsVolume {
  sched_id: number;
  sched_title: string;
  sched_slug: string;
  conference_id: number;
  conference_title: string;
  conf_slug: string;
  city: string;
  isbn?: string;
  proceedings_doi?: string;
  start_date: string;
  end_date: string;
  published_papers_count: number;
  tracks: Track[];
}

export function getProceedingsVolumes(): ProceedingsVolume[] {
  const rows = db.prepare(`
    SELECT sc.*, c.id as conference_id, c.title as conference_title, c.slug as conf_slug,
           (SELECT COUNT(*) FROM papers p WHERE p.sched_conf_id = sc.id AND p.status = 'published') as published_papers_count
    FROM sched_confs sc
    JOIN conferences c ON c.id = sc.conference_id
    ORDER BY sc.start_date DESC
  `).all() as unknown as (SchedConf & { conference_id: number; conference_title: string; conf_slug: string; published_papers_count: number })[];

  const volumes: ProceedingsVolume[] = [];
  for (const r of rows) {
    const tracks = db.prepare("SELECT * FROM tracks WHERE sched_conf_id = ? AND is_active = 1").all(r.id) as unknown as Track[];
    volumes.push({
      sched_id: r.id,
      sched_title: r.title,
      sched_slug: r.slug,
      conference_id: r.conference_id,
      conference_title: r.conference_title,
      conf_slug: r.conf_slug,
      city: r.city || r.location,
      isbn: r.isbn,
      proceedings_doi: r.proceedings_doi,
      start_date: r.start_date,
      end_date: r.end_date,
      published_papers_count: r.published_papers_count,
      tracks,
    });
  }

  return toPlain(volumes);
}

export function getSchedConfById(id: number): (SchedConf & { conference_title?: string; conf_slug?: string; tracks?: Track[]; published_count?: number }) | null {
  const sched = db.prepare(`
    SELECT sc.*, c.title as conference_title, c.slug as conf_slug,
           (SELECT COUNT(*) FROM papers p WHERE p.sched_conf_id = sc.id AND p.status = 'published') as published_count
    FROM sched_confs sc
    JOIN conferences c ON c.id = sc.conference_id
    WHERE sc.id = ?
  `).get(id) as unknown as (SchedConf & { conference_title?: string; conf_slug?: string; published_count?: number }) | undefined;

  if (!sched) return null;

  const tracks = db.prepare("SELECT * FROM tracks WHERE sched_conf_id = ? AND is_active = 1").all(id) as unknown as Track[];
  return toPlain({ ...sched, tracks });
}

export function getTracks(schedConfId: number): Track[] {
  return toPlain(db.prepare("SELECT * FROM tracks WHERE sched_conf_id = ? AND is_active = 1").all(schedConfId) as unknown as Track[]);
}

export function getAllUsers(): User[] {
  return toPlain(db.prepare("SELECT * FROM users ORDER BY full_name ASC").all() as unknown as User[]);
}

export function getUserById(id: number): User | null {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as User | undefined;
  return toPlain(user || null);
}

export function getUserByRole(role: string): User | null {
  const user = db.prepare("SELECT * FROM users WHERE role = ? LIMIT 1").get(role) as unknown as User | undefined;
  return toPlain(user || null);
}

export function getPaperById(paperIdOrDoi: number | string): Paper | null {
  const isNum = !isNaN(Number(paperIdOrDoi));
  let paper: Paper | undefined;
  if (isNum) {
    paper = db.prepare(`
      SELECT p.*, t.title as track_title, t.abbreviation as track_abbreviation, 
             sc.title as sched_title, sc.slug as sched_slug, sc.city as city, sc.proceedings_doi as proceedings_doi,
             COALESCE(p.isbn, sc.isbn) as isbn,
             c.slug as conf_slug,
             u.full_name as author_name, u.email as author_email
      FROM papers p
      JOIN tracks t ON t.id = p.track_id
      JOIN sched_confs sc ON sc.id = p.sched_conf_id
      JOIN conferences c ON c.id = sc.conference_id
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
    `).get(Number(paperIdOrDoi)) as unknown as Paper | undefined;
  } else {
    paper = db.prepare(`
      SELECT p.*, t.title as track_title, t.abbreviation as track_abbreviation, 
             sc.title as sched_title, sc.slug as sched_slug, sc.city as city, sc.proceedings_doi as proceedings_doi,
             COALESCE(p.isbn, sc.isbn) as isbn,
             c.slug as conf_slug,
             u.full_name as author_name, u.email as author_email
      FROM papers p
      JOIN tracks t ON t.id = p.track_id
      JOIN sched_confs sc ON sc.id = p.sched_conf_id
      JOIN conferences c ON c.id = sc.conference_id
      JOIN users u ON u.id = p.user_id
      WHERE p.doi = ?
    `).get(String(paperIdOrDoi)) as unknown as Paper | undefined;
  }

  if (!paper) return null;

  paper.authors = db.prepare("SELECT * FROM paper_authors WHERE paper_id = ? ORDER BY seq ASC").all(paper.id) as unknown as PaperAuthor[];
  
  paper.reviews = db.prepare(`
    SELECT r.*, u.full_name as reviewer_name, u.affiliation as reviewer_affiliation
    FROM review_assignments r
    JOIN users u ON u.id = r.reviewer_id
    WHERE r.paper_id = ?
  `).all(paper.id) as unknown as ReviewAssignment[];

  paper.decision = db.prepare(`
    SELECT d.*, u.full_name as director_name
    FROM edit_decisions d
    JOIN users u ON u.id = d.director_id
    WHERE d.paper_id = ?
    ORDER BY d.date_decided DESC LIMIT 1
  `).get(paper.id) as unknown as EditDecision | undefined;

  paper.schedule = db.prepare(`
    SELECT sp.id, r.name as room_name, r.building, tb.title as time_block_title, 
           tb.date, sp.start_time, sp.end_time, sp.modality, sp.meeting_url, sp.meeting_instructions,
           p.id as paper_id, p.title as paper_title, t.title as track_title
    FROM scheduled_presentations sp
    JOIN rooms r ON r.id = sp.room_id
    JOIN time_blocks tb ON tb.id = sp.time_block_id
    JOIN papers p ON p.id = sp.paper_id
    JOIN tracks t ON t.id = p.track_id
    WHERE sp.paper_id = ?
    LIMIT 1
  `).get(paper.id) as unknown as ScheduleItem | undefined;

  return toPlain(paper);
}

export function getSubmissionsForAuthor(userId: number): Paper[] {
  const papers = db.prepare(`
    SELECT p.*, t.title as track_title, t.abbreviation as track_abbreviation, 
           sc.title as sched_title, sc.slug as sched_slug, sc.city as city, sc.proceedings_doi as proceedings_doi,
           COALESCE(p.isbn, sc.isbn) as isbn,
           c.slug as conf_slug
    FROM papers p
    JOIN tracks t ON t.id = p.track_id
    JOIN sched_confs sc ON sc.id = p.sched_conf_id
    JOIN conferences c ON c.id = sc.conference_id
    WHERE p.user_id = ?
    ORDER BY p.date_submitted DESC
  `).all(userId) as unknown as Paper[];

  for (const p of papers) {
    p.authors = db.prepare("SELECT * FROM paper_authors WHERE paper_id = ? ORDER BY seq ASC").all(p.id) as unknown as PaperAuthor[];
    p.decision = db.prepare("SELECT * FROM edit_decisions WHERE paper_id = ? ORDER BY date_decided DESC LIMIT 1").get(p.id) as unknown as EditDecision | undefined;
    p.reviews = db.prepare(`
      SELECT r.*, u.full_name as reviewer_name, u.affiliation as reviewer_affiliation 
      FROM review_assignments r 
      JOIN users u ON u.id = r.reviewer_id 
      WHERE r.paper_id = ? 
      ORDER BY r.round ASC, r.id ASC
    `).all(p.id) as unknown as ReviewAssignment[];
  }
  return toPlain(papers);
}

export function getAllSubmissionsForDirector(schedConfId?: number): Paper[] {
  let query = `
    SELECT p.*, t.title as track_title, t.abbreviation as track_abbreviation, 
           sc.title as sched_title, sc.slug as sched_slug, sc.city as city, sc.proceedings_doi as proceedings_doi,
           COALESCE(p.isbn, sc.isbn) as isbn,
           c.slug as conf_slug,
           u.full_name as author_name, u.email as author_email
    FROM papers p
    JOIN tracks t ON t.id = p.track_id
    JOIN sched_confs sc ON sc.id = p.sched_conf_id
    JOIN conferences c ON c.id = sc.conference_id
    JOIN users u ON u.id = p.user_id
  `;
  const params: unknown[] = [];
  if (schedConfId) {
    query += " WHERE p.sched_conf_id = ?";
    params.push(schedConfId);
  }
  query += " ORDER BY p.date_submitted DESC";

  const papers = db.prepare(query).all(...params) as unknown as Paper[];

  for (const p of papers) {
    p.authors = db.prepare("SELECT * FROM paper_authors WHERE paper_id = ? ORDER BY seq ASC").all(p.id) as unknown as PaperAuthor[];
    p.reviews = db.prepare(`
      SELECT r.*, u.full_name as reviewer_name, u.affiliation as reviewer_affiliation
      FROM review_assignments r
      JOIN users u ON u.id = r.reviewer_id
      WHERE r.paper_id = ?
      ORDER BY r.round ASC, r.id ASC
    `).all(p.id) as unknown as ReviewAssignment[];
    p.decision = db.prepare("SELECT * FROM edit_decisions WHERE paper_id = ? ORDER BY date_decided DESC LIMIT 1").get(p.id) as unknown as EditDecision | undefined;
  }
  return toPlain(papers);
}

export function getAssignmentsForReviewer(reviewerId: number): ReviewAssignment[] {
  const assignments = db.prepare(`
    SELECT r.*, p.title as paper_title, p.abstract as paper_abstract, p.file_name as paper_file_name,
           p.revised_file_name, p.author_response, p.current_round, t.title as track_title,
           p.section_intro as paper_section_intro, p.section_methods as paper_section_methods,
           p.section_results as paper_section_results, p.section_conclusion as paper_section_conclusion,
           p.figures_json as paper_figures_json, p.references_text as paper_references_text
    FROM review_assignments r
    JOIN papers p ON p.id = r.paper_id
    JOIN tracks t ON t.id = p.track_id
    WHERE r.reviewer_id = ?
    ORDER BY r.status ASC, r.round DESC, r.date_assigned DESC
  `).all(reviewerId) as unknown as ReviewAssignment[];

  for (const a of assignments) {
    if (a.round && a.round > 1) {
      const prev = db.prepare(`
        SELECT * FROM review_assignments 
        WHERE paper_id = ? AND reviewer_id = ? AND round < ? AND status = 'completed'
        ORDER BY round DESC LIMIT 1
      `).get(a.paper_id, reviewerId, a.round) as unknown as ReviewAssignment | undefined;
      a.previous_review = prev;
    }
  }

  return toPlain(assignments);
}

export function getPublishedProceedings(schedConfId?: number, search?: string, trackId?: number): Paper[] {
  let query = `
    SELECT p.*, t.title as track_title, t.abbreviation as track_abbreviation, 
           sc.title as sched_title, sc.slug as sched_slug, sc.city as city, sc.proceedings_doi as proceedings_doi,
           COALESCE(p.isbn, sc.isbn) as isbn,
           c.slug as conf_slug, c.title as conference_title
    FROM papers p
    JOIN tracks t ON t.id = p.track_id
    JOIN sched_confs sc ON sc.id = p.sched_conf_id
    JOIN conferences c ON c.id = sc.conference_id
    WHERE p.status = 'published' AND (p.is_presented = 1 OR p.is_presented IS NULL)
  `;
  const params: unknown[] = [];

  if (schedConfId) {
    query += " AND p.sched_conf_id = ?";
    params.push(schedConfId);
  }

  if (trackId) {
    query += " AND p.track_id = ?";
    params.push(trackId);
  }

  if (search) {
    query += " AND (p.title LIKE ? OR p.abstract LIKE ? OR p.keywords LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += " ORDER BY p.id ASC";

  const papers = db.prepare(query).all(...params) as unknown as Paper[];

  for (const p of papers) {
    p.authors = db.prepare("SELECT * FROM paper_authors WHERE paper_id = ? ORDER BY seq ASC").all(p.id) as unknown as PaperAuthor[];
  }
  return toPlain(papers);
}

export function getSchedule(schedConfId: number): ScheduleItem[] {
  const schedule = db.prepare(`
    SELECT sp.id, r.name as room_name, r.building, tb.title as time_block_title, 
           tb.date, sp.start_time, sp.end_time, sp.modality, sp.meeting_url, sp.meeting_instructions,
           p.id as paper_id, p.title as paper_title, 
           t.title as track_title,
           (SELECT GROUP_CONCAT(pa.full_name, '; ') FROM paper_authors pa WHERE pa.paper_id = p.id) as authors
    FROM scheduled_presentations sp
    JOIN rooms r ON r.id = sp.room_id
    JOIN time_blocks tb ON tb.id = sp.time_block_id
    JOIN papers p ON p.id = sp.paper_id
    JOIN tracks t ON t.id = p.track_id
    WHERE sp.sched_conf_id = ?
    ORDER BY tb.date ASC, sp.start_time ASC
  `).all(schedConfId) as unknown as ScheduleItem[];
  return toPlain(schedule);
}

export function getRegistrations(schedConfId: number) {
  const regs = db.prepare("SELECT * FROM registrations WHERE sched_conf_id = ? ORDER BY date_registered DESC").all(schedConfId);
  return toPlain(regs);
}

// -------------------------------------------------------------
// Operações de Mutação (Create / Update Operations)
// -------------------------------------------------------------

export function createPaper(data: {
  sched_conf_id: number;
  track_id: number;
  user_id: number;
  title: string;
  abstract: string;
  keywords: string;
  presentation_type: string;
  funding?: string;
  doi?: string;
  file_name?: string;
  file_size?: number;
  comments_to_director?: string;
  references_text?: string;
  references_style?: string;
  section_intro?: string;
  section_methods?: string;
  section_results?: string;
  section_conclusion?: string;
  figures_json?: string;
  page_start?: number;
  page_end?: number;
  authors: Array<{
    full_name: string;
    email: string;
    affiliation: string;
    orcid?: string;
    ror_id?: string;
    credit_roles?: string;
    is_primary?: boolean;
  }>;
}): number {
  const stmt = db.prepare(`
    INSERT INTO papers (sched_conf_id, track_id, user_id, title, abstract, keywords, presentation_type, status, funding, doi, file_name, file_size, comments_to_director, references_text, references_style, section_intro, section_methods, section_results, section_conclusion, figures_json, page_start, page_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.sched_conf_id,
    data.track_id,
    data.user_id,
    data.title,
    data.abstract,
    data.keywords,
    data.presentation_type,
    data.funding || "",
    data.doi || null,
    data.file_name || "artigo_manuscrito.pdf",
    data.file_size || 450000,
    data.comments_to_director || "",
    data.references_text || "",
    data.references_style || "abnt",
    data.section_intro || "",
    data.section_methods || "",
    data.section_results || "",
    data.section_conclusion || "",
    data.figures_json || "[]",
    data.page_start || 1,
    data.page_end || 5
  );

  const paperId = Number(result.lastInsertRowid);

  const authorStmt = db.prepare(`
    INSERT INTO paper_authors (paper_id, full_name, email, affiliation, orcid, ror_id, credit_roles, is_primary, seq)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  data.authors.forEach((author, index) => {
    authorStmt.run(
      paperId,
      author.full_name,
      author.email,
      author.affiliation,
      author.orcid || "",
      author.ror_id || "",
      author.credit_roles || "",
      author.is_primary ? 1 : index === 0 ? 1 : 0,
      index + 1
    );
  });

  return paperId;
}

export function assignReviewer(paperId: number, reviewerId: number): number {
  const existing = db.prepare("SELECT id FROM review_assignments WHERE paper_id = ? AND reviewer_id = ?").get(paperId, reviewerId);
  if (existing) {
    return (existing as { id: number }).id;
  }

  const stmt = db.prepare(`
    INSERT INTO review_assignments (paper_id, reviewer_id, status)
    VALUES (?, ?, 'pending')
  `);
  const res = stmt.run(paperId, reviewerId);

  // Atualizar status do artigo para under_review se estivesse submitted
  db.prepare("UPDATE papers SET status = 'under_review' WHERE id = ? AND status = 'submitted'").run(paperId);

  // Disparar e-mail de notificação para o avaliador
  try {
    sendReviewerAssignedEmail(paperId, reviewerId).catch((e) => console.error("Erro ao enviar email para avaliador:", e));
  } catch {}

  return Number(res.lastInsertRowid);
}

export function submitReview(data: {
  assignment_id: number;
  recommendation: "accept" | "revisions" | "reject";
  score_originality: number;
  score_methodology: number;
  score_clarity: number;
  score_relevance: number;
  comments_author: string;
  comments_director: string;
}) {
  const stmt = db.prepare(`
    UPDATE review_assignments 
    SET status = 'completed',
        recommendation = ?,
        score_originality = ?,
        score_methodology = ?,
        score_clarity = ?,
        score_relevance = ?,
        comments_author = ?,
        comments_director = ?,
        date_completed = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    data.recommendation,
    data.score_originality,
    data.score_methodology,
    data.score_clarity,
    data.score_relevance,
    data.comments_author,
    data.comments_director,
    data.assignment_id
  );

  // Emitir e enviar declaração de parecerista ad-hoc por e-mail
  try {
    sendReviewerCertificateEmail(data.assignment_id).catch((e) => console.error("Erro ao enviar declaração de parecerista:", e));
  } catch {}

  // Atualizar status do artigo se a recomendação for de revisão
  const assignment = db.prepare("SELECT paper_id FROM review_assignments WHERE id = ?").get(data.assignment_id) as { paper_id: number } | undefined;
  if (assignment) {
    if (data.recommendation === "revisions") {
      db.prepare("UPDATE papers SET status = 'revisions_required' WHERE id = ?").run(assignment.paper_id);
    }
  }
}

export function submitAuthorRevision(data: {
  paper_id: number;
  revised_file_name: string;
  author_response: string;
}) {
  // 1. Atualizar o paper: status volta para 'under_review', salva arquivo corrigido e carta de resposta
  db.prepare(`
    UPDATE papers 
    SET status = 'under_review',
        revised_file_name = ?,
        author_response = ?,
        current_round = 2
    WHERE id = ?
  `).run(data.revised_file_name, data.author_response, data.paper_id);

  // 2. Identificar os avaliadores originais que avaliaram o manuscrito
  const prevAssignments = db.prepare(`
    SELECT DISTINCT reviewer_id 
    FROM review_assignments 
    WHERE paper_id = ?
  `).all(data.paper_id) as Array<{ reviewer_id: number }>;

  // 3. Garantir que o trabalho volte para o MESMO avaliador na Rodada 2
  for (const prev of prevAssignments) {
    const existing = db.prepare(`
      SELECT id FROM review_assignments 
      WHERE paper_id = ? AND reviewer_id = ? AND round = 2
    `).get(data.paper_id, prev.reviewer_id);

    if (!existing) {
      db.prepare(`
        INSERT INTO review_assignments (paper_id, reviewer_id, status, round, author_response, revised_file_name, date_assigned)
        VALUES (?, ?, 'pending', 2, ?, ?, CURRENT_TIMESTAMP)
      `).run(data.paper_id, prev.reviewer_id, data.author_response, data.revised_file_name);
    }
  }
}

export function markPaperPresented(paperId: number, isPresented: boolean, presentedBy: string = "Editor Responsável"): void {
  db.prepare(`
    UPDATE papers
    SET is_presented = ?,
        presented_at = ?,
        presented_by = ?
    WHERE id = ?
  `).run(
    isPresented ? 1 : 0,
    isPresented ? new Date().toISOString().replace("T", " ").substring(0, 19) : null,
    isPresented ? presentedBy : null,
    paperId
  );

  // Se atestou a apresentação, emite a declaração oficial e dispara por e-mail para os autores
  if (isPresented) {
    try {
      sendPresentationCertificateEmail(paperId).catch((e) => console.error("Erro ao emitir/enviar declaração de apresentação:", e));
    } catch {}
  }
}

// -------------------------------------------------------------
// Distribuição Inteligente de Avaliadores por Área de Conhecimento
// -------------------------------------------------------------

export function getSuggestedReviewersForPaper(paperId: number): ReviewerMatch[] {
  const paper = getPaperById(paperId);
  if (!paper) return [];

  // Buscar todos os usuários cadastrados como avaliadores ou candidatos a parecerista
  const potentialReviewers = db.prepare(`
    SELECT * FROM users 
    WHERE role IN ('reviewer', 'admin', 'director') OR is_reviewer_candidate = 1
    ORDER BY full_name ASC
  `).all() as unknown as User[];

  // Autores do manuscrito (para checar conflito de interesse duplo-cego)
  const authorEmails = (paper.authors || []).map(a => a.email.toLowerCase());
  const authorNames = (paper.authors || []).map(a => a.full_name.toLowerCase());

  // Palavras-chave e termos do artigo
  const paperTrackIdStr = String(paper.track_id);
  const paperKeywords = (paper.keywords || "").toLowerCase().split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const paperTitleLower = (paper.title || "").toLowerCase();
  const paperAbstractLower = (paper.abstract || "").toLowerCase();

  const matches: ReviewerMatch[] = [];

  for (const r of potentialReviewers) {
    // Checagem de Conflito de Interesse (não pode avaliar o próprio trabalho)
    const isSameUser = r.id === paper.user_id;
    const isAuthor = isSameUser || 
      authorEmails.includes((r.email || "").toLowerCase()) ||
      authorNames.some(name => (r.full_name || "").toLowerCase().includes(name));

    // Contar quantas avaliações ativas este parecerista já possui no momento
    const activeAssignmentsRow = db.prepare(`
      SELECT COUNT(*) as count FROM review_assignments 
      WHERE reviewer_id = ? AND status = 'pending'
    `).get(r.id) as { count: number };
    const assignedCount = activeAssignmentsRow ? activeAssignmentsRow.count : 0;

    if (isAuthor) {
      matches.push({
        reviewer: r,
        score: 0,
        reasons: ["Conflito de Interesse: Autor/coautor do manuscrito"],
        isConflict: true,
        assignedCount,
      });
      continue;
    }

    let score = 25; // Base por estar cadastrado como avaliador
    const reasons: string[] = ["Avaliador(a) cadastrado no banco ad-hoc"];

    // 1. Compatibilidade com a Trilha Temática
    const preferredTracks = (r.preferred_track_ids || "").split(",").map(s => s.trim());
    if (preferredTracks.includes(paperTrackIdStr)) {
      score += 40;
      reasons.push(`Especialista na Trilha Temática (${paper.track_title})`);
    }

    // 2. Compatibilidade com Áreas de Interesse e Palavras-chave
    const reviewerInterests = (r.review_interests || "").toLowerCase();

    for (const kw of paperKeywords) {
      if (kw.length > 3 && reviewerInterests.includes(kw)) {
        score += 15;
        reasons.push(`Afinidade com palavra-chave: "${kw}"`);
      }
    }

    // 3. Verificação Semântica no Título ou Resumo
    const interestTokens = reviewerInterests.split(/[,;]+/).map(s => s.trim()).filter(s => s.length > 3);
    for (const token of interestTokens) {
      if (paperTitleLower.includes(token) || paperAbstractLower.includes(token)) {
        score += 10;
        reasons.push(`Tema presente no resumo: "${token}"`);
        break;
      }
    }

    // Penalizar se o avaliador estiver com muitas avaliações pendentes (balanceamento de carga)
    if (assignedCount >= 3) {
      score = Math.max(10, score - 20);
      reasons.push(`Carga elevada: ${assignedCount} pareceres pendentes`);
    }

    score = Math.min(100, Math.max(10, score));

    matches.push({
      reviewer: r,
      score,
      reasons,
      isConflict: false,
      assignedCount,
    });
  }

  // Ordenar por afinidade (maior score primeiro)
  return matches.sort((a, b) => {
    if (a.isConflict !== b.isConflict) return a.isConflict ? 1 : -1;
    return b.score - a.score;
  });
}

export function autoAssignBestReviewersForPaper(paperId: number, count: number = 2): Array<{ reviewerId: number; name: string; score: number }> {
  const matches = getSuggestedReviewersForPaper(paperId).filter(m => !m.isConflict);
  const assigned: Array<{ reviewerId: number; name: string; score: number }> = [];

  for (let i = 0; i < Math.min(count, matches.length); i++) {
    const rev = matches[i].reviewer;
    assignReviewer(paperId, rev.id);
    assigned.push({ reviewerId: rev.id, name: rev.full_name, score: matches[i].score });
  }
  return assigned;
}

export function updateUserReviewerProfile(userId: number, data: {
  is_reviewer_candidate: boolean;
  review_interests: string;
  preferred_track_ids: string;
  lattes_url?: string;
  orcid?: string;
}) {
  db.prepare(`
    UPDATE users
    SET is_reviewer_candidate = ?,
        review_interests = ?,
        preferred_track_ids = ?,
        lattes_url = ?,
        orcid = ?
    WHERE id = ?
  `).run(
    data.is_reviewer_candidate ? 1 : 0,
    data.review_interests,
    data.preferred_track_ids,
    data.lattes_url || null,
    data.orcid || null,
    userId
  );
}

export function recordEditorialDecision(data: {
  paper_id: number;
  director_id: number;
  decision: "accept" | "revisions" | "reject";
  comments: string;
  publish_proceedings?: boolean;
  confirm_presented?: boolean;
}) {
  // Se o editor atestou a apresentação do autor, registra imediatamente
  if (data.confirm_presented) {
    db.prepare(`
      UPDATE papers 
      SET is_presented = 1, presented_at = CURRENT_TIMESTAMP, presented_by = 'Editor (Decisão Editorial)' 
      WHERE id = ?
    `).run(data.paper_id);

    // Disparar certificado de apresentação se confirmado no modal
    try {
      sendPresentationCertificateEmail(data.paper_id).catch((e) => console.error("Erro ao emitir/enviar declaração de apresentação:", e));
    } catch {}
  }

  // Inserir registro de decisão
  const stmt = db.prepare(`
    INSERT INTO edit_decisions (paper_id, director_id, decision, comments)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(data.paper_id, data.director_id, data.decision, data.comments);

  // Se a decisão for revisões requeridas, dispara e-mail com as instruções aos autores
  if (data.decision === "revisions") {
    try {
      sendRevisionRequiredEmail(data.paper_id, data.comments).catch((e) => console.error("Erro ao enviar email de revisões:", e));
    } catch {}
  }

  // Mapear decisão para o status do artigo
  let newStatus: string = data.decision === "accept" ? "accepted" : data.decision === "revisions" ? "revisions_required" : "rejected";

  // TRAVA DE PUBLICAÇÃO: Só publica se for aceito E estiver apresentado!
  const currentPaper = db.prepare("SELECT is_presented FROM papers WHERE id = ?").get(data.paper_id) as { is_presented: number } | undefined;
  const isPresented = (currentPaper && currentPaper.is_presented === 1) || !!data.confirm_presented;

  if (data.decision === "accept" && data.publish_proceedings) {
    if (isPresented) {
      newStatus = "published";
    } else {
      // Trava ativa: fica como 'accepted' mas não publica nos anais até apresentação
      newStatus = "accepted";
    }
  }

  db.prepare("UPDATE papers SET status = ?, date_decided = CURRENT_TIMESTAMP WHERE id = ?").run(newStatus, data.paper_id);
}

export function registerAttendee(data: {
  sched_conf_id: number;
  full_name: string;
  email: string;
  affiliation: string;
  category: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO registrations (sched_conf_id, full_name, email, affiliation, category, status)
    VALUES (?, ?, ?, ?, ?, 'confirmed')
  `);
  return stmt.run(data.sched_conf_id, data.full_name, data.email, data.affiliation, data.category);
}

// -------------------------------------------------------------
// Relatórios de Gestão Editorial para Exportação (CSV para Excel)
// -------------------------------------------------------------

export function generateSubmissionsReportCsv(schedConfId?: number): string {
  const papers = getAllSubmissionsForDirector(schedConfId);
  const rows = [
    [
      "Protocolo",
      "Título do Trabalho",
      "Conferência",
      "Trilha Temática",
      "Modalidade",
      "Status Editorial",
      "Apresentado no Evento",
      "Data Apresentação",
      "Atestado Por",
      "Autor Principal",
      "E-mail",
      "Filiação",
      "ORCID",
      "Coautores",
      "Qtd Avaliações",
      "Média Notas",
      "Financiamento/Fomento",
      "Data Submissão"
    ]
  ];

  for (const p of papers) {
    const primary = p.authors?.[0];
    const coauthors = p.authors && p.authors.length > 1
      ? p.authors.slice(1).map(a => `${a.full_name} (${a.affiliation})`).join("; ")
      : "Nenhum";
    
    const avgScore = p.reviews && p.reviews.length > 0
      ? (p.reviews.reduce((acc, r) => acc + ((r.score_originality || 0) + (r.score_methodology || 0) + (r.score_clarity || 0) + (r.score_relevance || 0)) / 4, 0) / p.reviews.length).toFixed(1)
      : "N/A";

    rows.push([
      `#${p.id}`,
      `"${(p.title || "").replace(/"/g, '""')}"`,
      `"${p.sched_title || ""}"`,
      `"${p.track_title || ""}"`,
      `"${p.presentation_type || ""}"`,
      `"${p.status}"`,
      p.is_presented === 1 ? "SIM (Apresentado)" : "NÃO (Pendente/No-Show)",
      p.presented_at || "N/A",
      p.presented_by || "N/A",
      `"${primary?.full_name || p.author_name || ""}"`,
      `"${primary?.email || p.author_email || ""}"`,
      `"${primary?.affiliation || ""}"`,
      `"${primary?.orcid || ""}"`,
      `"${coauthors.replace(/"/g, '""')}"`,
      String(p.reviews?.length || 0),
      avgScore,
      `"${(p.funding || "Nenhum").replace(/"/g, '""')}"`,
      p.date_submitted
    ]);
  }

  // BOM UTF-8 para compatibilidade nativa com Excel
  return "\uFEFF" + rows.map(r => r.join(";")).join("\r\n");
}

export function generatePresentationsReportCsv(schedConfId?: number): string {
  const confId = schedConfId || 1;
  const schedule = getSchedule(confId);
  const rows = [
    [
      "ID Trabalho",
      "Título",
      "Trilha",
      "Modalidade",
      "Sala",
      "Prédio/Espaço",
      "Data",
      "Horário Início",
      "Horário Término",
      "Apresentadores",
      "Status de Apresentação",
      "Link da Sala Virtual"
    ]
  ];

  for (const s of schedule) {
    const paper = getPaperById(s.paper_id);
    rows.push([
      `#${s.paper_id}`,
      `"${(s.paper_title || "").replace(/"/g, '""')}"`,
      `"${s.track_title || ""}"`,
      s.modality === "online" ? "Online / Remoto" : "Presencial",
      `"${s.room_name || ""}"`,
      `"${s.building || ""}"`,
      s.date,
      s.start_time,
      s.end_time,
      `"${(s.authors || "").replace(/"/g, '""')}"`,
      paper?.is_presented === 1 ? "APRESENTADO (Presença Confirmada)" : "PENDENTE / NO-SHOW",
      `"${s.meeting_url || ""}"`
    ]);
  }

  return "\uFEFF" + rows.map(r => r.join(";")).join("\r\n");
}

export function generateMetadataReportCsv(schedConfId?: number): string {
  const confId = schedConfId || 1;
  const papers = getPublishedProceedings(confId);
  const rows = [
    [
      "ID Artigo",
      "Título do Trabalho",
      "DOI do Artigo",
      "Link Permanente Individual (Target URL)",
      "ISBN dos Anais",
      "Cidade Sede",
      "Páginas Equivalentes (Lattes)",
      "Trilha Temática",
      "Autores (com ORCID)",
      "Financiamento / Agência de Fomento",
      "Apresentação Confirmada"
    ]
  ];

  for (const p of papers) {
    const authorsStr = p.authors?.map(a => `${a.full_name} [ORCID: ${a.orcid || "N/A"}] (${a.affiliation})`).join("; ") || "";
    rows.push([
      `#${p.id}`,
      `"${(p.title || "").replace(/"/g, '""')}"`,
      p.doi ? `https://doi.org/${p.doi}` : "Em processo",
      `http://localhost:3000/paper/${p.id}`,
      p.isbn || "",
      p.city || "",
      `${p.page_start || 1} - ${p.page_end || 5}`,
      `"${p.track_title || ""}"`,
      `"${authorsStr.replace(/"/g, '""')}"`,
      `"${(p.funding || "").replace(/"/g, '""')}"`,
      p.is_presented === 1 ? "SIM" : "NÃO"
    ]);
  }

  return "\uFEFF" + rows.map(r => r.join(";")).join("\r\n");
}

// -------------------------------------------------------------
// Protocolos de Exportação e Metadados Acadêmicos (Crossref & OAI-PMH 2.0)
// -------------------------------------------------------------

export function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export { parseReferences } from "./references";
import { parseReferences } from "./references";

export function generateCrossrefXml(options?: {
  schedConfId?: number;
  paperId?: number;
  baseUrl?: string;
}): string {
  const baseUrl = options?.baseUrl || "http://localhost:3000";
  let papers: Paper[] = [];
  let schedConf: SchedConf | undefined;

  if (options?.paperId) {
    const single = getPaperById(options.paperId);
    if (single) {
      papers = [single];
      schedConf = db.prepare(`
        SELECT sc.*, c.title as conference_title, c.contact_email 
        FROM sched_confs sc 
        JOIN conferences c ON c.id = sc.conference_id 
        WHERE sc.id = ?
      `).get(single.sched_conf_id) as unknown as SchedConf | undefined;
    }
  } else {
    const confId = options?.schedConfId || 1;
    papers = getPublishedProceedings(confId);
    schedConf = db.prepare(`
      SELECT sc.*, c.title as conference_title, c.contact_email 
      FROM sched_confs sc 
      JOIN conferences c ON c.id = sc.conference_id 
      WHERE sc.id = ?
    `).get(confId) as unknown as SchedConf | undefined;
  }

  const batchId = `ocs_${schedConf?.slug || "citeca2026"}_${Date.now()}`;
  const timestamp = Date.now();
  const confTitle = schedConf?.title || "X CITECA 2026";
  const confAcronym = schedConf?.acronym || "CITECA 2026";
  const confCity = schedConf?.city || schedConf?.location || "Poços de Caldas, MG, Brasil";
  const proceedingsDoi = schedConf?.proceedings_doi || "10.1234/citeca.2026.proceedings";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch xmlns="http://www.crossref.org/schema/4.4.2"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           version="4.4.2"
           xsi:schemaLocation="http://www.crossref.org/schema/4.4.2 http://www.crossref.org/schemas/crossref4.4.2.xsd">
  <head>
    <doi_batch_id>${escapeXml(batchId)}</doi_batch_id>
    <timestamp>${timestamp}</timestamp>
    <depositor>
      <depositor_name>Open Conference Systems (OCS PKP)</depositor_name>
      <email_address>contato@citeca2026.academic.org</email_address>
    </depositor>
    <registrant>PKP Open Conference Systems</registrant>
  </head>
  <body>
    <conference>
      <event_metadata>
        <conference_name>${escapeXml(confTitle)}</conference_name>
        <conference_acronym>${escapeXml(confAcronym)}</conference_acronym>
        <conference_location>${escapeXml(confCity)}</conference_location>
        <conference_date start_day="10" start_month="11" start_year="2026" end_day="13" end_month="11" end_year="2026"/>
      </event_metadata>
      <proceedings_metadata>
        <proceedings_title>${escapeXml("Anais do " + confTitle)}</proceedings_title>
        <contributors>
          <person_name contributor_role="editor" sequence="first">
            <given_name>Carlos Eduardo</given_name>
            <surname>Dias</surname>
            <affiliation>Universidade Estadual de Campinas (UNICAMP)</affiliation>
            <ORCID>https://orcid.org/0000-0003-4567-8901</ORCID>
          </person_name>
          <person_name contributor_role="editor" sequence="additional">
            <given_name>Eduardo Augusto</given_name>
            <surname>Werneck Ribeiro</surname>
            <affiliation>Open Conference Werneckiana</affiliation>
            <ORCID>https://orcid.org/0000-0002-1825-0097</ORCID>
          </person_name>
        </contributors>
        <publisher>
          <publisher_name>${escapeXml(schedConf?.conference_title || "Universidade Federal de Alfenas")}</publisher_name>
        </publisher>
        <publication_date>
          <year>2026</year>
        </publication_date>
        ${schedConf?.isbn ? `<isbn>${escapeXml(schedConf.isbn)}</isbn>` : `<isbn>978-65-89123-45-6</isbn>`}
        <doi_data>
          <doi>${escapeXml(proceedingsDoi)}</doi>
          <resource>${escapeXml(`${baseUrl}/proceedings`)}</resource>
        </doi_data>
      </proceedings_metadata>
      ${papers.map((p) => {
        const paperDoi = p.doi || `10.1234/citeca.2026.p${String(p.id).padStart(2, "0")}`;
        const authorsList: PaperAuthor[] = (p.authors && p.authors.length > 0) 
          ? p.authors 
          : [{ full_name: "Autor OCS", affiliation: "Universidade", email: "autor@ocs.org", is_primary: 1, seq: 1 }];
        const authorsXml = authorsList
          .map((a, idx) => {
            const parts = (a.full_name || "Autor").trim().split(" ");
            const surname = parts.length > 1 ? parts.pop()! : parts[0];
            const givenName = parts.length > 0 ? parts.join(" ") : surname;
            const seq = idx === 0 ? "first" : "additional";
            let orcid = a.orcid?.trim();
            if (orcid && !orcid.startsWith("http")) {
              orcid = `https://orcid.org/${orcid}`;
            }
            return `
          <person_name sequence="${seq}" contributor_role="author">
            <given_name>${escapeXml(givenName)}</given_name>
            <surname>${escapeXml(surname)}</surname>
            <affiliation>${escapeXml(a.affiliation + (a.ror_id ? ` (ROR: ${a.ror_id})` : ""))}</affiliation>
            ${orcid ? `<ORCID authenticated="true">${escapeXml(orcid)}</ORCID>` : ""}
          </person_name>`;
          }).join("");

        return `
      <conference_paper>
        <contributors>
          ${authorsXml}
        </contributors>
        <titles>
          <title>${escapeXml(p.title)}</title>
        </titles>
        <publication_date>
          <year>2026</year>
        </publication_date>
        <jats:abstract xmlns:jats="http://www.ncbi.nlm.nih.gov/JATS1">
          <jats:p>${escapeXml(p.abstract)}</jats:p>
        </jats:abstract>
        ${p.funding ? `
        <fr:program xmlns:fr="http://www.crossref.org/fundref.xsd" name="fundref">
          <fr:assertion name="funder_name">${escapeXml(p.funding)}</fr:assertion>
        </fr:program>` : ""}
        <doi_data>
          <doi>${escapeXml(paperDoi)}</doi>
          <resource>${escapeXml(`${baseUrl}/paper/${p.id}`)}</resource>
        </doi_data>
        ${(() => {
          const refs = parseReferences(p.references_text);
          if (refs.length === 0) return "";
          return `
        <citation_list>
          ${refs.map((ref, rIdx) => `
          <citation key="ref${rIdx + 1}">
            <unstructured_citation>${escapeXml(ref.raw)}</unstructured_citation>
            ${ref.doi ? `<doi>${escapeXml(ref.doi)}</doi>` : ""}
          </citation>`).join("")}
        </citation_list>`;
        })()}
      </conference_paper>`;
      }).join("")}
    </conference>
  </body>
</doi_batch>`;

  return xml.trim();
}

export function generateOaiPmhResponse(
  verb: string | null | undefined,
  params: Record<string, string | undefined>,
  baseUrl: string = "http://localhost:3000"
): string {
  const oaiBase = `${baseUrl}/api/oai`;
  const responseDate = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const validVerbs = ["Identify", "ListMetadataFormats", "ListSets", "ListIdentifiers", "ListRecords", "GetRecord"];

  const buildRequestTag = (attrs: Record<string, string | undefined>) => {
    const attrString = Object.entries(attrs)
      .filter(([_, val]) => Boolean(val))
      .map(([key, val]) => `${key}="${escapeXml(val!)}"`)
      .join(" ");
    return `<request ${attrString}>${escapeXml(oaiBase)}</request>`;
  };

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>${responseDate}</responseDate>`;

  const footer = `\n</OAI-PMH>`;

  if (!verb || !validVerbs.includes(verb)) {
    return `${header}
  <request>${escapeXml(oaiBase)}</request>
  <error code="badVerb">Illegal or missing OAI-PMH verb: '${escapeXml(verb || "")}'</error>${footer}`;
  }

  // 1. Identify
  if (verb === "Identify") {
    return `${header}
  ${buildRequestTag({ verb: "Identify" })}
  <Identify>
    <repositoryName>Open Conference Systems (OCS 2.3.6 Academic Clone Repository)</repositoryName>
    <baseURL>${escapeXml(oaiBase)}</baseURL>
    <protocolVersion>2.0</protocolVersion>
    <adminEmail>editor@citeca2026.academic.org</adminEmail>
    <earliestDatestamp>2026-01-01T00:00:00Z</earliestDatestamp>
    <deletedRecord>no</deletedRecord>
    <granularity>YYYY-MM-DDThh:mm:ssZ</granularity>
    <description>
      <oai-identifier xmlns="http://www.openarchives.org/OAI/2.0/oai-identifier"
                      xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai-identifier http://www.openarchives.org/OAI/2.0/oai-identifier.xsd">
        <scheme>oai</scheme>
        <repositoryIdentifier>ocs.academic.org</repositoryIdentifier>
        <delimiter>:</delimiter>
        <sampleIdentifier>oai:ocs.academic.org:paper/1</sampleIdentifier>
      </oai-identifier>
    </description>
  </Identify>${footer}`;
  }

  // 2. ListMetadataFormats
  if (verb === "ListMetadataFormats") {
    return `${header}
  ${buildRequestTag({ verb: "ListMetadataFormats", identifier: params.identifier })}
  <ListMetadataFormats>
    <metadataFormat>
      <metadataPrefix>oai_dc</metadataPrefix>
      <schema>http://www.openarchives.org/OAI/2.0/oai_dc.xsd</schema>
      <metadataNamespace>http://www.openarchives.org/OAI/2.0/oai_dc/</metadataNamespace>
    </metadataFormat>
    <metadataFormat>
      <metadataPrefix>cr_xml</metadataPrefix>
      <schema>http://www.crossref.org/schemas/crossref4.4.2.xsd</schema>
      <metadataNamespace>http://www.crossref.org/schema/4.4.2</metadataNamespace>
    </metadataFormat>
  </ListMetadataFormats>${footer}`;
  }

  // 3. ListSets
  if (verb === "ListSets") {
    return `${header}
  ${buildRequestTag({ verb: "ListSets" })}
  <ListSets>
    <set>
      <setSpec>proceedings:citeca2026</setSpec>
      <setName>Anais do X CITECA 2026 - Conferência Internacional de Tecnologia e Educação</setName>
      <setDescription>
        <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
                   xmlns:dc="http://purl.org/dc/elements/1.1/">
          <dc:description>Artigos científicos completos aprovados e publicados nos anais oficiais.</dc:description>
        </oai_dc:dc>
      </setDescription>
    </set>
  </ListSets>${footer}`;
  }

  const prefix = params.metadataPrefix;
  if (prefix && prefix !== "oai_dc" && prefix !== "cr_xml") {
    return `${header}
  ${buildRequestTag({ verb, metadataPrefix: prefix })}
  <error code="cannotDisseminateFormat">The metadata format '${escapeXml(prefix)}' is not supported by this repository. Use 'oai_dc'.</error>${footer}`;
  }

  // Helper para renderizar registro individual DC
  const renderRecordDc = (paper: Paper) => {
    const paperUrl = `${baseUrl}/paper/${paper.id}`;
    const doiUrl = paper.doi ? `https://doi.org/${paper.doi}` : paperUrl;
    const authorsDc = (paper.authors || []).map(a => {
      let val = a.full_name;
      if (a.affiliation) val += ` (${a.affiliation})`;
      if (a.orcid) val += ` [ORCID: ${a.orcid}]`;
      return `<dc:creator>${escapeXml(val)}</dc:creator>`;
    }).join("\n        ");

    const keywordsDc = (paper.keywords || "")
      .split(",")
      .map(k => k.trim())
      .filter(Boolean)
      .map(k => `<dc:subject>${escapeXml(k)}</dc:subject>`)
      .join("\n        ");

    return `
    <record>
      <header>
        <identifier>oai:ocs.academic.org:paper/${paper.id}</identifier>
        <datestamp>${escapeXml(paper.date_submitted ? paper.date_submitted.split(" ")[0] + "T00:00:00Z" : "2026-10-15T00:00:00Z")}</datestamp>
        <setSpec>proceedings:citeca2026</setSpec>
      </header>
      <metadata>
        <oai_dc:dc 
           xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
           xmlns:dc="http://purl.org/dc/elements/1.1/"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
          <dc:title>${escapeXml(paper.title)}</dc:title>
          ${authorsDc}
          ${keywordsDc}
          <dc:description>${escapeXml(paper.abstract)}</dc:description>
          <dc:publisher>PKP Open Conference Systems - Universidade Federal de Alfenas</dc:publisher>
          <dc:date>2026</dc:date>
          <dc:type>info:eu-repo/semantics/conferenceObject</dc:type>
          <dc:type>Conference Proceedings Paper</dc:type>
          <dc:format>application/pdf</dc:format>
          <dc:identifier>${escapeXml(doiUrl)}</dc:identifier>
          <dc:identifier>${escapeXml(paperUrl)}</dc:identifier>
          ${paper.isbn ? `<dc:identifier>urn:isbn:${escapeXml(paper.isbn)}</dc:identifier>` : ""}
          <dc:source>${escapeXml("Anais do " + (paper.sched_title || "X CITECA 2026") + ", " + (paper.city || "Poços de Caldas, MG, Brasil") + (paper.isbn ? ` (ISBN: ${paper.isbn})` : ""))}</dc:source>
          <dc:language>por</dc:language>
          <dc:rights>info:eu-repo/semantics/openAccess</dc:rights>
          <dc:rights>Creative Commons Attribution 4.0 International (CC BY 4.0)</dc:rights>
          ${paper.funding ? `<dc:relation>${escapeXml("Financiamento: " + paper.funding)}</dc:relation>` : ""}
          ${parseReferences(paper.references_text).map(ref => `<dc:relation>${escapeXml("Referência citada: " + ref.raw)}</dc:relation>`).join("\n          ")}
        </oai_dc:dc>
      </metadata>
    </record>`;
  };

  // 4. GetRecord
  if (verb === "GetRecord") {
    if (!prefix) {
      return `${header}
  ${buildRequestTag({ verb, identifier: params.identifier })}
  <error code="badArgument">missing required argument 'metadataPrefix'</error>${footer}`;
    }
    const rawId = params.identifier || "";
    const idMatch = rawId.match(/(\d+)$/);
    const paperId = idMatch ? parseInt(idMatch[1], 10) : parseInt(rawId, 10);

    const paper = paperId ? getPaperById(paperId) : null;
    if (!paper || paper.status !== "published") {
      return `${header}
  ${buildRequestTag({ verb, identifier: rawId, metadataPrefix: prefix })}
  <error code="idDoesNotExist">No matching record found for identifier '${escapeXml(rawId)}'</error>${footer}`;
    }

    return `${header}
  ${buildRequestTag({ verb, identifier: rawId, metadataPrefix: prefix })}
  <GetRecord>
    ${renderRecordDc(paper)}
  </GetRecord>${footer}`;
  }

  // 5. ListIdentifiers
  if (verb === "ListIdentifiers") {
    if (!prefix) {
      return `${header}
  ${buildRequestTag({ verb })}
  <error code="badArgument">missing required argument 'metadataPrefix'</error>${footer}`;
    }
    const papers = getPublishedProceedings();
    return `${header}
  ${buildRequestTag({ verb, metadataPrefix: prefix })}
  <ListIdentifiers>
    ${papers.map(p => `
    <header>
      <identifier>oai:ocs.academic.org:paper/${p.id}</identifier>
      <datestamp>${escapeXml(p.date_submitted ? p.date_submitted.split(" ")[0] + "T00:00:00Z" : "2026-10-15T00:00:00Z")}</datestamp>
      <setSpec>proceedings:citeca2026</setSpec>
    </header>`).join("")}
  </ListIdentifiers>${footer}`;
  }

  // 6. ListRecords
  if (verb === "ListRecords") {
    if (!prefix) {
      return `${header}
  ${buildRequestTag({ verb })}
  <error code="badArgument">missing required argument 'metadataPrefix'</error>${footer}`;
    }
    const papers = getPublishedProceedings();
    return `${header}
  ${buildRequestTag({ verb, metadataPrefix: prefix })}
  <ListRecords>
    ${papers.map(renderRecordDc).join("")}
  </ListRecords>${footer}`;
  }

  return `${header}
  <request>${escapeXml(oaiBase)}</request>
  <error code="badVerb">Unknown verb: '${escapeXml(verb)}'</error>${footer}`;
}

export function createConference(data: {
  title: string;
  acronym: string;
  slug: string;
  city: string;
  location?: string;
  start_date: string;
  end_date: string;
  cfp_deadline: string;
  review_deadline: string;
  results_date: string;
  proceedings_doi?: string;
  isbn?: string;
  description: string;
}): { conferenceId: number; schedConfId: number } {
  // 1. Inserir conferência principal
  const confResult = db.prepare(`
    INSERT INTO conferences (slug, title, acronym, description, contact_name, contact_email)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.slug,
    data.title,
    data.acronym,
    data.description,
    "Comissão Organizadora",
    `contato@${data.slug}.org`
  );
  const conferenceId = Number(confResult.lastInsertRowid);

  // 2. Inserir edição agendada dos anais
  const schedResult = db.prepare(`
    INSERT INTO sched_confs (
      conference_id, slug, title, acronym, location, city, proceedings_doi, isbn,
      start_date, end_date, cfp_deadline, review_deadline, results_date, description, is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    conferenceId,
    data.slug,
    data.title,
    data.acronym,
    data.location || data.city,
    data.city,
    data.proceedings_doi || `10.5281/zenodo.${data.slug}`,
    data.isbn || "978-65-89123-99-9",
    data.start_date,
    data.end_date,
    data.cfp_deadline,
    data.review_deadline,
    data.results_date,
    data.description
  );
  const schedConfId = Number(schedResult.lastInsertRowid);

  // 3. Criar trilhas temáticas padrão
  db.prepare(`
    INSERT INTO tracks (sched_conf_id, title, abbreviation, description, max_words)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    schedConfId,
    "Trilha 1: Inteligência Artificial, Dados e Ciência Aberta",
    "IA-CA",
    "Estudos computacionais, modelos de linguagem e protocolos de Ciência Aberta",
    2000
  );

  db.prepare(`
    INSERT INTO tracks (sched_conf_id, title, abbreviation, description, max_words)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    schedConfId,
    "Trilha 2: Educação, Inovação e Tecnologias Contemporâneas",
    "ED-INOV",
    "Práticas pedagógicas, inovação acadêmica e comunicação científica",
    2000
  );

  return { conferenceId, schedConfId };
}

export function updateUserRole(userId: number, role: string): boolean {
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
  return true;
}


