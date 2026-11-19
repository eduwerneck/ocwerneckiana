import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Configurar banco em memória ANTES de importar db.ts
process.env.OCW_DB_PATH = ":memory:";
process.env.OCW_AUTO_SEED = "false";

const { escapeHtml, escapeCsvCell, sanitizeNextPath, getAppBaseUrl } = await import("../src/lib/security.ts");
const { hashPassword, verifyPassword } = await import("../src/lib/password.ts");
const { default: db, seedDatabaseIfEmpty } = await import("../src/lib/db.ts");
const {
  createSessionRecord,
  getSessionUserByToken,
  deleteSessionByToken,
  revokeUserSessions,
  authenticateCredentials,
  checkLoginRateLimit,
  clearLoginRateLimit,
} = await import("../src/lib/auth-core.ts");
const {
  getPaperForPublic,
  getPaperForAuthor,
  getPaperForReviewer,
  getPaperForDirector,
  getSubmissionsForAuthor,
  generateSubmissionsReportCsv,
} = await import("../src/lib/ocs-service.ts");

describe("Marco 1 — Utilitários de Segurança", () => {
  it("escapeHtml neutraliza payloads de XSS", () => {
    const payload = `<img src=x onerror="alert('xss')">&`;
    const escaped = escapeHtml(payload);
    assert.equal(escaped.includes("<"), false);
    assert.equal(escaped.includes(">"), false);
    assert.equal(escaped, "&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;&amp;");
  });

  it("escapeCsvCell neutraliza fórmulas Excel/LibreOffice e escapa aspas", () => {
    assert.equal(escapeCsvCell(`=CMD|' /C calc'!A0`), `"'=CMD|' /C calc'!A0"`);
    assert.equal(escapeCsvCell(`+SUM(A1:A2)`), `"'+SUM(A1:A2)"`);
    assert.equal(escapeCsvCell(`-1+1`), `"'-1+1"`);
    assert.equal(escapeCsvCell(`@SUM(1,2)`), `"'@SUM(1,2)"`);
    assert.equal(escapeCsvCell(`Título "com aspas"`), `"Título ""com aspas"""`);
  });

  it("sanitizeNextPath bloqueia Open Redirect", () => {
    assert.equal(sanitizeNextPath("/dashboard/director"), "/dashboard/director");
    assert.equal(sanitizeNextPath("//evil.com/phish"), "/dashboard/user");
    assert.equal(sanitizeNextPath("https://evil.com"), "/dashboard/user");
    assert.equal(sanitizeNextPath("/\\evil.com"), "/dashboard/user");
  });

  it("getAppBaseUrl usa NEXT_PUBLIC_APP_URL quando configurado", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://ocw.universidade.edu.br/";
    assert.equal(getAppBaseUrl(), "https://ocw.universidade.edu.br");
    delete process.env.NEXT_PUBLIC_APP_URL;
  });
});

