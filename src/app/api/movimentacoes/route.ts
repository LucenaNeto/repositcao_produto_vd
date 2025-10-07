import { db, schema } from "@/server/db";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: schema.movimentacoesEstoque.id,
        criadoEm: schema.movimentacoesEstoque.criadoEm,
        tipo: schema.movimentacoesEstoque.tipo,
        quantidade: schema.movimentacoesEstoque.quantidade,
        solicitacaoId: schema.movimentacoesEstoque.solicitacaoId,
        produto: schema.produtos.nome, // <-- nome do produto
      })
      .from(schema.movimentacoesEstoque)
      .leftJoin(
        schema.produtos,
        eq(schema.movimentacoesEstoque.produtoId, schema.produtos.id)
      )
      .orderBy(desc(schema.movimentacoesEstoque.id));

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao listar movimentações" },
      { status: 500 }
    );
  }
}
