import {
  generateCrossrefXml,
  getActiveSchedConf,
  getPublishedProceedings,
  type Paper,
  type SchedConf,
} from "./ocs-service.ts";
import { escapeHtml } from "./security.ts";
import { buildZipBuffer, type ZipEntryInput } from "./zip.ts";

const SHARED_CSS = `
:root { --bg:#f8fafc; --card:#ffffff; --border:#e2e8f0; --text:#0f172a; --muted:#475569; --accent:#1d4ed8; --purple:#6d28d9; --green:#047857; }
* { box-sizing: border-box; }
body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.wrap { max-width: 980px; margin: 0 auto; padding: 28px 18px 64px; }
.card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 24px; margin-bottom: 18px; }
.badges { display:flex; flex-wrap:wrap; gap:8px; margin-bottom: 10px; font-size: 12px; }
.badge { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius: 999px; font-weight:700; font-size: 11px; border:1px solid var(--border); background:#f1f5f9; color:#334155; }
.badge.purple { background:#f5f3ff; border-color:#ddd6fe; color:var(--purple); }
.badge.green { background:#ecfdf5; border-color:#a7f3d0; color:var(--green); }
.badge.blue { background:#eff6ff; border-color:#bfdbfe; color:var(--accent); }
h1 { margin: 6px 0 8px; font-size: 26px; line-height: 1.25; letter-spacing: -0.02em; }
h2 { margin: 22px 0 10px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.04em; color:#1e293b; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
.meta-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin-top: 16px; }
.meta-box { background:#f8fafc; border:1px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 12px; }
.meta-box strong { display:block; font-size:10px; text-transform:uppercase; color:var(--muted); margin-bottom:3px; }
.search-bar { width:100%; padding:11px 14px; border:1px solid #cbd5e1; border-radius:10px; font-size:14px; margin-top:14px; }
.tracks { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }
.track-btn { border:1px solid #cbd5e1; background:#fff; color:#334155; padding:6px 11px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; }
.track-btn.active { background: var(--accent); color:#fff; border-color:var(--accent); }
.authors-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-top:10px; }
.author-card { background:#f8fafc; border:1px solid var(--border); border-radius:10px; padding:12px 14px; font-size:13px; }
.author-name { font-weight:700; color:var(--text); }
.author-aff { font-size:12px; color:var(--muted); margin-top:2px; }
.author-links { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; font-size:11px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.pill { display:inline-flex; align-items:center; gap:4px; padding:2px 7px; border-radius:6px; border:1px solid var(--border); background:#fff; color:#334155; }
.pill.orcid { background:#ecfdf5; border-color:#a7f3d0; color:#065f46; }
.pill.ror { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
.credit { margin-top:8px; padding-top:6px; border-top:1px dashed var(--border); font-size:11px; color:var(--muted); font-style:italic; }
.paper-item { background:#fff; border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:14px; }
.paper-title { margin:0 0 8px; font-size:18px; line-height:1.3; }
.abstract { font-size:14px; color:#334155; text-align:justify; white-space:pre-line; }
.section-body { font-size:15px; color:#1e293b; text-align:justify; white-space:pre-line; }
.cite-box { background:#f8fafc; border:1px solid var(--border); border-radius:10px; padding:12px 14px; font-size:12.5px; color:#334155; margin-top:8px; }
.actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
.btn { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:9px; font-size:12px; font-weight:700; border:1px solid var(--border); background:#fff; color:var(--text); cursor:pointer; }
.btn.primary { background:var(--accent); border-color:var(--accent); color:#fff; }
.footer { margin-top:32px; text-align:center; font-size:12px; color:var(--muted); }
@media print { .no-print { display:none !important; } body { background:#fff; } .card { border:none; padding:0; } }
`;

