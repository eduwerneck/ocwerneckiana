import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { hashPassword } from "./password.ts";

// Topologia suportada em produção: servidor com disco persistente (VPS/Docker).
// Em testes automatizados, use OCW_DB_PATH=":memory:" ou arquivo temporário.
const configuredDbPath = process.env.OCW_DB_PATH?.trim();
const isMemoryDb = configuredDbPath === ":memory:";

let dbPath: string;
if (isMemoryDb) {
  dbPath = ":memory:";
} else if (configuredDbPath) {
  const dir = path.dirname(configuredDbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  dbPath = configuredDbPath;
} else {
  const isVercel = Boolean(process.env.VERCEL);
  const baseDir = isVercel ? path.join("/tmp") : process.cwd();
  const dataDir = path.join(baseDir, "data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (e) {
      console.warn("Aviso ao criar dataDir:", e);
    }
  }
  dbPath = path.join(dataDir, "ocs.db");
}

const db = new DatabaseSync(dbPath);
try {
  db.exec("PRAGMA busy_timeout = 20000;");
  if (!isMemoryDb) {
    db.exec("PRAGMA journal_mode = WAL;");
  }
  db.exec("PRAGMA foreign_keys = ON;");
} catch {
  // Ignorar se já configurado
}

/**
 * Executa um bloco síncrono em transação SQLite (BEGIN IMMEDIATE / COMMIT / ROLLBACK).
 * Não chamar funções assíncronas (ex.: envio SMTP) dentro de `fn`.
 */
export function runInTransaction<T>(fn: () => T): T {
  db.exec("BEGIN IMMEDIATE;");
  try {
    const result = fn();
    db.exec("COMMIT;");
    return result;
  } catch (err) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // Ignorar erro secundário de rollback
    }
    throw err;
  }
}

function hasColumn(table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === column);
}

