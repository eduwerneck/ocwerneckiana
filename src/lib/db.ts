import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// Suporte a ambiente local e Vercel Serverless
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

const dbPath = path.join(dataDir, "ocs.db");

// Se estiver na Vercel e o banco ainda não estiver em /tmp, copiar o seed existente
if (isVercel && !fs.existsSync(dbPath)) {
  const bundledSeed = path.join(process.cwd(), "data", "ocs.db");
  if (fs.existsSync(bundledSeed)) {
    try {
      fs.copyFileSync(bundledSeed, dbPath);
    } catch (e) {
      console.warn("Aviso ao copiar banco seed para /tmp:", e);
    }
  }
}

const db = new DatabaseSync(dbPath);
try {
  db.exec("PRAGMA busy_timeout = 20000;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
} catch (e) {
  // Ignorar se já em WAL
}

// Configuração do SQLite para máxima performance e integridade
try {
  db.exec(`

  -- 1. Conferências Globais (Conferences)
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

  -- 2. Edições Agendadas (Scheduled Conferences - Sched Confs)
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

  -- 3. Trilhas Temáticas (Tracks)
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

  -- 4. Usuários e Papéis (Users & Roles)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    affiliation TEXT,
    role TEXT NOT NULL DEFAULT 'author', -- admin, manager, director, reviewer, author, reader
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 5. Submissões / Artigos (Papers)
  CREATE TABLE IF NOT EXISTS papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sched_conf_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    keywords TEXT,
    presentation_type TEXT DEFAULT 'oral', -- oral, poster, workshop
    status TEXT NOT NULL DEFAULT 'submitted', -- submitted, under_review, revisions_required, accepted, rejected, published
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
    date_submitted DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_decided DATETIME,
    FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 6. Autores e Coautores (Paper Authors)
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

  -- 7. Atribuições e Pareceres de Avaliadores (Review Assignments)
  CREATE TABLE IF NOT EXISTS review_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paper_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, accepted, completed, declined
    recommendation TEXT, -- accept, revisions, reject
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

  -- 8. Decisões Editoriais (Editorial Decisions)
  CREATE TABLE IF NOT EXISTS edit_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paper_id INTEGER NOT NULL,
    director_id INTEGER NOT NULL,
    decision TEXT NOT NULL, -- accept, revisions, reject
    comments TEXT,
    date_decided DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    FOREIGN KEY (director_id) REFERENCES users(id)
  );

  -- 9. Locais e Salas da Agenda (Scheduler Rooms)
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sched_conf_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    building TEXT,
    capacity INTEGER,
    FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE
  );

  -- 10. Blocos de Horário (Time Blocks)
  CREATE TABLE IF NOT EXISTS time_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sched_conf_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    title TEXT NOT NULL,
    FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE
  );

  -- 11. Apresentações Agendadas na Programação
  CREATE TABLE IF NOT EXISTS scheduled_presentations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sched_conf_id INTEGER NOT NULL,
    paper_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    time_block_id INTEGER NOT NULL,
    start_time TEXT,
    end_time TEXT,
    modality TEXT DEFAULT 'presential', -- presential, online, hybrid
    meeting_url TEXT,
    meeting_instructions TEXT,
    FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (time_block_id) REFERENCES time_blocks(id)
  );

  -- 12. Inscrições de Participantes (Registrations)
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sched_conf_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    affiliation TEXT,
    category TEXT NOT NULL, -- Estudante de Graduação, Pós-Graduando, Professor/Pesquisador, Profissional
    status TEXT DEFAULT 'confirmed',
    date_registered DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sched_conf_id) REFERENCES sched_confs(id) ON DELETE CASCADE
  );

  -- 13. Notícias e Comunicados (Announcements)
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
  `);
} catch (e) {
  // Ignorar concorrência de criação de tabelas
}

// Migrações dinâmicas para suporte à Rodada de Reavaliação (Round 2)
try { db.exec("ALTER TABLE review_assignments ADD COLUMN round INTEGER DEFAULT 1"); } catch {}
try { db.exec("ALTER TABLE review_assignments ADD COLUMN author_response TEXT"); } catch {}
try { db.exec("ALTER TABLE review_assignments ADD COLUMN revised_file_name TEXT"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN revised_file_name TEXT"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN author_response TEXT"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN current_round INTEGER DEFAULT 1"); } catch {}

// Migrações dinâmicas para suporte a Apresentações Híbridas / Online / Presenciais
try { db.exec("ALTER TABLE scheduled_presentations ADD COLUMN modality TEXT DEFAULT 'presential'"); } catch {}
try { db.exec("ALTER TABLE scheduled_presentations ADD COLUMN meeting_url TEXT"); } catch {}
try { db.exec("ALTER TABLE scheduled_presentations ADD COLUMN meeting_instructions TEXT"); } catch {}
try {
  db.exec("UPDATE scheduled_presentations SET modality = 'presential' WHERE id = 1");
  db.exec("UPDATE scheduled_presentations SET modality = 'online', meeting_url = 'https://meet.google.com/cit-eca2-026', meeting_instructions = 'Transmissão online via Google Meet. Link direto para apresentação do autor e perguntas do público.' WHERE id = 2");
} catch {}

// Migrações dinâmicas para suporte ao Controle de Apresentação (Trava de Publicação / Política de No-Show)
try { db.exec("ALTER TABLE papers ADD COLUMN is_presented INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN presented_at DATETIME"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN presented_by TEXT"); } catch {}
try {
  db.exec("UPDATE papers SET is_presented = 1, presented_at = '2026-11-10 10:30:00', presented_by = 'Coordenador da Sessão' WHERE status = 'published'");
} catch {}

// Migrações dinâmicas para suporte a Referências Bibliográficas (ABNT / APA7)
try { db.exec("ALTER TABLE papers ADD COLUMN references_text TEXT"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN references_style TEXT DEFAULT 'abnt'"); } catch {}
try {
  const p1 = db.prepare("SELECT references_text FROM papers WHERE id = 1").get() as { references_text: string | null } | undefined;
  if (p1 && !p1.references_text) {
    db.prepare(`
      UPDATE papers 
      SET references_text = ?, references_style = 'abnt' 
      WHERE id = 1
    `).run(`ALPERIN, J. P.; MCKIERNAN, E. C.; NILES, P. E. How significant are the public dimensions of faculty work in review, promotion, and tenure documents? eLife, v. 8, e42254, 2019. DOI: https://doi.org/10.7554/eLife.42254.

MACGREGOR, G.; STREVETT, P. Repositories, metadata and search engines: the role of OAI-PMH in the scholarly web. Information Technology and Libraries, v. 33, n. 4, p. 57-72, 2014. DOI: https://doi.org/10.6017/ital.v33i4.5620.

PACKER, A. L. Os 15 anos do SciELO e a evolução dos periódicos do Brasil. Novos Estudos CEBRAP, n. 97, p. 5-11, 2013. DOI: https://doi.org/10.1590/S0101-33002013000300001.

WILLINSKY, J. The access principle: The case for open access to research and scholarship. Cambridge, MA: MIT Press, 2006.`);
  }

  const p2 = db.prepare("SELECT references_text FROM papers WHERE id = 2").get() as { references_text: string | null } | undefined;
  if (p2 && !p2.references_text) {
    db.prepare(`
      UPDATE papers 
      SET references_text = ?, references_style = 'apa' 
      WHERE id = 2
    `).run(`Bommasani, R., Hudson, D. A., Adeli, E., Altman, R., Arora, S., von Arx, S., ... & Liang, P. (2021). On the opportunities and risks of foundation models. arXiv preprint arXiv:2108.07258. https://doi.org/10.48550/arXiv.2108.07258

OpenAI. (2023). GPT-4 technical report. arXiv preprint arXiv:2303.08774. https://doi.org/10.48550/arXiv.2303.08774

Tennant, J. P., Crane, H., Crick, T., Davila, J., Enkhbayar, A., Havemann, J., ... & Vanholsbeeck, M. (2019). Ten hot topics around scholarly publishing. Publications, 7(2), 34. https://doi.org/10.3390/publications7020034`);
  }
} catch {}

// Migrações dinâmicas para suporte ao ISBN do Evento e dos Anais
try { db.exec("ALTER TABLE sched_confs ADD COLUMN isbn TEXT"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN isbn TEXT"); } catch {}
try {
  db.exec("UPDATE sched_confs SET isbn = '978-65-89123-45-6' WHERE slug = '2026' AND conference_id = 1");
  db.exec("UPDATE sched_confs SET isbn = '978-65-89123-22-7' WHERE slug = '2025' AND conference_id = 1");
  db.exec("UPDATE sched_confs SET isbn = '978-65-5555-88-1' WHERE conference_id = 2");
  db.exec("UPDATE papers SET isbn = '978-65-89123-45-6' WHERE sched_conf_id = 1");
  db.exec("UPDATE papers SET isbn = '978-65-89123-22-7' WHERE sched_conf_id = 2");
} catch {}

// Migrações dinâmicas para Artigo Curto Estruturado (2.000 palavras), Figuras 300 DPI e Paginação Lattes
try { db.exec("ALTER TABLE papers ADD COLUMN section_intro TEXT"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN section_methods TEXT"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN section_results TEXT"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN section_conclusion TEXT"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN figures_json TEXT"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN page_start INTEGER DEFAULT 1"); } catch {}
try { db.exec("ALTER TABLE papers ADD COLUMN page_end INTEGER DEFAULT 5"); } catch {}

try {
  db.prepare(`
    UPDATE papers 
    SET section_intro = ?,
        section_methods = ?,
        section_results = ?,
        section_conclusion = ?,
        figures_json = ?,
        page_start = 1,
        page_end = 5
    WHERE id = 1
  `).run(
    `A comunicação científica contemporânea enfrenta o desafio de garantir a preservação, a integridade e a recuperabilidade da literatura produzida em conferências e simpósios acadêmicos. Historicamente, os anais de eventos científicos foram tratados como publicações de circulação efêmera, muitas vezes restritas a cadernos impressos ou mídias ópticas descontinuadas. Com a consolidação dos princípios FAIR (Findable, Accessible, Interoperable, and Reusable) e as diretrizes globais de Ciência Aberta, torna-se imperativo que as plataformas de gestão de eventos operem sob arquiteturas computacionais modernas, resilientes e plenamente interoperáveis com indexadores internacionais.`,
    `Desenvolvemos e avaliamos uma arquitetura orientada a serviços integrando o PKP Open Conference Systems (OCS) ao ecossistema de metadados Crossref e ao protocolo Open Archives Initiative Protocol for Metadata Harvesting (OAI-PMH 2.0). A metodologia contemplou a análise de conformidade de 1.200 submissões acadêmicas submetidas a ensaios de colheita automatizada.

[Figura 1: Fluxograma metodológico do pipeline de colheita OAI-PMH e depósitos Crossref]

Para a validação semântica e operacional, foram empregados os esquemas Dublin Core (oai_dc) e Crossref 4.4.2 (doi_batch), medindo-se a taxa de extração estruturada de identificadores persistentes (DOIs de artigos, DOIs de anais, ORCID de autores e ROR IDs institucionais).

[Figura 2: Diagrama de arquitetura da base relacional e normalização de metadados]

Todos os ensaios foram executados em ambiente isolado de benchmarking com injeção de cargas concorrentes de requisições.`,
    `Os ensaios demonstraram uma elevação substancial na taxa de resolução de metadados estruturados. A indexação nativa em HTML reduziu o consumo de memória do servidor em 92% em comparação à distribuição exclusiva de arquivos PDF pesados. A colheita via endpoint OAI-PMH alcançou tempo médio de resposta de 42 milissegundos por lote de registros.

[Figura 3: Gráfico de tempo de resposta e economia de banda da distribuição web]

A distribuição de identificadores persistentes viabilizou a rastreabilidade imediata no Google Scholar e na rede de citações Crossref (Cited-by Linking). A adoção de taxonomias controladas (CRediT) assegurou a atribuição transparente das responsabilidades de coautoria em 100% das amostras testadas.`,
    `A estruturação de artigos curtos em seções nativas diretamente na plataforma web democratiza o acesso ao conhecimento, viabiliza a avaliação por pares duplo-cega com garantia algorítmica de anonimato e desonera a infraestrutura técnica das instituições organizadoras. Como artigo curto em anais, este estudo estabelece a prova de conceito empírica da arquitetura, reservando aos autores a prerrogativa de expandir o escopo metodológico e o corpus de dados em periódicos especializados subsequentes sem configurar publicação duplicada.`,
    JSON.stringify([
      {
        id: 1,
        caption: "Figura 1: Fluxograma metodológico do pipeline de colheita OAI-PMH e depósitos Crossref",
        url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
        dpi: 300,
        file_name: "figura1_fluxograma_metodologia_300dpi.png",
        section: "methods"
      },
      {
        id: 2,
        caption: "Figura 2: Diagrama de arquitetura da base relacional e normalização de metadados",
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
        dpi: 300,
        file_name: "figura2_diagrama_arquitetura_300dpi.png",
        section: "methods"
      },
      {
        id: 3,
        caption: "Figura 3: Gráfico de tempo de resposta e economia de banda da distribuição web",
        url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
        dpi: 300,
        file_name: "figura3_desempenho_resultados_300dpi.png",
        section: "results"
      }
    ])
  );
} catch {}

try {
  const p2 = db.prepare("SELECT section_intro FROM papers WHERE id = 2").get() as { section_intro: string | null } | undefined;
  if (p2 && !p2.section_intro) {
    db.prepare(`
      UPDATE papers 
      SET section_intro = ?,
          section_methods = ?,
          section_results = ?,
          section_conclusion = ?,
          figures_json = ?,
          page_start = 1,
          page_end = 4
      WHERE id = 2
    `).run(
      `O processo de avaliação por pares cega (double-blind review) é o pilar da credibilidade acadêmica, mas sofre com quebras involuntárias de sigilo por parte de autores que deixam nomes, filiações ou metadados de arquivos em documentos enviados. Este estudo investiga a viabilidade de modelos de linguagem leves aplicados à triagem preliminar de manuscritos para blindagem da avaliação.`,
      `Implementamos um pipeline de triagem automatizada com análise sintática e reconhecimento de entidades nomeadas (NER) treinado em corpora acadêmicos. Avaliamos 450 submissões em conferências de computação e ciência da informação, mensurando a acurácia, precisão e revocação na detecção de marcas de autoria direta ou indireta.`,
      `O pipeline identificou quebras de sigilo em 28% das submissões antes do envio aos pareceristas. A acurácia geral atingiu 94%, com redução de 80% no tempo despendido pelos editores na triagem manual.

[Figura 1: Taxa de Eficácia na Detecção Precoce de Quebra de Sigilo Editorial]

A abordagem preserva a integridade ética do fluxo editorial sem impor atrito burocrático excessivo às equipes de conferência.`,
      `A triagem algorítmica preliminar se mostra uma ferramenta valiosa de suporte à gestão editorial de congressos. Por tratar-se de comunicação científica concisa de 2.000 palavras, os dados empíricos apresentados abrem caminho para pesquisas mais aprofundadas com modelos neurais generativos em periódicos científicos.`,
      JSON.stringify([
        {
          id: 1,
          caption: "Figura 1 - Taxa de Eficácia na Detecção Precoce de Quebra de Sigilo Editorial (300 DPI)",
          url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
          dpi: 300,
          file_name: "figura1_deteccao_sigilo_300dpi.png"
        }
      ])
    );
  }
} catch {}

// Migrações dinâmicas para Notificações por E-mail, Certificados e Distribuição por Área de Conhecimento
try { db.exec("ALTER TABLE users ADD COLUMN is_reviewer_candidate INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN review_interests TEXT"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN preferred_track_ids TEXT"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN lattes_url TEXT"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN orcid TEXT"); } catch {}

try {
  db.exec(`
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

  const insertSetting = db.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)");
  insertSetting.run("smtp_host", "smtp.gmail.com");
  insertSetting.run("smtp_port", "587");
  insertSetting.run("smtp_user", "rev.estrabao@gmail.com");
  insertSetting.run("smtp_from", "Open Conference Werneckiana <rev.estrabao@gmail.com>");
  insertSetting.run("smtp_pass", "");
} catch (e) {
  console.error("Erro ao criar tabelas email_logs, certificates e app_settings:", e);
}

try {
  db.prepare(`
    UPDATE users SET 
      is_reviewer_candidate = 1, 
      review_interests = 'Ciência Aberta, Princípios FAIR, Repositórios Digitais, Metadados, Acesso Aberto, OAI-PMH',
      preferred_track_ids = '1',
      orcid = '0000-0002-9988-7766',
      lattes_url = 'http://lattes.cnpq.br/1122334455667788'
    WHERE username = 'reviewer1'
  `).run();

  db.prepare(`
    UPDATE users SET 
      is_reviewer_candidate = 1, 
      review_interests = 'Inteligência Artificial, Modelos de Linguagem (LLMs), Tecnologias Emergentes, Mineração de Dados, Avaliação Duplo-Cego',
      preferred_track_ids = '2',
      orcid = '0000-0003-1122-3344',
      lattes_url = 'http://lattes.cnpq.br/8877665544332211'
    WHERE username = 'reviewer2'
  `).run();

  db.prepare(`
    UPDATE users SET 
      is_reviewer_candidate = 1, 
      review_interests = 'Políticas Públicas, Avaliação por Pares, Metaciência, Integridade Científica, Ética Editorial',
      preferred_track_ids = '3',
      orcid = '0000-0002-1825-0097',
      lattes_url = 'http://lattes.cnpq.br/5544332211009988'
    WHERE username = 'author'
  `).run();

  // Inserir certificados semente se tabela estiver vazia
  const certCount = db.prepare("SELECT COUNT(*) as count FROM certificates").get() as { count: number };
  if (certCount && certCount.count === 0) {
    db.prepare(`
      INSERT INTO certificates (certificate_code, user_id, paper_id, sched_conf_id, type, title, recipient_name, recipient_email, description, verification_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "OCW-2026-PRES-CITECA-8F2A9C",
      6,
      1,
      1,
      "presentation",
      "Declaração de Apresentação de Trabalho",
      "Dr. Lucas Martins de Oliveira",
      "autor@unesp.br",
      "Certificamos que Dr. Lucas Martins de Oliveira apresentou o trabalho intitulado 'Interoperabilidade em Repositórios Digitais: Uma Arquitetura Aberta para o Ecossistema PKP' na sessão técnica do X Congresso Internacional de Tecnologias Educacionais e Ciência Aberta (X CITECA 2026), realizado em São Paulo, SP.",
      "/certificate/OCW-2026-PRES-CITECA-8F2A9C"
    );

    db.prepare(`
      INSERT INTO certificates (certificate_code, user_id, paper_id, sched_conf_id, type, title, recipient_name, recipient_email, description, verification_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "OCW-2026-REV-CITECA-4E7B12",
      4,
      1,
      1,
      "reviewer",
      "Declaração de Atuação como Parecerista Ad-hoc",
      "Profa. Dra. Beatriz Meireles",
      "parecerista1@ufba.br",
      "Certificamos que Profa. Dra. Beatriz Meireles atuou como parecerista ad-hoc no X Congresso Internacional de Tecnologias Educacionais e Ciência Aberta (X CITECA 2026), tendo avaliado o trabalho submetido à Trilha 1: Ciência Aberta, FAIR Principles e Repositórios Institucionais pelo método de avaliação por pares cega (double-blind review).",
      "/certificate/OCW-2026-REV-CITECA-4E7B12"
    );
  }

  // Atualizar declarações já salvas no banco, removendo excesso de adjetivos conforme padrão acadêmico sóbrio
  db.exec(`
    UPDATE certificates 
    SET description = replace(replace(replace(description, 'apresentou com êxito o trabalho acadêmico', 'apresentou o trabalho'), 'apresentou com êxito', 'apresentou'), 'realizando avaliação criteriosa sob o método duplo-cego (double-blind peer review) de manuscritos submetidos à', 'tendo avaliado o trabalho submetido à');
    UPDATE certificates 
    SET description = replace(replace(description, 'avaliou com rigor', 'avaliou'), 'avaliando com rigor', 'avaliou');
    UPDATE certificates 
    SET description = replace(description, 'foi efetivamente apresentado', 'foi apresentado');
  `);
} catch (e) {
  console.error("Erro ao popular configurações de avaliadores e certificados:", e);
}

// Função de Seeding automático se a base estiver vazia
export function seedDatabaseIfEmpty() {
  try {
    const countRow = db.prepare("SELECT COUNT(*) as count FROM conferences").get() as { count: number };
    if (countRow && countRow.count > 0) {
      return; // Já populado
    }

  console.log("Inicializando banco de dados com dados de exemplo PKP OCS...");

  // Inserir Usuários
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, full_name, affiliation, role, bio)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run("admin", "admin@pkp-ocs.org", "Administrador Geral OCS", "Public Knowledge Project", "admin", "Administrador do Portal PKP OCS");
  insertUser.run("manager", "gerente@citeca.org", "Profa. Dra. Mariana Silveira", "Universidade de São Paulo (USP)", "manager", "Gerente Geral da Conferência");
  insertUser.run("director", "diretor@citeca.org", "Prof. Dr. Carlos Eduardo Dias", "Unicamp / SBC", "director", "Diretor do Comitê de Programa e Avaliações");
  insertUser.run("reviewer1", "parecerista1@ufba.br", "Profa. Dra. Beatriz Meireles", "Universidade Federal da Bahia (UFBA)", "reviewer", "Especialista em Ciência Aberta e Gestão de Dados");
  insertUser.run("reviewer2", "parecerista2@ufrj.br", "Prof. Dr. Fernando Albuquerque", "Universidade Federal do Rio de Janeiro (UFRJ)", "reviewer", "Pesquisador em Repositórios Digitais e IA");
  insertUser.run("author", "autor@unesp.br", "Dr. Lucas Martins", "Universidade Estadual Paulista (UNESP)", "author", "Pesquisador de Pós-Doutorado em Ciência da Informação");
  insertUser.run("coauthor", "coautor@usp.br", "Camila Rocha", "Universidade de São Paulo (USP)", "author", "Doutoranda em Ciência da Computação");

  // Inserir Conferências
  const insertConf = db.prepare(`
    INSERT INTO conferences (slug, title, acronym, description, contact_name, contact_email)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertConf.run(
    "citeca",
    "Congresso Internacional de Tecnologias Educacionais e Ciência Aberta",
    "CITECA",
    "O CITECA é um fórum acadêmico internacional dedicado ao avanço da ciência aberta, repositórios digitais e tecnologias aplicadas à educação superior.",
    "Comitê Organizador CITECA",
    "contato@citeca.org"
  );

  insertConf.run(
    "sbessc",
    "Simpósio Brasileiro de Engenharia de Software e Sistemas Concorrentes",
    "SBESSC",
    "Evento anual que congrega pesquisadores, estudantes e profissionais da indústria para discutir os avanços na engenharia de software moderna.",
    "Secretaria SBESSC",
    "contato@sbessc.org.br"
  );

  // Inserir Edições Agendadas (Sched Confs)
  const insertSched = db.prepare(`
    INSERT INTO sched_confs (conference_id, slug, title, acronym, location, city, proceedings_doi, isbn, start_date, end_date, cfp_deadline, review_deadline, results_date, description, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Edição Ativa CITECA 2026
  insertSched.run(
    1,
    "2026",
    "X CITECA 2026 - Inovações, Repositórios e Práticas de Ciência Aberta",
    "CITECA 2026",
    "Centro de Convenções Rebouças",
    "São Paulo, SP - Brasil",
    "10.22456/citeca.2026.proceedings",
    "978-65-89123-45-6",
    "2026-11-10",
    "2026-11-13",
    "2026-08-30",
    "2026-09-25",
    "2026-10-05",
    "A 10ª edição do CITECA debate os rumos da comunicação científica, repositórios institucionais e o impacto da inteligência artificial na preservação da memória acadêmica.",
    1
  );

  // Edição Anterior CITECA 2025 (Com anais publicados)
  insertSched.run(
    1,
    "2025",
    "IX CITECA 2025 - Transformação Digital no Ensino Superior",
    "CITECA 2025",
    "Auditório Central da UFPR",
    "Curitiba, PR - Brasil",
    "10.22456/citeca.2025.proceedings",
    "978-65-89123-22-7",
    "2025-10-14",
    "2025-10-17",
    "2025-07-20",
    "2025-08-25",
    "2025-09-10",
    "Edição realizada com sucesso em Curitiba com mais de 80 artigos publicados e disponíveis nos anais.",
    0
  );

  // Edição SBESSC 2026
  insertSched.run(
    2,
    "2026",
    "SBESSC 2026 - Desafios de Concorrência e Confiabilidade",
    "SBESSC 2026",
    "Campus Universitário da UFMG",
    "Belo Horizonte, MG - Brasil",
    "10.22456/sbessc.2026.proceedings",
    "978-65-5555-88-1",
    "2026-12-01",
    "2026-12-04",
    "2026-09-15",
    "2026-10-15",
    "2026-11-01",
    "Principal simpósio brasileiro sobre sistemas de software tolerantes a falhas e computação de alto desempenho.",
    1
  );

  // Inserir Trilhas Temáticas para CITECA 2026
  const insertTrack = db.prepare(`
    INSERT INTO tracks (sched_conf_id, title, abbreviation, description, max_words)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertTrack.run(1, "Trilha 1: Ciência Aberta, FAIR Principles e Repositórios Institucionais", "T1-CA", "Artigos sobre gestão de dados de pesquisa, acesso aberto e interoperabilidade.", 6000);
  insertTrack.run(1, "Trilha 2: Inteligência Artificial e Tecnologias Emergentes no Ensino Superior", "T2-IA", "Estudos aplicados de LLMs, personalização de aprendizagem e ética computacional.", 6000);
  insertTrack.run(1, "Trilha 3: Políticas Públicas, Avaliação por Pares e Metaciência", "T3-POL", "Investigações sobre periódicos, conferências, integridade acadêmica e índices bibliométricos.", 5000);

  // Trilhas para CITECA 2025
  insertTrack.run(2, "Trilha Geral: Plataformas e Ambientes Virtuais de Aprendizagem", "T-AVA", "Pesquisas sobre infraestrutura educacional e software livre.", 6000);

  // Inserir Submissões de Exemplo (Papers)
  const insertPaper = db.prepare(`
    INSERT INTO papers (sched_conf_id, track_id, user_id, title, abstract, keywords, presentation_type, status, doi, funding, file_name, file_size, comments_to_director, date_submitted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Artigo 1: Publicado nos Anais
  insertPaper.run(
    1,
    1,
    6,
    "Interoperabilidade em Repositórios Digitais: Uma Arquitetura Aberta para o Ecossistema PKP",
    "Este trabalho apresenta uma proposta de integração entre o Open Conference Systems (OCS), o Open Journal Systems (OJS) e diretórios de dados de pesquisa baseados no protocolo OAI-PMH. Avaliamos a indexação Dublin Core em mais de 1.200 submissões acadêmicas, demonstrando um ganho de 34% na recuperabilidade da literatura cinzenta de congressos.",
    "Repositórios Digitais, Ciência Aberta, PKP OCS, OAI-PMH, Metadados",
    "oral",
    "published",
    "10.22456/citeca.2026.01",
    "Fundação de Amparo à Pesquisa do Estado de São Paulo - FAPESP (Processo nº 2024/08123-4) e Conselho Nacional de Desenvolvimento Científico e Tecnológico - CNPq (Bolsa de Produtividade 1D).",
    "artigo_interoperabilidade_pkp.pdf",
    428512,
    "Submetido para avaliação na modalidade oral.",
    "2026-07-15 14:22:00"
  );

  // Artigo 2: Aceito (Aprovado na avaliação)
  insertPaper.run(
    1,
    2,
    6,
    "Uso de Modelos de Linguagem para Triagem Preliminar de Diretrizes em Submissões Científicas",
    "Investigamos a viabilidade da utilização de modelos de linguagem de código aberto para a verificação automatizada de anonimização e conformidade de formatação em conferências acadêmicas com duplo-cego. Os resultados preliminares apontam precisão de 92% na identificação precoce de quebras de sigilo.",
    "Inteligência Artificial, Avaliação Duplo-Cego, Triagem Editorial, OCS",
    "oral",
    "accepted",
    "10.22456/citeca.2026.02",
    "Coordenação de Aperfeiçoamento de Pessoal de Nível Superior - CAPES (Código de Financiamento 001).",
    "artigo_llm_triagem_editorial.pdf",
    384910,
    "Apresentamos os resultados empíricos da pesquisa.",
    "2026-07-20 18:05:00"
  );

  // Artigo 3: Em Avaliação (Under Review)
  insertPaper.run(
    1,
    1,
    6,
    "A Preservação da Memória dos Anais de Eventos Científicos Brasileiros em Plataformas Descontinuadas",
    "Uma análise crítica sobre a obsolescência de sistemas como o OCS 2.x em universidades brasileiras e estratégias de preservação digital de longo prazo utilizando formatos abertos e emuladores conteinerizados.",
    "Preservação Digital, OCS 2.3.6, Memória Científica, Anais de Eventos",
    "poster",
    "under_review",
    null,
    "Apoio Institucional Pró-Reitoria de Pesquisa UNESP.",
    "artigo_preservacao_anais.pdf",
    512300,
    "Submissão para apresentação em sessão de pôsteres.",
    "2026-08-01 10:12:00"
  );

  // Artigo 4: Submetido (Aguardando designação de avaliadores)
  insertPaper.run(
    1,
    3,
    6,
    "Transparência e Métricas Alternativas: O Papel da Revisão Aberta em Conferências de Computação",
    "Comparamos a aceitação de revisões por pares abertas (Open Peer Review) frente ao modelo clássico duplo-cego adotado no OCS. Foram aplicados questionários com mais de 200 pareceristas atuantes em eventos acadêmicos.",
    "Open Peer Review, Métricas de Avaliação, Ética Editorial",
    "oral",
    "submitted",
    null,
    "Sem fomento externo / Financiamento próprio dos autores.",
    "artigo_open_review.pdf",
    419200,
    "Trabalho inédito.",
    "2026-08-10 16:45:00"
  );

  // Artigo 5: Publicado no CITECA 2025 (Histórico)
  insertPaper.run(
    2,
    4,
    6,
    "Diretrizes para Acessibilidade Digital em Plataformas de Eventos Acadêmicos",
    "Pesquisa aplicada que avaliou o grau de conformidade das interfaces de submissão do OCS e plataformas equivalentes com as diretrizes WCAG 2.1 AA.",
    "Acessibilidade, WCAG, Interfaces Acadêmicas, Inclusão",
    "oral",
    "published",
    "10.22456/citeca.2025.14",
    "Conselho Nacional de Desenvolvimento Científico e Tecnológico - CNPq (Edital Universal nº 18/2023).",
    "artigo_acessibilidade_2025.pdf",
    350200,
    "Trabalho apresentado na edição 2025.",
    "2025-06-12 11:30:00"
  );

  // Autores dos Artigos (com ORCID, ROR e CRediT)
  const insertPaperAuthor = db.prepare(`
    INSERT INTO paper_authors (paper_id, full_name, email, affiliation, orcid, ror_id, credit_roles, is_primary, seq)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPaperAuthor.run(
    1, 
    "Dr. Lucas Martins", 
    "autor@unesp.br", 
    "Universidade Estadual Paulista (UNESP)", 
    "0000-0002-1825-0097", 
    "https://ror.org/01y9bpm73", 
    "Conceitualização, Metodologia, Investigação, Escrita – rascunho original", 
    1, 
    1
  );
  insertPaperAuthor.run(
    1, 
    "Camila Rocha", 
    "coautor@usp.br", 
    "Universidade de São Paulo (USP)", 
    "0000-0003-4567-8901", 
    "https://ror.org/04xfq0f34", 
    "Curadoria de dados, Análise formal, Escrita – revisão e edição", 
    0, 
    2
  );
  insertPaperAuthor.run(
    2, 
    "Dr. Lucas Martins", 
    "autor@unesp.br", 
    "Universidade Estadual Paulista (UNESP)", 
    "0000-0002-1825-0097", 
    "https://ror.org/01y9bpm73", 
    "Conceitualização, Metodologia, Software, Validação", 
    1, 
    1
  );
  insertPaperAuthor.run(
    3, 
    "Dr. Lucas Martins", 
    "autor@unesp.br", 
    "Universidade Estadual Paulista (UNESP)", 
    "0000-0002-1825-0097", 
    "https://ror.org/01y9bpm73", 
    "Conceitualização, Investigação, Redação", 
    1, 
    1
  );
  insertPaperAuthor.run(
    4, 
    "Dr. Lucas Martins", 
    "autor@unesp.br", 
    "Universidade Estadual Paulista (UNESP)", 
    "0000-0002-1825-0097", 
    "https://ror.org/01y9bpm73", 
    "Investigação, Metodologia, Redação", 
    1, 
    1
  );
  insertPaperAuthor.run(
    5, 
    "Dr. Lucas Martins", 
    "autor@unesp.br", 
    "Universidade Estadual Paulista (UNESP)", 
    "0000-0002-1825-0097", 
    "https://ror.org/01y9bpm73", 
    "Conceitualização, Escrita – rascunho original", 
    1, 
    1
  );

  // Inserir Avaliações / Pareceres
  const insertReview = db.prepare(`
    INSERT INTO review_assignments (paper_id, reviewer_id, status, recommendation, score_originality, score_methodology, score_clarity, score_relevance, comments_author, comments_director, date_assigned, date_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Avaliação do Artigo 1 (Publicado)
  insertReview.run(
    1,
    4,
    "completed",
    "accept",
    5,
    5,
    4,
    5,
    "Excelente contribuição para a área de repositórios digitais e plataformas abertas da PKP. A metodologia está bem estruturada e os dados empíricos são robustos.",
    "Recomendo veementemente o aceite como apresentação oral em destaque na sessão de abertura da Trilha 1.",
    "2026-07-22 09:00:00",
    "2026-08-05 15:30:00"
  );

  insertReview.run(
    1,
    5,
    "completed",
    "accept",
    4,
    4,
    5,
    4,
    "O artigo traz uma discussão muito atual sobre os desafios de interoperabilidade no ecossistema OCS/OJS. O texto é claro e objetivo.",
    "Trabalho maduro. Pronto para publicação nos anais.",
    "2026-07-22 09:00:00",
    "2026-08-08 11:20:00"
  );

  // Avaliação do Artigo 2 (Aceito)
  insertReview.run(
    2,
    4,
    "completed",
    "accept",
    4,
    4,
    4,
    5,
    "Tema inovador e muito pertinente. O uso de IA para triagem de anonimização resolve um gargalo real enfrentado pelos gerentes de conferência do OCS.",
    "Excelente artigo. Pequenos ajustes de referências recomendados na versão final.",
    "2026-07-25 10:00:00",
    "2026-08-12 17:00:00"
  );

  // Avaliação do Artigo 3 (Em andamento - 1 completado e 1 pendente)
  insertReview.run(
    3,
    4,
    "completed",
    "revisions",
    4,
    3,
    4,
    4,
    "O resgate histórico da versão 2.3.6 do OCS é fascinante. Sugiro aos autores aprofundarem a comparação com o Indico e OpenReview na seção 3.",
    "Trabalho relevante, mas recomendo solicitar uma breve revisão para reforçar o embasamento prático antes do aceite final.",
    "2026-08-03 14:00:00",
    "2026-08-18 16:40:00"
  );

  insertReview.run(
    3,
    5,
    "pending",
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    "2026-08-03 14:00:00",
    null
  );

  // Decisão Editorial do Artigo 1 e 2
  const insertDecision = db.prepare(`
    INSERT INTO edit_decisions (paper_id, director_id, decision, comments, date_decided)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertDecision.run(
    1,
    3,
    "accept",
    "Prezado autor, com base nas avaliações positivas de ambos os pareceristas, temos o prazer de informar que seu artigo foi aceito para apresentação oral e publicação nos Anais do X CITECA 2026.",
    "2026-08-10 18:00:00"
  );

  insertDecision.run(
    2,
    3,
    "accept",
    "Prezado autor, seu trabalho foi aceito para apresentação no evento.",
    "2026-08-15 14:00:00"
  );

  // Inserir Salas da Programação
  const insertRoom = db.prepare(`
    INSERT INTO rooms (sched_conf_id, name, building, capacity)
    VALUES (?, ?, ?, ?)
  `);

  insertRoom.run(1, "Auditório Principal - Paulo Freire", "Prédio Central (Presencial)", 350);
  insertRoom.run(1, "Sala Temática A - Darcy Ribeiro", "Ala Norte (Presencial)", 80);
  insertRoom.run(1, "Sala Virtual 1 - Google Meet", "Ambiente Virtual / Remoto", 250);
  insertRoom.run(1, "Sala Virtual 2 - Zoom Transmissão", "Ambiente Híbrido / Remoto", 500);

  // Inserir Blocos de Horário
  const insertBlock = db.prepare(`
    INSERT INTO time_blocks (sched_conf_id, date, start_time, end_time, title)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertBlock.run(1, "2026-11-10", "09:00", "10:30", "Sessão de Abertura & Conferência Magna");
  insertBlock.run(1, "2026-11-10", "11:00", "12:30", "Sessão Técnica 1 - Ciência Aberta e Repositórios");
  insertBlock.run(1, "2026-11-10", "14:00", "15:30", "Sessão Técnica 2 - IA e Inovações Editoriais");
  insertBlock.run(1, "2026-11-11", "10:00", "12:00", "Sessão de Pôsteres & Demonstrações");

  // Inserir Apresentações Agendadas com Modalidades (Presencial e Online com Links)
  const insertPresentation = db.prepare(`
    INSERT INTO scheduled_presentations (sched_conf_id, paper_id, room_id, time_block_id, start_time, end_time, modality, meeting_url, meeting_instructions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPresentation.run(
    1, 1, 1, 2, "11:00", "11:30",
    "presential",
    null,
    "Apresentação presencial no Auditório Paulo Freire. Projetor e passador de slides disponíveis."
  );

  insertPresentation.run(
    1, 2, 3, 3, "14:00", "14:30",
    "online",
    "https://meet.google.com/cit-eca2-026",
    "Transmissão online via Google Meet. Link direto para apresentação do autor e perguntas dos congressistas."
  );

  // Inserir Inscrições de Participantes
  const insertReg = db.prepare(`
    INSERT INTO registrations (sched_conf_id, full_name, email, affiliation, category, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertReg.run(1, "Lucas Martins", "autor@unesp.br", "UNESP", "Professor/Pesquisador", "confirmed");
  insertReg.run(1, "Camila Rocha", "coautor@usp.br", "USP", "Pós-Graduando", "confirmed");
  insertReg.run(1, "Juliana Costa", "juliana.costa@unicamp.br", "Unicamp", "Estudante de Graduação", "confirmed");

  // Inserir Comunicados (Announcements)
  const insertAnn = db.prepare(`
    INSERT INTO announcements (conference_id, sched_conf_id, title, summary, content)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertAnn.run(
    1,
    1,
    "Chamada de Trabalhos (CFP) Oficial do X CITECA 2026",
    "Estão abertas as submissões de artigos completos e resumos estendidos para as 3 trilhas temáticas do CITECA 2026.",
    "O Comitê de Programa do X CITECA 2026 convida pesquisadores, estudantes e profissionais da informação a submeterem trabalhos inéditos até o dia 30 de agosto de 2026. Todas as submissões passarão pelo processo rigoroso de avaliação cega por pares (double-blind peer review) conforme a tradição do Open Conference Systems."
  );

  insertAnn.run(
    1,
    1,
    "Publicação dos Anais da Edição Anterior (CITECA 2025)",
    "Os trabalhos apresentados na edição de Curitiba já estão indexados e disponíveis para download em acesso aberto.",
    "Convidamos a comunidade a consultar o repositório de anais do IX CITECA 2025, com 82 trabalhos completos acompanhados de metadados Dublin Core e arquivos PDF para livre consulta."
  );

    console.log("Banco de dados PKP OCS inicializado com sucesso!");
  } catch (e) {
    // Ignorar concorrência de seeding
  }
}

// Inicializar na primeira carga
try {
  seedDatabaseIfEmpty();
} catch (e) {
  // Ignorar
}

export { db };
export default db;
