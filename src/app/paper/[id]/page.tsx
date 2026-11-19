import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaperForAuthor, getPaperForDirector, getPaperForPublic, parseReferences } from "@/lib/ocs-service";
import { ADMIN_ROLES, getSessionUser } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/security";
import { parsePositiveInt } from "@/lib/validation";
import PaperDetailClient from "./PaperDetailClient";

export const dynamic = "force-dynamic";

async function resolveVisiblePaper(rawId: string) {
  const numericId = parsePositiveInt(rawId);
  const key = numericId ?? rawId;

  const publicPaper = getPaperForPublic(key);
  if (publicPaper) return publicPaper;

  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  if (ADMIN_ROLES.includes(sessionUser.role)) {
    return getPaperForDirector(key);
  }
  if (numericId) {
    return getPaperForAuthor(numericId, sessionUser.id);
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const paper = await resolveVisiblePaper(id);
  if (!paper) return {};

  const baseUrl = getAppBaseUrl();
  const refs = parseReferences(paper.references_text);
  const pubDate = (paper.date_decided || paper.date_submitted || "").slice(0, 10).replace(/-/g, "/");

  const otherMeta: Record<string, string | string[]> = {
    "citation_title": paper.title,
    "citation_publication_date": pubDate || String(new Date().getFullYear()),
    "citation_conference_title": paper.sched_title || "Open Conference Werneckiana",
    "citation_fulltext_html_url": `${baseUrl}/paper/${paper.id}`,
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

  if (refs.length > 0) {
    otherMeta["citation_reference"] = refs.map((r) => r.raw);
  }

  return {
    title: `${paper.title} | Anais do ${paper.sched_title || "OCW"}`,
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
  const paper = await resolveVisiblePaper(id);

  if (!paper) {
    notFound();
  }

  return <PaperDetailClient paper={paper} />;
}