function cleanOrcid(raw?: string): string {
  return (raw || "").replace(/^https?:\/\/(sandbox\.)?orcid\.org\//i, "").trim();
}

function cleanRor(raw?: string): string {
  return (raw || "").replace(/^https?:\/\/ror\.org\//i, "").trim();
}

function buildAbntCitation(paper: Paper, sched: SchedConf): string {
  const year = (sched.start_date || "2026").slice(0, 4);
  const city = (sched.city || sched.location || "Brasil").split(",")[0].trim();
  const authors = (paper.authors || [])
    .map((a) => {
      const parts = a.full_name.trim().split(/\s+/);
      const last = (parts.pop() || "").toUpperCase();
      return parts.length > 0 ? `${last}, ${parts.join(" ")}` : last;
    })
    .join("; ");
  const pageRange = `${paper.page_start || 1}-${paper.page_end || 5}`;
  const isbnPart = sched.isbn ? ` ISBN: ${sched.isbn}.` : "";
  const doiPart = paper.doi ? ` DOI: https://doi.org/${paper.doi}.` : "";
  return `${authors || "AUTOR"}. ${paper.title}. In: ANAIS DO ${sched.title.toUpperCase()}, ${year}, ${city}. Anais eletrônicos... ${city.toUpperCase()}: OCW, ${year}. p. ${pageRange}.${isbnPart}${doiPart}`;
}

function renderPaperHtml(paper: Paper, sched: SchedConf): string {
  const year = (sched.start_date || "2026").slice(0, 4);
  const authors = paper.authors || [];
  const scholarAuthorMeta = authors
    .map((a) => {
      const lines = [`  <meta name="citation_author" content="${escapeHtml(a.full_name)}">`];
      if (a.affiliation) {
        lines.push(`  <meta name="citation_author_institution" content="${escapeHtml(a.affiliation)}">`);
      }
      const oc = cleanOrcid(a.orcid);
      if (oc) {
        lines.push(`  <meta name="citation_author_orcid" content="https://orcid.org/${escapeHtml(oc)}">`);
      }
      lines.push(`  <meta name="DC.Creator" content="${escapeHtml(a.full_name)}">`);
      return lines.join("\n");
    })
    .join("\n");

  const authorsCards = authors
    .map((a) => {
      const oc = cleanOrcid(a.orcid);
      const ror = cleanRor(a.ror_id);
      return `
        <div class="author-card">
          <div class="author-name">${escapeHtml(a.full_name)}</div>
          ${a.affiliation ? `<div class="author-aff">${escapeHtml(a.affiliation)}</div>` : ""}
          <div class="author-links">
            ${a.email ? `<a class="pill" href="mailto:${escapeHtml(a.email)}">${escapeHtml(a.email)}</a>` : ""}
            ${oc ? `<a class="pill orcid" href="https://orcid.org/${escapeHtml(oc)}" target="_blank" rel="noopener noreferrer">ORCID: ${escapeHtml(oc)}</a>` : ""}
            ${ror ? `<a class="pill ror" href="https://ror.org/${escapeHtml(ror)}" target="_blank" rel="noopener noreferrer">ROR: ${escapeHtml(ror)}</a>` : ""}
          </div>
          ${a.credit_roles ? `<div class="credit">CRediT: ${escapeHtml(a.credit_roles)}</div>` : ""}
        </div>`;
    })
    .join("\n");

  const sections: Array<{ title: string; body?: string }> = [
    { title: "1. Introdução", body: paper.section_intro },
    { title: "2. Metodologia", body: paper.section_methods },
    { title: "3. Resultados e Discussão", body: paper.section_results },
    { title: "4. Considerações Finais", body: paper.section_conclusion },
  ].filter((s) => Boolean(s.body && s.body.trim()));

  const sectionsHtml = sections
    .map(
      (s) => `
      <h2>${escapeHtml(s.title)}</h2>
      <div class="section-body">${escapeHtml(s.body || "")}</div>`
    )
    .join("\n");

  const refs = (paper.references_text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const refsHtml =
    refs.length > 0
      ? `<h2>Referências Bibliográficas</h2><ol style="padding-left:20px;font-size:13.5px;color:#334155;">${refs
          .map((r) => `<li style="margin-bottom:8px;">${escapeHtml(r)}</li>`)
          .join("")}</ol>`
      : "";

  const abnt = buildAbntCitation(paper, sched);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(paper.title)} | Anais — ${escapeHtml(sched.title)}</title>
  <meta name="citation_title" content="${escapeHtml(paper.title)}">
  <meta name="citation_conference_title" content="${escapeHtml(sched.title)}">
  <meta name="citation_publication_date" content="${escapeHtml(year)}">
  <meta name="citation_firstpage" content="${escapeHtml(String(paper.page_start || 1))}">
  <meta name="citation_lastpage" content="${escapeHtml(String(paper.page_end || 5))}">
  ${sched.isbn ? `<meta name="citation_isbn" content="${escapeHtml(sched.isbn)}">` : ""}
  ${paper.doi ? `<meta name="citation_doi" content="${escapeHtml(paper.doi)}">` : ""}
  <meta name="DC.Title" content="${escapeHtml(paper.title)}">
  <meta name="DC.Date" content="${escapeHtml(year)}">
  <meta name="DC.Language" content="pt">
${scholarAuthorMeta}
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="wrap">
    <div class="no-print" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:13px;">
      <a href="../index.html">&larr; Voltar aos Anais (${escapeHtml(sched.acronym)})</a>
      <button class="btn primary" onclick="window.print()">Imprimir / Salvar PDF</button>
    </div>

    <article class="card">
      <div class="badges">
        <span class="badge purple">${escapeHtml(sched.title)}</span>
        ${paper.track_title ? `<span class="badge blue">${escapeHtml(paper.track_title)}</span>` : ""}
        <span class="badge green">Acesso Aberto (CC BY 4.0)</span>
        ${paper.doi ? `<a class="badge blue" href="https://doi.org/${escapeHtml(paper.doi)}" target="_blank" rel="noopener noreferrer">DOI: ${escapeHtml(paper.doi)}</a>` : ""}
        ${sched.isbn ? `<span class="badge">ISBN: ${escapeHtml(sched.isbn)}</span>` : ""}
        <span class="badge">p. ${escapeHtml(String(paper.page_start || 1))}-${escapeHtml(String(paper.page_end || 5))}</span>
      </div>

      <h1>${escapeHtml(paper.title)}</h1>

      <h2>Autores e Identificadores</h2>
      <div class="authors-grid">${authorsCards}</div>

      ${paper.funding ? `<h2>Fomento à Pesquisa</h2><p class="abstract">${escapeHtml(paper.funding)}</p>` : ""}

      <h2>Resumo</h2>
      <p class="abstract">${escapeHtml(paper.abstract)}</p>

      ${
        paper.keywords
          ? `<p style="font-size:13px;color:#475569;"><strong>Palavras-chave:</strong> ${escapeHtml(paper.keywords)}</p>`
          : ""
      }

      ${sectionsHtml}
      ${refsHtml}

      <h2>Como Citar (ABNT)</h2>
      <div class="cite-box">${escapeHtml(abnt)}</div>
    </article>

    <div class="footer">
      Anais Permanentes &bull; ${escapeHtml(sched.title)} (${escapeHtml(sched.city || sched.location || "")}) &bull; Open Conference Werneckiana
    </div>
  </div>
</body>
</html>`;
}

function renderIndexHtml(sched: SchedConf, papers: Paper[]): string {
  const tracks = Array.from(new Set(papers.map((p) => p.track_title || "Geral")));

  const itemsHtml = papers
    .map((p) => {
      const authors = p.authors || [];
      const searchable = [
        p.title,
        p.abstract,
        p.keywords || "",
        p.doi || "",
        p.track_title || "",
        ...authors.flatMap((a) => [a.full_name, a.email, a.affiliation, a.orcid || "", a.ror_id || ""]),
      ]
        .join(" ")
        .toLowerCase();

      const authorsHtml = authors
        .map((a) => {
          const oc = cleanOrcid(a.orcid);
          const ror = cleanRor(a.ror_id);
          return `<span class="pill">
            <strong>${escapeHtml(a.full_name)}</strong>
            ${a.affiliation ? `(${escapeHtml(a.affiliation)})` : ""}
            ${a.email ? `&middot; <a href="mailto:${escapeHtml(a.email)}">${escapeHtml(a.email)}</a>` : ""}
            ${oc ? `&middot; <a href="https://orcid.org/${escapeHtml(oc)}" target="_blank" rel="noopener noreferrer">ORCID:${escapeHtml(oc)}</a>` : ""}
            ${ror ? `&middot; <a href="https://ror.org/${escapeHtml(ror)}" target="_blank" rel="noopener noreferrer">ROR:${escapeHtml(ror)}</a>` : ""}
          </span>`;
        })
        .join(" ");

      return `
      <article class="paper-item" data-track="${escapeHtml(p.track_title || "Geral")}" data-search="${escapeHtml(searchable)}">
        <div class="badges">
          ${p.track_title ? `<span class="badge blue">${escapeHtml(p.track_title)}</span>` : ""}
          ${p.doi ? `<a class="badge" href="https://doi.org/${escapeHtml(p.doi)}" target="_blank" rel="noopener noreferrer">DOI: ${escapeHtml(p.doi)}</a>` : ""}
          <span class="badge">p. ${escapeHtml(String(p.page_start || 1))}-${escapeHtml(String(p.page_end || 5))}</span>
        </div>
        <h3 class="paper-title">
          <a href="artigos/artigo-${p.id}.html">${escapeHtml(p.title)}</a>
        </h3>
        <div class="author-links" style="margin-bottom:10px;">${authorsHtml}</div>
        <p class="abstract" style="margin:0 0 12px;">${escapeHtml(p.abstract)}</p>
        <a class="btn primary" href="artigos/artigo-${p.id}.html">Ler Trabalho Completo &rarr;</a>
      </article>`;
    })
    .join("\n");

  const trackButtons = [
    `<button type="button" class="track-btn active" data-track="ALL">Todas (${papers.length})</button>`,
    ...tracks.map((tr) => {
      const count = papers.filter((p) => (p.track_title || "Geral") === tr).length;
      return `<button type="button" class="track-btn" data-track="${escapeHtml(tr)}">${escapeHtml(tr)} (${count})</button>`;
    }),
  ].join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Anais — ${escapeHtml(sched.title)}</title>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="wrap">
    <header class="card">
      <div class="badges">
        <span class="badge blue">${escapeHtml(sched.acronym)}</span>
        <span class="badge purple">Anais Oficiais — Preservação Permanente</span>
        <span class="badge green">Acesso Aberto (CC BY 4.0)</span>
      </div>
      <h1>Anais do ${escapeHtml(sched.title)}</h1>
      ${sched.description ? `<p style="font-size:14px;color:#475569;margin:4px 0 0;">${escapeHtml(sched.description)}</p>` : ""}

      <div class="meta-grid">
        <div class="meta-box"><strong>Cidade Sede</strong>${escapeHtml(sched.city || sched.location || "-")}</div>
        <div class="meta-box"><strong>Período</strong>${escapeHtml(sched.start_date)} a ${escapeHtml(sched.end_date)}</div>
        <div class="meta-box"><strong>ISBN do Volume</strong>${escapeHtml(sched.isbn || "Não informado")}</div>
        <div class="meta-box"><strong>DOI dos Anais</strong>${escapeHtml(sched.proceedings_doi || "Não informado")}</div>
        <div class="meta-box"><strong>Trabalhos Publicados</strong>${papers.length}</div>
      </div>

      <input id="q" class="search-bar" type="search" placeholder="Buscar por título, autor, e-mail, instituição, ORCID, ROR, DOI ou palavra-chave...">
      <div class="tracks" id="tracks">${trackButtons}</div>
    </header>

    <div id="count" style="font-size:12px;color:#475569;margin:0 0 12px 4px;">
      Exibindo <strong>${papers.length}</strong> de ${papers.length} trabalhos publicados
    </div>

    <main id="list">
      ${itemsHtml || '<div class="card">Nenhum trabalho publicado neste volume até o momento.</div>'}
    </main>

    <div class="footer">
      Pacote Estático de Preservação Digital &bull; Open Conference Werneckiana &bull; <a href="metadados/anais.json">anais.json</a> &bull; <a href="metadados/crossref.xml">crossref.xml</a>
    </div>
  </div>

  <script>
    (function () {
      var q = document.getElementById('q');
      var items = Array.prototype.slice.call(document.querySelectorAll('.paper-item'));
      var buttons = Array.prototype.slice.call(document.querySelectorAll('.track-btn'));
      var countEl = document.getElementById('count');
      var activeTrack = 'ALL';
      function apply() {
        var term = (q.value || '').trim().toLowerCase();
        var visible = 0;
        items.forEach(function (el) {
          var okTrack = activeTrack === 'ALL' || el.getAttribute('data-track') === activeTrack;
          var okTerm = !term || (el.getAttribute('data-search') || '').indexOf(term) !== -1;
          var show = okTrack && okTerm;
          el.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        countEl.innerHTML = 'Exibindo <strong>' + visible + '</strong> de ' + items.length + ' trabalhos publicados';
      }
      q.addEventListener('input', apply);
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeTrack = btn.getAttribute('data-track') || 'ALL';
          buttons.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          apply();
        });
      });
    })();
  </script>
</body>
</html>`;
}

export function buildStaticProceedingsArchive(schedConfId: number): {
  filename: string;
  zipBuffer: Buffer;
  paperCount: number;
  entries: string[];
} {
  const sched = getActiveSchedConf(schedConfId);
  if (!sched) {
    throw new Error("Edição de conferência não encontrada.");
  }

  const papers = getPublishedProceedings(sched.id);
  const crossrefXml = generateCrossrefXml(sched.id);
  const safeSlug = (sched.slug || `edicao-${sched.id}`).replace(/[^a-z0-9_-]/gi, "-").toLowerCase();

  const entries: ZipEntryInput[] = [
    {
      name: "index.html",
      content: renderIndexHtml(sched, papers),
    },
    ...papers.map((paper) => ({
      name: `artigos/artigo-${paper.id}.html`,
      content: renderPaperHtml(paper, sched),
    })),
    {
      name: "metadados/crossref.xml",
      content: crossrefXml,
    },
    {
      name: "metadados/anais.json",
      content: JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          edition: {
            id: sched.id,
            title: sched.title,
            acronym: sched.acronym,
            slug: sched.slug,
            city: sched.city,
            location: sched.location,
            start_date: sched.start_date,
            end_date: sched.end_date,
            isbn: sched.isbn,
            proceedings_doi: sched.proceedings_doi,
          },
          papers_count: papers.length,
          papers: papers.map((p) => ({
            id: p.id,
            title: p.title,
            abstract: p.abstract,
            keywords: p.keywords,
            doi: p.doi,
            track: p.track_title,
            pages: `${p.page_start || 1}-${p.page_end || 5}`,
            authors: (p.authors || []).map((a) => ({
              full_name: a.full_name,
              email: a.email,
              affiliation: a.affiliation,
              orcid: a.orcid || null,
              ror_id: a.ror_id || null,
              credit_roles: a.credit_roles || null,
            })),
            file: `artigos/artigo-${p.id}.html`,
          })),
        },
        null,
        2
      ),
    },
    {
      name: "README.txt",
      content: [
        `ANAIS ESTÁTICOS PERMANENTES — ${sched.title}`,
        "==========================================================",
        "",
        "Este pacote é 100% estático (HTML/CSS/JS puro) e NÃO precisa",
        "de banco de dados, Node.js ou servidor dinâmico para funcionar.",
        "",
        "COMO PUBLICAR PERMANENTEMENTE (CUSTO ZERO):",
        "1. Descompacte este arquivo .zip.",
        "2. Suba o conteúdo da pasta para qualquer uma das opções:",
        "   - GitHub Pages (repositório estático gratuito);",
        "   - Vercel / Netlify / Cloudflare Pages (deploy estático);",
        "   - Servidor institucional (Apache/Nginx da universidade);",
        "   - Zenodo (arquivamento científico de longo prazo com DOI).",
        "",
        "CONTEÚDO DO PACOTE:",
        "- index.html .............. Capa dos Anais com busca e filtro por trilha",
        "- artigos/artigo-*.html ... Páginas individuais com metatags Google Scholar,",
        "                            ORCID, ROR, e-mail, CRediT, texto IMRaD e ABNT",
        "- metadados/crossref.xml .. XML Crossref 4.4.2 pronto para depósito",
        "- metadados/anais.json .... Metadados estruturados em JSON",
        "",
      ].join("\n"),
    },
  ];

  const zipBuffer = buildZipBuffer(entries);
  return {
    filename: `anais-${safeSlug}.zip`,
    zipBuffer,
    paperCount: papers.length,
    entries: entries.map((e) => e.name),
  };
}
