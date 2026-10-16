import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaperById, parseReferences } from "@/lib/ocs-service";
import PaperDetailClient from "./PaperDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const paper = getPaperById(Number(id));
  if (!paper) return {};

  const refs = parseReferences(paper.references_text);
  const otherMeta: Record<string, string | string[]> = {
    "citation_title": paper.title,
    "citation_publication_date": "2026/11/10",
    "citation_conference_title": paper.sched_title || "X CITECA 2026",
    "citation_fulltext_html_url": `http://localhost:3000/paper/${paper.id}`,
    "DC.title": paper.title,
    "DC.type": "Conference Proceedings Paper",
    "DC.rights": "info:eu-repo/semantics/openAccess",
  };

  if (paper.doi) {
    otherMeta["citation_doi"] = paper.doi;
    otherMeta["DC.identifier"] = `https://doi.org/${paper.doi}`;
  }

  if (paper.isbn) {
    otherMeta["citation_isbn"] = paper.isbn;
    otherMeta["DC.source"] = `ISBN: ${paper.isbn}`;
  }

  if (paper.authors && paper.authors.length > 0) {
    otherMeta["citation_author"] = paper.authors.map((a) => a.full_name);
  }

  // Tags para indexação de referências no Google Scholar
  if (refs.length > 0) {
    otherMeta["citation_reference"] = refs.map((r) => r.raw);
  }

  return {
    title: `${paper.title} | Anais do ${paper.sched_title || "OCS"}`,
    description: paper.abstract,
    other: otherMeta,
  };
}

export default async function PaperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paper = getPaperById(Number(id));

  if (!paper) {
    notFound();
  }

  return <PaperDetailClient paper={paper} />;
}
