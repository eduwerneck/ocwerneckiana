import db from "../src/lib/db.ts";
import { hashPassword } from "../src/lib/password.ts";
import { revokeUserSessions } from "../src/lib/auth-core.ts";

/**
 * Script CLI de bootstrap/reset do administrador principal.
 * Uso:
 *   OCW_ADMIN_EMAIL=admin@inst.edu OCW_ADMIN_PASSWORD=SenhaForte123 npm run create-admin
 */
const email = (process.env.OCW_ADMIN_EMAIL || "").trim().toLowerCase();
const username = (process.env.OCW_ADMIN_USERNAME || email.split("@")[0] || "admin").trim().toLowerCase();
const fullName = (process.env.OCW_ADMIN_NAME || "Administrador Geral").trim();
const password = process.env.OCW_ADMIN_PASSWORD || "";

if (!email || !password || password.length < 8) {
  console.error("Uso: defina OCW_ADMIN_EMAIL e OCW_ADMIN_PASSWORD (mínimo 8 caracteres).");
  process.exit(1);
}

const passwordHash = hashPassword(password);
const existing = db.prepare("SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?").get(email, username) as { id: number } | undefined;

if (existing) {
  db.prepare("UPDATE users SET role = 'admin', password_hash = ?, full_name = ? WHERE id = ?").run(passwordHash, fullName, existing.id);
  revokeUserSessions(existing.id);
  console.log(`Administrador atualizado com sucesso (id=${existing.id}, email=${email}). Sessões anteriores revogadas.`);
} else {
  const res = db.prepare(`
    INSERT INTO users (username, email, full_name, affiliation, role, bio, password_hash)
    VALUES (?, ?, ?, 'Administração OCW', 'admin', 'Administrador do sistema', ?)
  `).run(username, email, fullName, passwordHash);
  console.log(`Administrador criado com sucesso (id=${res.lastInsertRowid}, email=${email}).`);
}
