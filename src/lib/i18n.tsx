"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Locale = "pt" | "en" | "es";

interface Translations {
  [key: string]: {
    pt: string;
    en: string;
    es: string;
  };
}

export const translations: Translations = {
  // Brand & Topbar
  portalTitle: {
    pt: "Open Conference Werneckiana",
    en: "Open Conference Werneckiana",
    es: "Open Conference Werneckiana",
  },
  tagline: {
    pt: "Plataforma Acadêmica de Conferências • OCW v1.0",
    en: "Academic Conference Platform • OCW v1.0",
    es: "Plataforma Académica de Conferencias • OCW v1.0",
  },
  openAccessBadge: {
    pt: "Acesso Aberto • Ciência Aberta",
    en: "Open Access • Open Science",
    es: "Acceso Abierto • Ciencia Abierta",
  },

  // Navbar
  navHome: {
    pt: "Portal OCW",
    en: "OCW Portal",
    es: "Portal OCW",
  },
  navProceedings: {
    pt: "Anais (Proceedings)",
    en: "Proceedings",
    es: "Actas (Proceedings)",
  },
  navSchedule: {
    pt: "Programação",
    en: "Schedule",
    es: "Programa",
  },
  navRegister: {
    pt: "Inscrições",
    en: "Registration",
    es: "Inscripciones",
  },
  roleEditor: {
    pt: "Fila Editorial (Editor)",
    en: "Editorial Queue (Editor)",
    es: "Cola Editorial (Editor)",
  },
  roleReviewer: {
    pt: "Avaliações (Parecerista)",
    en: "Reviewer Area",
    es: "Área de Evaluador",
  },
  roleAuthor: {
    pt: "Minhas Submissões",
    en: "My Submissions",
    es: "Mis Envíos",
  },

  // Home Hero
  heroBadge: {
    pt: "Clone Funcional PKP Open Conference Systems (OCS 2.3.6)",
    en: "Functional Clone PKP Open Conference Systems (OCS 2.3.6)",
    es: "Clon Funcional PKP Open Conference Systems (OCS 2.3.6)",
  },
  heroTitle: {
    pt: "Gestão Integral de Conferências e Simpósios Científicos",
    en: "Comprehensive Management of Scientific Conferences and Symposia",
    es: "Gestión Integral de Conferencias y Simposios Científicos",
  },
  heroDesc: {
    pt: "Plataforma acadêmica completa para chamada de trabalhos (CFP), avaliação por pares duplo-cega, agendamento de apresentações e publicação de anais em acesso aberto.",
    en: "Complete academic platform for call for papers (CFP), double-blind peer review, presentation scheduling, and open access proceedings publication.",
    es: "Plataforma académica completa para convocatoria de ponencias (CFP), revisión por pares doble ciego, programación de presentaciones y publicación de actas en acceso abierto.",
  },
  btnConferences: {
    pt: "Conferências Ativas",
    en: "Active Conferences",
    es: "Conferencias Activas",
  },
  btnProceedings: {
    pt: "Consultar Anais",
    en: "Browse Proceedings",
    es: "Consultar Actas",
  },
  btnEditorQueue: {
    pt: "Painel do Editor",
    en: "Editor's Panel",
    es: "Panel del Editor",
  },

  // Roles demo section
  rolesNavTitle: {
    pt: "Navegação Rápida pelos Papéis do OCS",
    en: "Quick Navigation by OCS Roles",
    es: "Navegación Rápida por Roles de OCS",
  },
  rolesNavDesc: {
    pt: "Teste qualquer etapa do fluxo editorial acessando os painéis dedicados abaixo:",
    en: "Test any stage of the editorial workflow by accessing the dedicated panels below:",
    es: "Pruebe cualquier etapa del flujo editorial accediendo a los paneles dedicados:",
  },
  newSubmissionBtn: {
    pt: "+ Nova Submissão",
    en: "+ New Submission",
    es: "+ Nuevo Envío",
  },

  // Conference Card & Details
  hostedConferencesTitle: {
    pt: "Conferências Hospedadas no Portal",
    en: "Hosted Conferences in Portal",
    es: "Conferencias Alojadas en el Portal",
  },
  hostedConferencesDesc: {
    pt: "Selecione uma conferência para consultar informações, submeter trabalhos ou visualizar anais.",
    en: "Select a conference to view details, submit papers, or access proceedings.",
    es: "Seleccione una conferencia para ver información, enviar ponencias o consultar actas.",
  },
  activeEdition: {
    pt: "Edição Ativa",
    en: "Active Edition",
    es: "Edición Activa",
  },
  callOpen: {
    pt: "Chamada Aberta",
    en: "Call for Papers Open",
    es: "Convocatoria Abierta",
  },
  locationLabel: {
    pt: "Local",
    en: "Venue",
    es: "Lugar",
  },
  cityLabel: {
    pt: "Cidade do Evento",
    en: "Host City",
    es: "Ciudad Sede",
  },
  proceedingsDoiLabel: {
    pt: "DOI dos Anais",
    en: "Proceedings DOI",
    es: "DOI de las Actas",
  },
  eventIsbn: {
    pt: "ISBN do Evento",
    en: "Conference ISBN",
    es: "ISBN del Evento",
  },
  proceedingsIsbn: {
    pt: "ISBN dos Anais",
    en: "Proceedings ISBN",
    es: "ISBN de las Actas",
  },
  submissionDeadline: {
    pt: "Prazo de Submissão",
    en: "Submission Deadline",
    es: "Plazo de Envío",
  },
  submitPaper: {
    pt: "Submeter Artigo",
    en: "Submit Paper",
    es: "Enviar Ponencia",
  },
  tracksLabel: {
    pt: "Modalidades e Trilhas Temáticas (Tracks)",
    en: "Tracks & Modalities",
    es: "Ejes Temáticos y Modalidades",
  },

  // Submission Wizard
  wizardTitle: {
    pt: "Submissão de Manuscrito Acadêmico",
    en: "Academic Manuscript Submission",
    es: "Envío de Manuscrito Académico",
  },
  wizardDesc: {
    pt: "Fluxo editorial em 5 passos em conformidade com o padrão PKP Open Conference Systems (OCS 2.3.6).",
    en: "5-step editorial workflow following the PKP Open Conference Systems (OCS 2.3.6) standard.",
    es: "Flujo editorial en 5 pasos de conformidad con el estándar PKP Open Conference Systems (OCS 2.3.6).",
  },
  step1: { pt: "1. Início & Termos", en: "1. Start & Terms", es: "1. Inicio y Términos" },
  step2: { pt: "2. Upload do Manuscrito", en: "2. Upload Manuscript", es: "2. Cargar Manuscrito" },
  step3: { pt: "3. Metadados & Autores", en: "3. Metadata & Authors", es: "3. Metadatos y Autores" },
  step4: { pt: "4. Doc. Suplementares", en: "4. Supp. Files", es: "4. Doc. Suplementarios" },
  step5: { pt: "5. Confirmação", en: "5. Confirmation", es: "5. Confirmación" },
  commentsToEditor: {
    pt: "Comentários para o Editor da Conferência (Opcional)",
    en: "Comments to the Conference Editor (Optional)",
    es: "Comentarios para el Editor de la Conferencia (Opcional)",
  },
  fundingLabel: {
    pt: "Financiamento da Pesquisa (Agência de Fomento & Processo)",
    en: "Research Funding (Grant Agency & Award Number)",
    es: "Financiación de la Investigación (Agencia de Fomento y Proceso)",
  },
  orcidLabel: {
    pt: "ORCID do Autor (Ex: 0000-0002-1825-0097)",
    en: "Author ORCID (e.g. 0000-0002-1825-0097)",
    es: "ORCID del Autor (Ej: 0000-0002-1825-0097)",
  },
  rorLabel: {
    pt: "ROR ID da Instituição (Ex: https://ror.org/04xfq0f34)",
    en: "Institution ROR ID (e.g. https://ror.org/04xfq0f34)",
    es: "ROR ID de la Institución (Ej: https://ror.org/04xfq0f34)",
  },
  creditRolesLabel: {
    pt: "Papel CRediT do Autor (Taxonomia de Contribuição)",
    en: "Author CRediT Role (Contributor Roles Taxonomy)",
    es: "Rol CRediT del Autor (Taxonomía de Contribución)",
  },

  // Editor Dashboard
  editorDashboardTitle: {
    pt: "Fila de Gestão Editorial & Pareceres (Editor)",
    en: "Editorial Management Queue & Reviews (Editor)",
    es: "Cola de Gestión Editorial y Evaluaciones (Editor)",
  },
  editorDashboardDesc: {
    pt: "Coordenação de submissões, atribuição de pareceristas duplo-cegos e registro de decisões editoriais.",
    en: "Coordination of submissions, double-blind reviewer assignments, and recording of editorial decisions.",
    es: "Coordinación de envíos, asignación de evaluadores doble ciego y registro de decisiones editoriales.",
  },
  editorRoleBadge: {
    pt: "Papel: Editor de Conferência",
    en: "Role: Conference Editor",
    es: "Rol: Editor de Conferencia",
  },
  assignReviewerBtn: {
    pt: "Atribuir Parecerista",
    en: "Assign Reviewer",
    es: "Asignar Evaluador",
  },
  editorialDecisionBtn: {
    pt: "Decisão Editorial",
    en: "Editorial Decision",
    es: "Decisión Editorial",
  },

  // Reviewer Dashboard
  reviewerDashboardTitle: {
    pt: "Pareceres e Avaliação Cega por Pares",
    en: "Peer Review & Double-Blind Evaluations",
    es: "Evaluaciones y Revisión por Pares a Doble Ciego",
  },
  reviewerDashboardDesc: {
    pt: "Avalie manuscritos anonimizados atribuídos pelo comitê editorial com base em critérios científicos objetivos.",
    en: "Review anonymized manuscripts assigned by the editorial committee based on objective scientific criteria.",
    es: "Evalúe manuscritos anonimizados asignados por el comité editorial con base en criterios científicos objetivos.",
  },
  reviewerRoleBadge: {
    pt: "Papel: Avaliador por Pares (Reviewer)",
    en: "Role: Peer Reviewer",
    es: "Rol: Evaluador por Pares (Reviewer)",
  },
  originalityScore: {
    pt: "1. Originalidade e Inovação",
    en: "1. Originality and Innovation",
    es: "1. Originalidad e Innovación",
  },
  methodologyScore: {
    pt: "2. Rigor Metodológico e Fundamentação",
    en: "2. Methodological Rigor",
    es: "2. Rigor Metodológico",
  },
  clarityScore: {
    pt: "3. Clareza e Qualidade do Texto",
    en: "3. Clarity and Text Quality",
    es: "3. Claridad y Calidad del Texto",
  },
  relevanceScore: {
    pt: "4. Relevância para a Trilha",
    en: "4. Track Relevance",
    es: "4. Relevancia para el Eje",
  },
  recommendationLabel: {
    pt: "Recomendação do Parecerista",
    en: "Reviewer Recommendation",
    es: "Recomendación del Evaluador",
  },
  commentsToAuthor: {
    pt: "Parecer Detalhado para os Autores",
    en: "Detailed Review for Authors",
    es: "Informe Detallado para los Autores",
  },
  commentsToEditorConfidential: {
    pt: "Comentários Confidenciais ao Editor (Opcional)",
    en: "Confidential Comments to the Editor (Optional)",
    es: "Comentarios Confidenciales al Editor (Opcional)",
  },

  // Author Dashboard
  authorDashboardTitle: {
    pt: "Minhas Submissões Acadêmicas",
    en: "My Academic Submissions",
    es: "Mis Envíos Académicos",
  },
  authorDashboardDesc: {
    pt: "Acompanhe o status editorial, pareceres de avaliação e decisões de todos os trabalhos submetidos.",
    en: "Track editorial status, peer reviews, and decisions for all submitted papers.",
    es: "Siga el estado editorial, evaluaciones y decisiones de todos los trabajos enviados.",
  },

  // Proceedings
  proceedingsTitle: {
    pt: "Anais e Publicações Científicas (Proceedings)",
    en: "Conference Proceedings & Publications",
    es: "Actas y Publicaciones Científicas (Proceedings)",
  },
  proceedingsDesc: {
    pt: "Consulte e baixe artigos completos aprovados pelo processo de avaliação por pares e apresentados nas conferências registradas no OCS.",
    en: "Browse and download full papers peer-reviewed and presented at OCS registered conferences.",
    es: "Consulte y descargue ponencias completas revisadas por pares y presentadas en las conferencias registradas en el OCS.",
  },
  searchPlaceholder: {
    pt: "Pesquisar por título, autor, resumo ou palavra-chave...",
    en: "Search by title, author, abstract, or keyword...",
    es: "Buscar por título, autor, resumen o palabra clave...",
  },
  howToCite: {
    pt: "Como Citar este Trabalho",
    en: "How to Cite this Paper",
    es: "Cómo Citar este Trabajo",
  },
  downloadPdf: {
    pt: "Baixar Artigo Completo (PDF)",
    en: "Download Full Paper (PDF)",
    es: "Descargar Ponencia Completa (PDF)",
  },
  cityOfProceedings: {
    pt: "Cidade Sede dos Anais",
    en: "Proceedings Host City",
    es: "Ciudad Sede de las Actas",
  },
  hostCity: {
    pt: "Cidade do Evento",
    en: "Host City",
    es: "Ciudad Sede",
  },
  articleDoi: {
    pt: "DOI do Artigo",
    en: "Article DOI",
    es: "DOI del Artículo",
  },
  proceedingsDoi: {
    pt: "DOI dos Anais",
    en: "Proceedings DOI",
    es: "DOI de las Actas",
  },
  detailsAndCitation: {
    pt: "Detalhes & Citação",
    en: "Details & Citation",
    es: "Detalles y Cita",
  },
  keywords: {
    pt: "Palavras-chave",
    en: "Keywords",
    es: "Palabras clave",
  },
  funding: {
    pt: "Financiamento da Pesquisa (Fomento)",
    en: "Research Funding & Grants",
    es: "Financiación de la Investigación (Fomento)",
  },
  creditTaxonomy: {
    pt: "Papel CRediT dos Autores (Taxonomia de Contribuição)",
    en: "CRediT Contributor Roles",
    es: "Roles de Contribución CRediT",
  },
  abntFormat: {
    pt: "Referência ABNT NBR 6023 (com indicação da cidade)",
    en: "ABNT Citation Format (with host city)",
    es: "Formato de Cita ABNT (con ciudad sede)",
  },
  apaFormat: {
    pt: "Referência APA 7th Edition",
    en: "APA 7th Edition Citation",
    es: "Formato de Cita APA 7ma Edición",
  },
  fullTextOpenAccess: {
    pt: "Texto Completo em Acesso Aberto (Open Access)",
    en: "Full-Text Open Access",
    es: "Texto Completo en Acceso Abierto",
  },
  licenseInfo: {
    pt: "Licenciado sob Creative Commons Attribution 4.0 International (CC BY 4.0)",
    en: "Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)",
    es: "Licenciado bajo Creative Commons Attribution 4.0 International (CC BY 4.0)",
  },
  noPapersFound: {
    pt: "Nenhum artigo encontrado para o termo pesquisado.",
    en: "No papers found for the search term.",
    es: "No se encontraron ponencias para el término buscado.",
  },
  indexedPapers: {
    pt: "artigos indexados",
    en: "indexed papers",
    es: "artículos indexados",
  },
  authors: {
    pt: "Autores",
    en: "Authors",
    es: "Autores",
  },
  abstract: {
    pt: "Resumo (Abstract)",
    en: "Abstract",
    es: "Resumen (Abstract)",
  },
  searchProceedings: {
    pt: "Buscar nos Anais",
    en: "Search Proceedings",
    es: "Buscar en las Actas",
  },

  // Modality & Schedule
  filterAllModalities: {
    pt: "Todas as Sessões",
    en: "All Sessions",
    es: "Todas las Sesiones",
  },
  filterPresential: {
    pt: "Presencial",
    en: "In-Person",
    es: "Presencial",
  },
  filterOnline: {
    pt: "Online / Remoto",
    en: "Online / Remote",
    es: "Online / Remoto",
  },
  badgePresential: {
    pt: "Apresentação Presencial",
    en: "In-Person Presentation",
    es: "Presentación Presencial",
  },
  badgeOnline: {
    pt: "Transmissão Online (Virtual)",
    en: "Online Broadcast (Virtual)",
    es: "Transmisión Online (Virtual)",
  },
  joinVirtualRoom: {
    pt: "Entrar na Sala Virtual",
    en: "Join Virtual Room",
    es: "Entrar a la Sala Virtual",
  },
  virtualMeetingUrl: {
    pt: "Link da Sessão Online",
    en: "Online Session Link",
    es: "Enlace de Sesión Online",
  },
  meetingInstructions: {
    pt: "Orientações para Autores & Ouvintes",
    en: "Instructions for Authors & Attendees",
    es: "Instrucciones para Autores y Asistentes",
  },
  physicalLocation: {
    pt: "Local Físico",
    en: "Physical Location",
    es: "Ubicación Física",
  },

  // Metadata Export & Interoperability
  openScienceInteroperability: {
    pt: "Interoperabilidade & Metadados Acadêmicos",
    en: "Interoperability & Academic Metadata",
    es: "Interoperabilidad y Metadatos Académicos",
  },
  exportCrossrefXml: {
    pt: "Depósito Crossref (XML)",
    en: "Crossref Deposit (XML)",
    es: "Depósito Crossref (XML)",
  },
  harvestOaiPmh: {
    pt: "Colheita OAI-PMH (Dublin Core)",
    en: "OAI-PMH Harvest (Dublin Core)",
    es: "Cosecha OAI-PMH (Dublin Core)",
  },
  exportPaperCrossref: {
    pt: "XML Crossref do Artigo",
    en: "Paper Crossref XML",
    es: "XML Crossref de la Ponencia",
  },
  exportPaperOaiDc: {
    pt: "OAI-PMH Dublin Core XML",
    en: "OAI-PMH Dublin Core XML",
    es: "OAI-PMH Dublin Core XML",
  },
  citedReferences: {
    pt: "Referências Bibliográficas Citadas",
    en: "Cited Bibliographic References",
    es: "Referencias Bibliográficas Citadas",
  },
  referenceNorm: {
    pt: "Norma das Referências",
    en: "Citation Style",
    es: "Norma de Citación",
  },
  copyAllReferences: {
    pt: "Copiar Todas as Referências",
    en: "Copy All References",
    es: "Copiar Todas las Referencias",
  },
  referencesAgentTitle: {
    pt: "Assistente de Higienização & Detecção de Estilo",
    en: "Assistant for Cleaning & Style Detection",
    es: "Asistente de Higienización y Detección de Estilo",
  },
};

interface LanguageContextType {
  lang: Locale;
  setLang: (lang: Locale) => void;
  t: (key: keyof typeof translations) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "pt",
  setLang: () => {},
  t: (key) => translations[key]?.pt || String(key),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Locale>("pt");

  useEffect(() => {
    const saved = localStorage.getItem("ocs_lang") as Locale | null;
    if (saved && (saved === "pt" || saved === "en" || saved === "es")) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Locale) => {
    setLangState(newLang);
    localStorage.setItem("ocs_lang", newLang);
  };

  const t = (key: keyof typeof translations): string => {
    const item = translations[key];
    if (!item) return String(key);
    return item[lang] || item.pt || String(key);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
