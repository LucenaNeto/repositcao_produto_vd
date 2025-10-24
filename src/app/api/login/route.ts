// src/app/api/login/route.ts
export const runtime = "nodejs";

import { db, schema } from "@/server/db";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { z } from "zod";
import { SignJWT } from "jose";
import { TextEncoder } from "util";

const LoginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(4),
});

// Gera JWT com jose
async function gerarTokenJWT(payload: Record<string, any>) {
  const secretStr = process.env.JWT_SECRET;
  if (!secretStr) throw new Error("JWT_SECRET ausente no .env");
  const secret = new TextEncoder().encode(secretStr);
  const exp = process.env.JWT_EXPIRES_IN || "2h";

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(exp)   // "2h" funciona no jose
    .sign(secret);
}

export async function POST(req: Request) {
  try {
    const data = LoginSchema.parse(await req.json());

    // ⚠️ EXECUTA a query e retorna 1 registro
    const usuario =
      db
        .select()
        .from(schema.usuarios)
        .where(eq(schema.usuarios.email, data.email))
        .get(); // <- aqui é a chave

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const senhaCorreta = await compare(data.senha, usuario.senha);
    if (!senhaCorreta) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    const token = await gerarTokenJWT({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
    });

    return NextResponse.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
      },
    });
  } catch (err) {
    console.error("❌ Erro no login:", err);
    const msg = err instanceof Error ? err.message : String(err);
    // Se for segredo ausente, melhor 500
    const status = msg.includes("JWT_SECRET") ? 500 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
