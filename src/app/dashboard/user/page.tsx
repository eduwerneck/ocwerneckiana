import { getSubmissionsForAuthor, getAssignmentsForReviewer, getUserById, getCertificatesForUser } from "@/lib/ocs-service";
import { requirePageAuth } from "@/lib/auth";
import UnifiedUserDashboardClient from "./UnifiedUserDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meu Painel (Autor & Avaliador) | Open Conference Werneckiana",
  description: "Painel unificado do usuário acadêmico: gestão de submissões de autoria, tarefas de avaliação por pares e emissão de declarações oficiais.",
};

export default async function UserUnifiedDashboardPage() {
  const sessionUser = await requirePageAuth(undefined, "/dashboard/user");
  const user = getUserById(sessionUser.id);
  const authorPapers = getSubmissionsForAuthor(sessionUser.id);
  const reviewerAssignments = getAssignmentsForReviewer(sessionUser.id);
  const certificates = getCertificatesForUser(sessionUser.id);

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
