// src/lib/auth.ts
import jwt from "jsonwebtoken";

type Papel = "admin" | "estoque" | "solicitante";

export type UsuarioJWT = {
  id: number;
  nome: string;
  email: string;
  papel: Papel;
  iat?: number;
  exp?: number;
};

// Em produção, sempre defina JWT_SECRET no .env.local
const RAW_SECRET = process.env.JWT_SECRET;
if (!RAW_SECRET) {
  console.warn("[auth] JWT_SECRET não definido — usando segredo temporário (apenas DEV).");
}
const SECRET = RAW_SECRET ?? "segredo_temporario";

/**
 * ✅ Verifica e decodifica o token JWT (síncrono)
 * - Lança "Token ausente" se não vier token
 * - Lança "Token inválido ou expirado" se o verify falhar
 */
export function verificarToken(token?: string): UsuarioJWT {
  if (!token) throw new Error("Token ausente");
  try {
    const payload = jwt.verify(token, SECRET);
    return payload as UsuarioJWT;
  } catch {
    throw new Error("Token inválido ou expirado");
  }
}

/**
 * ✅ Verifica se o usuário (via token) possui um dos papéis permitidos
 * - Retorna o payload do usuário se autorizado (útil para pegar id/nome/email)
 */
export function verificarPapel(token: string | undefined, papeisPermitidos: Papel[]) {
  const usuario = verificarToken(token);
  if (!papeisPermitidos.includes(usuario.papel)) {
    throw new Error("Acesso negado para este tipo de usuário");
  }
  return usuario;
}
