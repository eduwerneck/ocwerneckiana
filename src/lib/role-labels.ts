export function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "manager" || role === "director";
}

export function formatRoleLabel(role?: string | null): string {
  switch (role) {
    case "admin":
    case "manager":
    case "director":
      return "Coordenador";
    case "reviewer":
      return "Avaliador";
    case "author":
      return "Autor";
    case "reader":
      return "Leitor";
    default:
      return "Usuário";
  }
}

export function getRoleBadgeClasses(role?: string | null): string {
  if (isAdminRole(role)) {
    return "bg-purple-100 text-purple-800 border-purple-200";
  }
  if (role === "reviewer") {
    return "bg-indigo-100 text-indigo-800 border-indigo-200";
  }
  return "bg-blue-100 text-blue-800 border-blue-200";
}
