import LoginClient from "./LoginClient";
import { sanitizeNextPath } from "@/lib/security";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Entrar no Sistema (Login) | Open Conference Werneckiana",
  description: "Autenticação de autores, avaliadores e editores no Open Conference Werneckiana.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const resolved = await searchParams;
  const nextPath = resolved?.next ? sanitizeNextPath(resolved.next, "") : "";
  const oauthError = resolved?.error || "";
  const demoMode = process.env.OCW_DEMO_MODE === "true";
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const orcidEnabled = Boolean(process.env.ORCID_CLIENT_ID && process.env.ORCID_CLIENT_SECRET);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <LoginClient
        demoMode={demoMode}
        nextPath={nextPath}
        googleEnabled={googleEnabled}
        orcidEnabled={orcidEnabled}
        oauthError={oauthError}
      />
    </div>
  );
}
