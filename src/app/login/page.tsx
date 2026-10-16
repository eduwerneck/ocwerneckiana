import LoginClient from "./LoginClient";

export const metadata = {
  title: "Entrar no Sistema (Login) | Open Conference Werneckiana",
  description: "Autenticação de usuários, autores, avaliadores e editores via ORCID, Google ou credenciais institucionais.",
};

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <LoginClient />
    </div>
  );
}