function ensureColumn(table: string, column: string, definition: string): void {
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRows = db.prepare("SELECT version FROM schema_migrations").all() as Array<{ version: number }>;
  const applied = new Set(appliedRows.map((r) => r.version));

  const applyMigration = (version: number, fn: () => void) => {
    if (applied.has(version)) return;
    runInTransaction(() => {
      const check = db.prepare("SELECT version FROM schema_migrations WHERE version = ?").get(version);
      if (check) return;
      fn();
      db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(version);
    });
    applied.add(version);
  };

  // Migração v0: Schema base completo + colunas históricas idempotentes
  applyMigration(0, () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS conferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        acronym TEXT NOT NULL,
        description TEXT,
        contact_name TEXT,
        contact_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sched_confs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conference_id INTEGER NOT NULL,
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        acronym TEXT NOT NULL,
        location TEXT,
        city TEXT,
        proceedings_doi TEXT,
        isbn TEXT,
        start_date TEXT,
        end_date TEXT,
        cfp_deadline TEXT,
        review_deadline TEXT,
        results_date TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
        UNIQUE(conference_id, slug)
      );

      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sched_conf_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        abbreviation TEXT,
        description TEXT,
        max_words INTEGER DEFAULT 6000,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        affiliation TEXT,
        role TEXT NOT NULL DEFAULT 'author',
        bio TEXT,
        password_hash TEXT,
        is_reviewer_candidate INTEGER DEFAULT 0,
        review_interests TEXT,
        preferred_track_ids TEXT,
        lattes_url TEXT,
        orcid TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS papers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sched_conf_id INTEGER NOT NULL,
        track_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        abstract TEXT NOT NULL,
        keywords TEXT,
        presentation_type TEXT DEFAULT 'oral',
        status TEXT NOT NULL DEFAULT 'submitted',
        doi TEXT,
        isbn TEXT,
        funding TEXT,
        file_name TEXT,
        file_size INTEGER,
        file_type TEXT,
        comments_to_director TEXT,
        revised_file_name TEXT,
        author_response TEXT,
        current_round INTEGER DEFAULT 1,
        references_text TEXT,
        references_style TEXT DEFAULT 'abnt',
        section_intro TEXT,
        section_methods TEXT,
        section_results TEXT,
        section_conclusion TEXT,
        figures_json TEXT,
        page_start INTEGER DEFAULT 1,
        page_end INTEGER DEFAULT 5,
        is_presented INTEGER DEFAULT 0,
        presented_at DATETIME,
        presented_by TEXT,
        date_submitted DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_decided DATETIME,
        FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES tracks(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS paper_authors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paper_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        affiliation TEXT,
        orcid TEXT,
        ror_id TEXT,
        credit_roles TEXT,
        is_primary INTEGER DEFAULT 0,
        seq INTEGER DEFAULT 1,
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS review_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paper_id INTEGER NOT NULL,
        reviewer_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        recommendation TEXT,
        round INTEGER DEFAULT 1,
        author_response TEXT,
        revised_file_name TEXT,
        score_originality INTEGER,
        score_methodology INTEGER,
        score_clarity INTEGER,
        score_relevance INTEGER,
        comments_author TEXT,
        comments_director TEXT,
        date_assigned DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_completed DATETIME,
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS edit_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paper_id INTEGER NOT NULL,
        director_id INTEGER NOT NULL,
        decision TEXT NOT NULL,
        comments TEXT,
        date_decided DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
        FOREIGN KEY (director_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sched_conf_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        building TEXT,
        capacity INTEGER,
        FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS time_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sched_conf_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        title TEXT NOT NULL,
        FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS scheduled_presentations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sched_conf_id INTEGER NOT NULL,
        paper_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        time_block_id INTEGER NOT NULL,
        start_time TEXT,
        end_time TEXT,
        modality TEXT DEFAULT 'presential',
        meeting_url TEXT,
        meeting_instructions TEXT,
        FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE,
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (time_block_id) REFERENCES time_blocks(id)
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sched_conf_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        affiliation TEXT,
        category TEXT NOT NULL,
        status TEXT DEFAULT 'confirmed',
        date_registered DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conference_id INTEGER NOT NULL,
        sched_conf_id INTEGER,
        title TEXT NOT NULL,
        summary TEXT,
        content TEXT NOT NULL,
        date_posted DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
        FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        template_type TEXT NOT NULL,
        content_html TEXT NOT NULL,
        content_text TEXT NOT NULL,
        status TEXT NOT NULL,
        metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        certificate_code TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        paper_id INTEGER,
        sched_conf_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        description TEXT NOT NULL,
        verification_url TEXT,
        issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
        FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Garantir colunas adicionadas historicamente em bancos SQLite legados
    ensureColumn("review_assignments", "round", "INTEGER DEFAULT 1");
    ensureColumn("review_assignments", "author_response", "TEXT");
    ensureColumn("review_assignments", "revised_file_name", "TEXT");
    ensureColumn("papers", "revised_file_name", "TEXT");
    ensureColumn("papers", "author_response", "TEXT");
    ensureColumn("papers", "current_round", "INTEGER DEFAULT 1");
    ensureColumn("papers", "is_presented", "INTEGER DEFAULT 0");
    ensureColumn("papers", "presented_at", "DATETIME");
    ensureColumn("papers", "presented_by", "TEXT");
    ensureColumn("papers", "references_text", "TEXT");
    ensureColumn("papers", "references_style", "TEXT DEFAULT 'abnt'");
    ensureColumn("papers", "isbn", "TEXT");
    ensureColumn("papers", "section_intro", "TEXT");
    ensureColumn("papers", "section_methods", "TEXT");
    ensureColumn("papers", "section_results", "TEXT");
    ensureColumn("papers", "section_conclusion", "TEXT");
    ensureColumn("papers", "figures_json", "TEXT");
    ensureColumn("papers", "page_start", "INTEGER DEFAULT 1");
    ensureColumn("papers", "page_end", "INTEGER DEFAULT 5");
    ensureColumn("sched_confs", "isbn", "TEXT");
    ensureColumn("scheduled_presentations", "modality", "TEXT DEFAULT 'presential'");
    ensureColumn("scheduled_presentations", "meeting_url", "TEXT");
    ensureColumn("scheduled_presentations", "meeting_instructions", "TEXT");
    ensureColumn("users", "is_reviewer_candidate", "INTEGER DEFAULT 0");
    ensureColumn("users", "review_interests", "TEXT");
    ensureColumn("users", "preferred_track_ids", "TEXT");
    ensureColumn("users", "lattes_url", "TEXT");
    ensureColumn("users", "orcid", "TEXT");
  });

  // Migração v1: Autenticação real (sessions + password_hash), backfill de is_presented e purga de smtp_pass
  applyMigration(1, () => {
    ensureColumn("users", "password_hash", "TEXT");
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `);
    // Backfill único para não ocultar artigos já publicados antes da trava estrita is_presented = 1
    db.exec("UPDATE papers SET is_presented = 1 WHERE status = 'published' AND is_presented IS NULL;");
    // Purga de senha SMTP armazenada em texto puro em bancos legados
    db.exec("DELETE FROM app_settings WHERE key = 'smtp_pass';");
  });
}

runMigrations();

/**
 * Popula dados de exemplo SOMENTE quando OCW_AUTO_SEED === "true" E a tabela conferences estiver vazia.
 * Em testes, pode ser chamada com `{ force: true }` em banco `:memory:`.
 */
export function seedDatabaseIfEmpty(options?: { force?: boolean }): boolean {
  if (!options?.force && process.env.OCW_AUTO_SEED !== "true") {
    return false;
  }

  const countRow = db.prepare("SELECT COUNT(*) as count FROM conferences").get() as { count: number } | undefined;
  if (countRow && countRow.count > 0) {
    return false;
  }

  return runInTransaction(() => {
    const doubleCheck = db.prepare("SELECT COUNT(*) as count FROM conferences").get() as { count: number } | undefined;
    if (doubleCheck && doubleCheck.count > 0) {
      return false;
    }

    const demoPassHash = hashPassword("ocw-demo-2026");

    const insertUser = db.prepare(`
      INSERT INTO users (username, email, full_name, affiliation, role, bio, password_hash, is_reviewer_candidate, review_interests, preferred_track_ids, orcid, lattes_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run("admin", "admin@pkp-ocs.org", "Administrador Geral OCS", "Public Knowledge Project", "admin", "Administrador do Portal PKP OCS", demoPassHash, 0, null, null, null, null);
    insertUser.run("manager", "gerente@citeca.org", "Profa. Dra. Mariana Silveira", "Universidade de São Paulo (USP)", "manager", "Gerente Geral da Conferência", demoPassHash, 0, null, null, null, null);
    insertUser.run("director", "diretor@citeca.org", "Prof. Dr. Carlos Eduardo Dias", "Unicamp / SBC", "director", "Diretor do Comitê de Programa e Avaliações", demoPassHash, 0, null, null, null, null);
    insertUser.run("reviewer1", "parecerista1@ufba.br", "Profa. Dra. Beatriz Meireles", "Universidade Federal da Bahia (UFBA)", "reviewer", "Especialista em Ciência Aberta e Gestão de Dados", demoPassHash, 1, "Ciência Aberta, Princípios FAIR, Repositórios Digitais, Metadados, Acesso Aberto, OAI-PMH", "1", "0000-0002-9988-7766", "http://lattes.cnpq.br/1122334455667788");
    insertUser.run("reviewer2", "parecerista2@ufrj.br", "Prof. Dr. Fernando Albuquerque", "Universidade Federal do Rio de Janeiro (UFRJ)", "reviewer", "Pesquisador em Repositórios Digitais e IA", demoPassHash, 1, "Inteligência Artificial, Modelos de Linguagem (LLMs), Tecnologias Emergentes, Mineração de Dados, Avaliação Duplo-Cego", "2", "0000-0003-1122-3344", "http://lattes.cnpq.br/8877665544332211");
    insertUser.run("author", "autor@unesp.br", "Dr. Lucas Martins", "Universidade Estadual Paulista (UNESP)", "author", "Pesquisador de Pós-Doutorado em Ciência da Informação", demoPassHash, 1, "Políticas Públicas, Avaliação por Pares, Metaciência, Integridade Científica, Ética Editorial", "3", "0000-0002-1825-0097", "http://lattes.cnpq.br/5544332211009988");
    insertUser.run("coauthor", "coautor@usp.br", "Camila Rocha", "Universidade de São Paulo (USP)", "author", "Doutoranda em Ciência da Computação", demoPassHash, 0, null, null, null, null);

    const insertConf = db.prepare(`
      INSERT INTO conferences (slug, title, acronym, description, contact_name, contact_email)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertConf.run("citeca", "Congresso Internacional de Tecnologias Educacionais e Ciência Aberta", "CITECA", "O CITECA é um fórum acadêmico internacional dedicado ao avanço da ciência aberta, repositórios digitais e tecnologias aplicadas à educação superior.", "Comitê Organizador CITECA", "contato@citeca.org");
    insertConf.run("sbessc", "Simpósio Brasileiro de Engenharia de Software e Sistemas Concorrentes", "SBESSC", "Evento anual que congrega pesquisadores, estudantes e profissionais da indústria para discutir os avanços na engenharia de software moderna.", "Secretaria SBESSC", "contato@sbessc.org.br");

    const insertSched = db.prepare(`
      INSERT INTO sched_confs (conference_id, slug, title, acronym, location, city, proceedings_doi, isbn, start_date, end_date, cfp_deadline, review_deadline, results_date, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertSched.run(1, "2026", "X CITECA 2026 - Inovações, Repositórios e Práticas de Ciência Aberta", "CITECA 2026", "Centro de Convenções Rebouças", "São Paulo, SP - Brasil", "10.22456/citeca.2026.proceedings", "978-65-89123-45-6", "2026-11-10", "2026-11-13", "2026-08-30", "2026-09-25", "2026-10-05", "A 10ª edição do CITECA debate os rumos da comunicação científica, repositórios institucionais e o impacto da inteligência artificial na preservação da memória acadêmica.", 1);
    insertSched.run(1, "2025", "IX CITECA 2025 - Transformação Digital no Ensino Superior", "CITECA 2025", "Auditório Central da UFPR", "Curitiba, PR - Brasil", "10.22456/citeca.2025.proceedings", "978-65-89123-22-7", "2025-10-14", "2025-10-17", "2025-07-20", "2025-08-25", "2025-09-10", "Edição realizada em Curitiba com artigos publicados e disponíveis nos anais.", 0);
    insertSched.run(2, "2026", "SBESSC 2026 - Desafios de Concorrência e Confiabilidade", "SBESSC 2026", "Campus Universitário da UFMG", "Belo Horizonte, MG - Brasil", "10.22456/sbessc.2026.proceedings", "978-65-5555-88-1", "2026-12-01", "2026-12-04", "2026-09-15", "2026-10-15", "2026-11-01", "Principal simpósio brasileiro sobre sistemas de software tolerantes a falhas e computação de alto desempenho.", 1);

    const insertTrack = db.prepare(`
      INSERT INTO tracks (sched_conf_id, title, abbreviation, description, max_words)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertTrack.run(1, "Trilha 1: Ciência Aberta, FAIR Principles e Repositórios Institucionais", "T1-CA", "Artigos sobre gestão de dados de pesquisa, acesso aberto e interoperabilidade.", 6000);
    insertTrack.run(1, "Trilha 2: Inteligência Artificial e Tecnologias Emergentes no Ensino Superior", "T2-IA", "Estudos aplicados de LLMs, personalização de aprendizagem e ética computacional.", 6000);
    insertTrack.run(1, "Trilha 3: Políticas Públicas, Avaliação por Pares e Metaciência", "T3-POL", "Investigações sobre periódicos, conferências, integridade acadêmica e índices bibliométricos.", 5000);
    insertTrack.run(2, "Trilha Geral: Plataformas e Ambientes Virtuais de Aprendizagem", "T-AVA", "Pesquisas sobre infraestrutura educacional e software livre.", 6000);

    const insertPaper = db.prepare(`
      INSERT INTO papers (sched_conf_id, track_id, user_id, title, abstract, keywords, presentation_type, status, doi, isbn, funding, file_name, file_size, comments_to_director, date_submitted, is_presented, presented_at, presented_by, references_text, references_style, section_intro, section_methods, section_results, section_conclusion, page_start, page_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPaper.run(
      1, 1, 6,
      "Interoperabilidade em Repositórios Digitais: Uma Arquitetura Aberta para o Ecossistema PKP",
      "Este trabalho apresenta uma proposta de integração entre o Open Conference Systems (OCS), o Open Journal Systems (OJS) e diretórios de dados de pesquisa baseados no protocolo OAI-PMH.",
      "Repositórios Digitais, Ciência Aberta, PKP OCS, OAI-PMH, Metadados",
      "oral", "published", "10.22456/citeca.2026.01", "978-65-89123-45-6",
      "FAPESP (Processo nº 2024/08123-4) e CNPq.",
      "artigo_interoperabilidade_pkp.pdf", 428512, "Submetido para avaliação na modalidade oral.",
      "2026-07-15 14:22:00", 1, "2026-11-10 10:30:00", "Coordenador da Sessão",
      "ALPERIN, J. P.; MCKIERNAN, E. C.; NILES, P. E. How significant are the public dimensions of faculty work in review, promotion, and tenure documents? eLife, v. 8, e42254, 2019. DOI: https://doi.org/10.7554/eLife.42254.",
      "abnt",
      "A comunicação científica contemporânea enfrenta o desafio de garantir a preservação e recuperabilidade da literatura produzida em conferências acadêmicas.",
      "Desenvolvemos e avaliamos uma arquitetura orientada a serviços integrando OCS, Crossref e OAI-PMH 2.0.",
      "Os ensaios demonstraram elevação na taxa de resolução de metadados estruturados e tempo médio de resposta de 42 ms.",
      "A estruturação de artigos curtos em seções nativas democratiza o acesso ao conhecimento e reduz carga de infraestrutura.",
      1, 5
    );

    insertPaper.run(
      1, 2, 6,
      "Uso de Modelos de Linguagem para Triagem Preliminar de Diretrizes em Submissões Científicas",
      "Investigamos a viabilidade da utilização de modelos de linguagem de código aberto para verificação automatizada de anonimização em conferências duplo-cego.",
      "Inteligência Artificial, Avaliação Duplo-Cego, Triagem Editorial, OCS",
      "oral", "accepted", "10.22456/citeca.2026.02", "978-65-89123-45-6",
      "CAPES (Código de Financiamento 001).",
      "artigo_llm_triagem_editorial.pdf", 384910, "Apresentamos os resultados empíricos da pesquisa.",
      "2026-07-20 18:05:00", 0, null, null,
      "OpenAI. (2023). GPT-4 technical report. arXiv preprint arXiv:2303.08774. https://doi.org/10.48550/arXiv.2303.08774",
      "apa",
      "O processo de avaliação por pares duplo-cega sofre com quebras involuntárias de sigilo em metadados.",
      "Implementamos pipeline de triagem com reconhecimento de entidades nomeadas (NER) sobre 450 submissões.",
      "O pipeline identificou quebras de sigilo em 28% das submissões antes do envio aos pareceristas.",
      "A triagem algorítmica preliminar auxilia a gestão editorial sem impor atrito excessivo.",
      1, 4
    );

    insertPaper.run(
      1, 1, 6,
      "A Preservação da Memória dos Anais de Eventos Científicos Brasileiros em Plataformas Descontinuadas",
      "Uma análise crítica sobre a obsolescência de sistemas como o OCS 2.x em universidades brasileiras.",
      "Preservação Digital, OCS 2.3.6, Memória Científica, Anais de Eventos",
      "poster", "under_review", null, "978-65-89123-45-6",
      "Apoio Institucional Pró-Reitoria de Pesquisa UNESP.",
      "artigo_preservacao_anais.pdf", 512300, "Submissão para sessão de pôsteres.",
      "2026-08-01 10:12:00", 0, null, null, null, "abnt", null, null, null, null, 1, 5
    );

    insertPaper.run(
      1, 3, 6,
      "Transparência e Métricas Alternativas: O Papel da Revisão Aberta em Conferências de Computação",
      "Comparamos a aceitação de revisões por pares abertas frente ao modelo clássico duplo-cego.",
      "Open Peer Review, Métricas de Avaliação, Ética Editorial",
      "oral", "submitted", null, "978-65-89123-45-6",
      "Sem fomento externo.",
      "artigo_open_review.pdf", 419200, "Trabalho inédito.",
      "2026-08-10 16:45:00", 0, null, null, null, "abnt", null, null, null, null, 1, 5
    );

    insertPaper.run(
      2, 4, 6,
      "Diretrizes para Acessibilidade Digital em Plataformas de Eventos Acadêmicos",
      "Pesquisa aplicada sobre conformidade de interfaces de submissão com WCAG 2.1 AA.",
      "Acessibilidade, WCAG, Interfaces Acadêmicas, Inclusão",
      "oral", "published", "10.22456/citeca.2025.14", "978-65-89123-22-7",
      "CNPq (Edital Universal nº 18/2023).",
      "artigo_acessibilidade_2025.pdf", 350200, "Trabalho apresentado na edição 2025.",
      "2025-06-12 11:30:00", 1, "2025-10-15 10:00:00", "Coordenador da Sessão", null, "abnt", null, null, null, null, 1, 5
    );

    const insertPaperAuthor = db.prepare(`
      INSERT INTO paper_authors (paper_id, full_name, email, affiliation, orcid, ror_id, credit_roles, is_primary, seq)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPaperAuthor.run(1, "Dr. Lucas Martins", "autor@unesp.br", "Universidade Estadual Paulista (UNESP)", "0000-0002-1825-0097", "https://ror.org/01y9bpm73", "Conceitualização, Metodologia", 1, 1);
    insertPaperAuthor.run(1, "Camila Rocha", "coautor@usp.br", "Universidade de São Paulo (USP)", "0000-0003-4567-8901", "https://ror.org/04xfq0f34", "Curadoria de dados, Revisão", 0, 2);
    insertPaperAuthor.run(2, "Dr. Lucas Martins", "autor@unesp.br", "Universidade Estadual Paulista (UNESP)", "0000-0002-1825-0097", "https://ror.org/01y9bpm73", "Conceitualização, Metodologia", 1, 1);
    insertPaperAuthor.run(3, "Dr. Lucas Martins", "autor@unesp.br", "Universidade Estadual Paulista (UNESP)", "0000-0002-1825-0097", "https://ror.org/01y9bpm73", "Conceitualização, Redação", 1, 1);
    insertPaperAuthor.run(4, "Dr. Lucas Martins", "autor@unesp.br", "Universidade Estadual Paulista (UNESP)", "0000-0002-1825-0097", "https://ror.org/01y9bpm73", "Investigação, Metodologia", 1, 1);
    insertPaperAuthor.run(5, "Dr. Lucas Martins", "autor@unesp.br", "Universidade Estadual Paulista (UNESP)", "0000-0002-1825-0097", "https://ror.org/01y9bpm73", "Conceitualização", 1, 1);

    const insertReview = db.prepare(`
      INSERT INTO review_assignments (paper_id, reviewer_id, status, recommendation, score_originality, score_methodology, score_clarity, score_relevance, comments_author, comments_director, date_assigned, date_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertReview.run(1, 4, "completed", "accept", 5, 5, 4, 5, "Contribuição relevante para repositórios digitais.", "Recomendo aceite na sessão de abertura.", "2026-07-22 09:00:00", "2026-08-05 15:30:00");
    insertReview.run(1, 5, "completed", "accept", 4, 4, 5, 4, "Discussão atual sobre interoperabilidade OCS/OJS.", "Pronto para publicação.", "2026-07-22 09:00:00", "2026-08-08 11:20:00");
    insertReview.run(2, 4, "completed", "accept", 4, 4, 4, 5, "Tema pertinente sobre triagem de anonimização.", "Pequenos ajustes de referências.", "2026-07-25 10:00:00", "2026-08-12 17:00:00");
    insertReview.run(3, 4, "completed", "revisions", 4, 3, 4, 4, "Sugiro aprofundar comparação com Indico e OpenReview.", "Recomendo revisão antes do aceite final.", "2026-08-03 14:00:00", "2026-08-18 16:40:00");
    insertReview.run(3, 5, "pending", null, null, null, null, null, null, null, "2026-08-03 14:00:00", null);

    const insertDecision = db.prepare(`
      INSERT INTO edit_decisions (paper_id, director_id, decision, comments, date_decided)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertDecision.run(1, 3, "accept", "Trabalho aceito para apresentação oral e publicação nos anais.", "2026-08-10 18:00:00");
    insertDecision.run(2, 3, "accept", "Trabalho aceito para apresentação no evento.", "2026-08-15 14:00:00");

    const insertRoom = db.prepare("INSERT INTO rooms (sched_conf_id, name, building, capacity) VALUES (?, ?, ?, ?)");
    insertRoom.run(1, "Auditório Principal - Paulo Freire", "Prédio Central (Presencial)", 350);
    insertRoom.run(1, "Sala Temática A - Darcy Ribeiro", "Ala Norte (Presencial)", 80);
    insertRoom.run(1, "Sala Virtual 1 - Google Meet", "Ambiente Virtual / Remoto", 250);

    const insertBlock = db.prepare("INSERT INTO time_blocks (sched_conf_id, date, start_time, end_time, title) VALUES (?, ?, ?, ?, ?)");
    insertBlock.run(1, "2026-11-10", "09:00", "10:30", "Sessão de Abertura & Conferência Magna");
    insertBlock.run(1, "2026-11-10", "11:00", "12:30", "Sessão Técnica 1 - Ciência Aberta e Repositórios");
    insertBlock.run(1, "2026-11-10", "14:00", "15:30", "Sessão Técnica 2 - IA e Inovações Editoriais");

    const insertPres = db.prepare(`
      INSERT INTO scheduled_presentations (sched_conf_id, paper_id, room_id, time_block_id, start_time, end_time, modality, meeting_url, meeting_instructions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPres.run(1, 1, 1, 2, "11:00", "11:30", "presential", null, "Apresentação presencial no Auditório Paulo Freire.");
    insertPres.run(1, 2, 3, 3, "14:00", "14:30", "online", "https://meet.google.com/cit-eca2-026", "Transmissão online via Google Meet.");

    const insertReg = db.prepare("INSERT INTO registrations (sched_conf_id, full_name, email, affiliation, category, status) VALUES (?, ?, ?, ?, ?, ?)");
    insertReg.run(1, "Lucas Martins", "autor@unesp.br", "UNESP", "Professor/Pesquisador", "confirmed");
    insertReg.run(1, "Camila Rocha", "coautor@usp.br", "USP", "Pós-Graduando", "confirmed");

    const insertAnn = db.prepare("INSERT INTO announcements (conference_id, sched_conf_id, title, summary, content) VALUES (?, ?, ?, ?, ?)");
    insertAnn.run(1, 1, "Chamada de Trabalhos (CFP) Oficial do X CITECA 2026", "Submissões abertas para as 3 trilhas temáticas.", "Submissões passam por avaliação por pares duplo-cega.");

    const insertCert = db.prepare(`
      INSERT INTO certificates (certificate_code, user_id, paper_id, sched_conf_id, type, title, recipient_name, recipient_email, description, verification_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertCert.run("OCW-2026-PRES-CITECA-8F2A9C", 6, 1, 1, "presentation", "Declaração de Apresentação de Trabalho", "Dr. Lucas Martins", "autor@unesp.br", "Certificamos que Dr. Lucas Martins apresentou o trabalho na sessão técnica do X CITECA 2026.", "/certificate/OCW-2026-PRES-CITECA-8F2A9C");
    insertCert.run("OCW-2026-REV-CITECA-4E7B12", 4, 1, 1, "reviewer", "Declaração de Atuação como Parecerista Ad-hoc", "Profa. Dra. Beatriz Meireles", "parecerista1@ufba.br", "Certificamos que Profa. Dra. Beatriz Meireles atuou como parecerista ad-hoc no X CITECA 2026.", "/certificate/OCW-2026-REV-CITECA-4E7B12");

    return true;
  });
}

// Popula automaticamente SOMENTE se OCW_AUTO_SEED === "true" e banco vazio
seedDatabaseIfEmpty();

export { db };
export default db;
