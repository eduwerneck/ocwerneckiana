import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.OCW_DB_PATH = ":memory:";
process.env.OCW_AUTO_SEED = "false";

const { default: db, seedDatabaseIfEmpty } = await import("../src/lib/db.ts");
const {
  getActiveSchedConf,
  assignReviewer,
  submitReview,
  recordEditorialDecision,
  submitAuthorRevision,
  generateCrossrefXml,
  generateOaiPmhResponse,
  createConference,
  updateConferenceEdition,
  updateUserRole,
  approveReviewerCandidate,
  searchRegisteredUsers,
  getRegisteredUsersByIds,
} = await import("../src/lib/ocs-service.ts");

seedDatabaseIfEmpty({ force: true });

describe("Marco 2 — Máquina de Estados Editorial & Multi-Rodada", () => {
  it("assignReviewer bloqueia conflito de interesse (autor/coautor do trabalho)", () => {
    // Usuário 6 (Dr. Lucas Martins) é autor do artigo 4
    assert.throws(
      () => assignReviewer(4, 6),
      /Conflito de interesse/i
    );
  });

  it("submitReview não sobrescreve papers.status diretamente e bloqueia reenvio duplicado", () => {
    const assignmentId = assignReviewer(4, 4); // reviewer1 no artigo 4
    submitReview({
      assignment_id: assignmentId,
      recommendation: "revisions",
      score_originality: 4,
      score_methodology: 4,
      score_clarity: 4,
      score_relevance: 4,
      comments_author: "Ajustar metodologia.",
      comments_director: "Revisão menor.",
    });

    const paperAfterReview = db.prepare("SELECT status FROM papers WHERE id = 4").get() as { status: string };
    assert.equal(paperAfterReview.status, "under_review");

    // Reenvio na mesma atribuição já concluída deve falhar
    assert.throws(
      () =>
        submitReview({
          assignment_id: assignmentId,
          recommendation: "accept",
          score_originality: 5,
          score_methodology: 5,
          score_clarity: 5,
          score_relevance: 5,
          comments_author: "Novo envio",
          comments_director: "",
        }),
      /já foi concluído/i
    );
  });

  it("submitAuthorRevision exige status revisions_required e suporta Rodada 2 e Rodada 3+", () => {
    // Ainda em under_review -> deve recusar
    assert.throws(
      () => submitAuthorRevision({ paper_id: 4, revised_file_name: "r2.pdf", author_response: "Resposta" }),
      /revisões requeridas/i
    );

    // Diretor solicita revisões -> status vira revisions_required
    recordEditorialDecision({
      paper_id: 4,
      director_id: 3,
      decision: "revisions",
      comments: "Favor revisar seção 2.",
    });

    const r2 = submitAuthorRevision({
      paper_id: 4,
      revised_file_name: "artigo4_r2.pdf",
      author_response: "Ajustes da rodada 2 aplicados.",
    });
    assert.equal(r2.nextRound, 2);

    // Parecerista completa rodada 2
    const r2Assign = db.prepare("SELECT id FROM review_assignments WHERE paper_id = 4 AND reviewer_id = 4 AND round = 2").get() as { id: number };
    assert.ok(r2Assign);
    submitReview({
      assignment_id: r2Assign.id,
      recommendation: "revisions",
      score_originality: 4,
      score_methodology: 4,
      score_clarity: 4,
      score_relevance: 4,
      comments_author: "Mais um ajuste.",
      comments_director: "",
    });

    // Diretor pede nova revisão -> autor envia Rodada 3!
    recordEditorialDecision({
      paper_id: 4,
      director_id: 3,
      decision: "revisions",
      comments: "Último ajuste.",
    });
    const r3 = submitAuthorRevision({
      paper_id: 4,
      revised_file_name: "artigo4_r3.pdf",
      author_response: "Ajustes da rodada 3 aplicados.",
    });
    assert.equal(r3.nextRound, 3);
  });
});

