import Link from "next/link";
import { getSubmissionsForAuthor, getAssignmentsForReviewer, getUserById, getCertificatesForUser } from "@/lib/ocs-service";
import UnifiedUserDashboardClient from "./UnifiedUserDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meu Painel (Autor & Avaliador) | Open Conference Werneckiana",
  description: "Painel unificado do usuário acadêmico: gestão de submissões de autoria, tarefas de avaliação por pares e emissão de declarações oficiais.",
};

export default function UserUnifiedDashboardPage() {
  const user = getUserById(6); // Dr. Lucas Martins
  const authorPapers = getSubmissionsForAuthor(6);
  // Combinar avaliações para demonstração completa das abas
  const reviewerAssignments = getAssignmentsForReviewer(6).length > 0 
    ? getAssignmentsForReviewer(6) 
    : getAssignmentsForReviewer(3);
  const certificates = getCertificatesForUser(6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <UnifiedUserDashboardClient 
        user={user}
        authorPapers={authorPapers} 
        reviewerAssignments={reviewerAssignments} 
        certificates={certificates}
      />
    </div>
  );
}
