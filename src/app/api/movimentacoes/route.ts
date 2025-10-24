// src/app/api/movimentacoes/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { verificarPapel } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // 1) Autenticação + papel (somente admin/estoque)
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;

    verificarPapel(token, ["admin", "estoque"]);

    // 2) Filtros opcionais
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");            // "entrada" | "saida"
    const sku = searchParams.get("sku");              // ex.: "SKU-1001"
    const dataInicio = searchParams.get("dataInicio"); // "YYYY-MM-DD"
    const dataFim = searchParams.get("dataFim");       // "YYYY-MM-DD"

    const conditions = [];

    if (tipo === "entrada" || tipo === "saida") {
      conditions.push(eq(schema.movimentacoesEstoque.tipo, tipo));
    }
    if (sku) {
      // precisa do join com produtos
      conditions.push(eq(schema.produtos.sku, sku));
    }
    // criado_em é TEXT com CURRENT_TIMESTAMP => comparação lexicográfica funciona
    if (dataInicio) {
      conditions.push(
        gte(schema.movimentacoesEstoque.criadoEm, `${dataInicio} 00:00:00`)
      );
    }
    if (dataFim) {
      conditions.push(
        lte(schema.movimentacoesEstoque.criadoEm, `${dataFim} 23:59:59`)
      );
    }

    // 3) Consulta
    const rows = await db
      .select({
        id: schema.movimentacoesEstoque.id,
        criadoEm: schema.movimentacoesEstoque.criadoEm,
        tipo: schema.movimentacoesEstoque.tipo,
        quantidade: schema.movimentacoesEstoque.quantidade,
        solicitacaoId: schema.movimentacoesEstoque.solicitacaoId,
        produto: schema.produtos.nome,
        sku: schema.produtos.sku,
      })
      .from(schema.movimentacoesEstoque)
      .leftJoin(
        schema.produtos,
        eq(schema.movimentacoesEstoque.produtoId, schema.produtos.id)
      )
      .where(conditions.length ? and(...conditions) : undefined)
      .all();

    return NextResponse.json(rows);
  } catch (err: any) {
    const msg = err?.message ?? "Erro ao listar movimentações";
    const status = /Token|Acesso|papel|perm/i.test(msg) ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