describe("Marco 2 — Multi-Conferência, Crossref 4.4.2 & OAI-PMH 2.0", () => {
  it("getActiveSchedConf retorna edição solicitada ou ativa padrão", () => {
    const active = getActiveSchedConf();
    assert.ok(active);
    assert.equal(active.is_active, 1);

    const specific = getActiveSchedConf(2);
    assert.ok(specific);
    assert.equal(specific.id, 2);
  });

  it("createConference cria conferência, edição e trilhas atomicamente e generateCrossrefXml usa datas dinâmicas", () => {
    const created = createConference({
      title: "Congresso Teste 2028",
      acronym: "CT2028",
      slug: "ct2028",
      city: "Florianópolis, SC",
      start_date: "2028-05-12",
      end_date: "2028-05-15",
      cfp_deadline: "2028-02-01",
      review_deadline: "2028-03-01",
      results_date: "2028-04-01",
      proceedings_doi: "10.9999/ct2028",
      isbn: "978-65-00000-01-0",
      description: "Conferência de teste.",
    });

    const xml = generateCrossrefXml({ schedConfId: created.schedConfId, baseUrl: "https://ocw.example.org" });
    assert.equal(xml.includes('start_day="12" start_month="05" start_year="2028"'), true);
    assert.equal(xml.includes('end_day="15" end_month="05" end_year="2028"'), true);
    assert.equal(xml.includes("<year>2028</year>"), true);
    assert.equal(xml.includes("978-65-00000-01-0"), true);
    assert.equal(xml.includes("Eduardo Augusto"), false);
  });

  it("OAI-PMH 2.0 anuncia apenas oai_dc, filtra set/from/until e retorna códigos de erro conformes", () => {
    const formats = generateOaiPmhResponse("ListMetadataFormats", {}, "https://ocw.example.org");
    assert.equal(formats.includes("<metadataPrefix>oai_dc</metadataPrefix>"), true);
    assert.equal(formats.includes("cr_xml"), false);

    const sets = generateOaiPmhResponse("ListSets", {}, "https://ocw.example.org");
    assert.equal(sets.includes("proceedings:citeca:2026"), true);
    assert.equal(sets.includes("proceedings:citeca:2025"), true);

    const filtered = generateOaiPmhResponse("ListIdentifiers", { metadataPrefix: "oai_dc", set: "proceedings:citeca:2025" }, "https://ocw.example.org");
    assert.equal(filtered.includes("paper/5"), true);
    assert.equal(filtered.includes("paper/1"), false);

    const empty = generateOaiPmhResponse("ListRecords", { metadataPrefix: "oai_dc", from: "2099-01-01" }, "https://ocw.example.org");
    assert.equal(empty.includes('code="noRecordsMatch"'), true);

    const badDate = generateOaiPmhResponse("ListRecords", { metadataPrefix: "oai_dc", from: "invalid-date" }, "https://ocw.example.org");
    assert.equal(badDate.includes('code="badArgument"'), true);

    const badToken = generateOaiPmhResponse("ListRecords", { resumptionToken: "abc" }, "https://ocw.example.org");
    assert.equal(badToken.includes('code="badResumptionToken"'), true);
  });
});

describe("Entrega A/B — Schema v2 (ROR/OAuth), Aprovação de Avaliador e Trava de Último Admin", () => {
  it("migração v2 adiciona ror_id, academic_title, reviewer_status, google_id e auth_provider", () => {
    const cols = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const names = new Set(cols.map((c) => c.name));
    assert.equal(names.has("ror_id"), true);
    assert.equal(names.has("academic_title"), true);
    assert.equal(names.has("reviewer_status"), true);
    assert.equal(names.has("google_id"), true);
    assert.equal(names.has("auth_provider"), true);
  });

  it("approveReviewerCandidate aprova candidato a avaliador", () => {
    // Usuário 7 (coauthor) nasce como author
    db.prepare("UPDATE users SET is_reviewer_candidate = 1, reviewer_status = 'pending' WHERE id = 7").run();
    approveReviewerCandidate(7, true);
    const updated = db.prepare("SELECT role, reviewer_status, is_reviewer_candidate FROM users WHERE id = 7").get() as {
      role: string;
      reviewer_status: string;
      is_reviewer_candidate: number;
    };
    assert.equal(updated.role, "reviewer");
    assert.equal(updated.reviewer_status, "approved");
    assert.equal(updated.is_reviewer_candidate, 1);
  });

  it("updateUserRole impede remover o último administrador ativo do sistema", () => {
    // Rebaixa admin (1) e manager (2) -> resta apenas director (3)
    updateUserRole(1, "author");
    updateUserRole(2, "author");
    assert.throws(
      () => updateUserRole(3, "author"),
      /último administrador ativo/i
    );
  });

  it("searchRegisteredUsers e getRegisteredUsersByIds retornam autores cadastrados na ordem correta", () => {
    const found = searchRegisteredUsers("Lucas", []);
    assert.equal(found.length > 0, true);
    assert.equal(found.some((u) => u.id === 6), true);

    const excluded = searchRegisteredUsers("Lucas", [6]);
    assert.equal(excluded.some((u) => u.id === 6), false);

    const ordered = getRegisteredUsersByIds([7, 6]);
    assert.equal(ordered.length, 2);
    assert.equal(ordered[0].id, 7);
    assert.equal(ordered[1].id, 6);
  });

  it("updateConferenceEdition atualiza título, cidade, datas, ISBN e DOI atomicamente", () => {
    const created = createConference({
      title: "Evento Teste Original",
      acronym: "ETO 2027",
      slug: "eto2027",
      city: "Curitiba, PR",
      start_date: "2027-05-01",
      end_date: "2027-05-03",
      cfp_deadline: "2027-02-01",
      review_deadline: "2027-03-01",
      results_date: "2027-04-01",
      isbn: "978-65-00000-00-1",
      proceedings_doi: "10.5281/zenodo.111",
      description: "Descrição inicial",
    });

    const { slug } = updateConferenceEdition({
      conference_id: created.conferenceId,
      sched_conf_id: created.schedConfId,
      title: "Evento Teste Atualizado",
      acronym: "ETA 2027",
      city: "Belo Horizonte, MG",
      location: "Campus Pampulha",
      start_date: "2027-06-10",
      end_date: "2027-06-12",
      cfp_deadline: "2027-03-10",
      review_deadline: "2027-04-10",
      results_date: "2027-05-10",
      isbn: "978-65-99999-99-9",
      proceedings_doi: "10.5281/zenodo.999",
      description: "Descrição atualizada",
    });

    assert.equal(slug, "eto2027");
    const updatedSched = getActiveSchedConf(created.schedConfId);
    assert.equal(updatedSched?.title, "Evento Teste Atualizado");
    assert.equal(updatedSched?.city, "Belo Horizonte, MG");
    assert.equal(updatedSched?.isbn, "978-65-99999-99-9");
    assert.equal(updatedSched?.proceedings_doi, "10.5281/zenodo.999");
  });
});
