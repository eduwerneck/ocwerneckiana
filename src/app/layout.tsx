import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/lib/i18n";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Open Conference Werneckiana (OCW)",
  description: "Plataforma acadêmica para gestão de conferências científicas, submissões estruturadas, avaliação por pares duplo-cega e publicação de anais.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();

  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans antialiased">
        <LanguageProvider>
          <Navbar sessionUser={sessionUser} />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
