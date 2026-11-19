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