describe("Marco 1 — Banco, Auto-Seed e Autenticação", () => {
  it("não executa auto-seed quando OCW_AUTO_SEED=false", () => {
    const row = db.prepare("SELECT COUNT(*) as count FROM conferences").get() as { count: number };
    assert.equal(row.count, 0);
  });

  it("executa seed controlado apenas com force=true em testes e cria senhas hasheadas", () => {
    const seeded = seedDatabaseIfEmpty({ force: true });
    assert.equal(seeded, true);
    // Segunda chamada deve ser no-op
    assert.equal(seedDatabaseIfEmpty({ force: true }), false);

    const user = authenticateCredentials("director", "ocw-demo-2026");
    assert.ok(user);
    assert.equal(user.role, "director");
    assert.equal(authenticateCredentials("director", "senha-errada"), null);
  });

  it("hashPassword/verifyPassword usa scrypt com salt único", () => {
    const h1 = hashPassword("MinhaSenhaForte123");
    const h2 = hashPassword("MinhaSenhaForte123");
    assert.notEqual(h1, h2);
    assert.equal(verifyPassword("MinhaSenhaForte123", h1), true);
    assert.equal(verifyPassword("OutraSenha", h1), false);
  });

  it("ciclo de vida de sessão: criação, leitura, expiração e revogação", () => {
    const { rawToken } = createSessionRecord(6);
    const sessionUser = getSessionUserByToken(rawToken);
    assert.ok(sessionUser);
    assert.equal(sessionUser.id, 6);

    // Token cru NÃO está armazenado em sessions (apenas SHA-256)
    const rawRow = db.prepare("SELECT token_hash FROM sessions WHERE token_hash = ?").get(rawToken);
    assert.equal(rawRow, undefined);

    revokeUserSessions(6);
    assert.equal(getSessionUserByToken(rawToken), null);

    // Sessão expirada
    const expired = createSessionRecord(6, -1000);
    assert.equal(getSessionUserByToken(expired.rawToken), null);

    // Logout individual
    const s2 = createSessionRecord(6);
    deleteSessionByToken(s2.rawToken);
    assert.equal(getSessionUserByToken(s2.rawToken), null);
  });

  it("rate limit bloqueia após 10 tentativas", () => {
    const key = "teste-rate-limit";
    clearLoginRateLimit(key);
    for (let i = 0; i < 10; i++) {
      assert.equal(checkLoginRateLimit(key).allowed, true);
    }
    assert.equal(checkLoginRateLimit(key).allowed, false);
    clearLoginRateLimit(key);
  });
});

describe("Marco 1 — Sigilo Duplo-Cego e Proteção de Dados", () => {
  it("getSubmissionsForAuthor nunca expõe reviewer_name, reviewer_affiliation ou comments_director", () => {
    const papers = getSubmissionsForAuthor(6);
    assert.ok(papers.length > 0);
    for (const p of papers) {
      for (const r of p.reviews || []) {
        assert.equal(r.reviewer_name, undefined);
        assert.equal(r.reviewer_affiliation, undefined);
        assert.equal(r.comments_director, undefined);
        assert.equal(r.reviewer_id, 0);
      }
    }
  });

  it("getPaperForAuthor oculta identidade dos revisores e comentários ao diretor", () => {
    const paper = getPaperForAuthor(1, 6);
    assert.ok(paper);
    assert.ok((paper.reviews || []).length > 0);
    for (const r of paper.reviews || []) {
      assert.equal(r.reviewer_name, undefined);
      assert.equal(r.comments_director, undefined);
    }
    // Outro usuário não dono recebe null
    assert.equal(getPaperForAuthor(1, 4), null);
  });

  it("getPaperForReviewer oculta autoria do manuscrito (duplo-cego)", () => {
    const paper = getPaperForReviewer(1, 4);
    assert.ok(paper);
    assert.deepEqual(paper.authors, []);
    assert.equal(paper.author_name, undefined);
    assert.equal(paper.author_email, undefined);
    assert.equal(paper.user_id, 0);
  });

  it("getPaperForPublic retorna apenas artigos publicados e apresentados, sem pareceres", () => {
    const pub = getPaperForPublic(1);
    assert.ok(pub);
    assert.equal(pub.reviews, undefined);
    assert.equal(pub.decision, undefined);

    // Artigo 2 é accepted (não publicado) -> deve retornar null para público
    assert.equal(getPaperForPublic(2), null);
    // Diretor vê normalmente
    assert.ok(getPaperForDirector(2));
  });

  it("generateSubmissionsReportCsv neutraliza células iniciadas por fórmula", () => {
    db.prepare("UPDATE papers SET title = '=HYPERLINK(\"http://evil.com\")' WHERE id = 4").run();
    const csv = generateSubmissionsReportCsv(1);
    assert.equal(csv.includes(`"'=HYPERLINK(""http://evil.com"")"`), true);
  });
});
