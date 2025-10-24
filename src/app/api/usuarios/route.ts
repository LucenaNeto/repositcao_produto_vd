import { db, schema } from "@/server/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ✅ Método GET - Retorna todos os usuários
export async function GET() {
  try {
    const usuarios = await db.select().from(schema.usuarios);
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json({ error: "Erro ao carregar usuários" }, { status: 500 });
  }
}
