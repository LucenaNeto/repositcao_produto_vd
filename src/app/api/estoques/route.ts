// src/app/api/estoques/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { verificarPapel } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // 1) Autenticação + papel
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;

    // Somente admin/estoque podem ver estoques
    verificarPapel(token, ["admin", "estoque"]);

    // 2) Consulta
    const results = await db
      .select({
        produtoId: schema.produtos.id,
        sku: schema.produtos.sku,
        nome: schema.produtos.nome,
        estoqueId: schema.estoques.id,
        quantidade: schema.estoques.quantidade,
        reservado: schema.estoques.reservado,
        atualizadoEm: schema.estoques.atualizadoEm,
      })
      .from(schema.produtos)
      .leftJoin(
        schema.estoques,
        eq(schema.estoques.produtoId, schema.produtos.id)
      )
      .all();

    // 3) Normalização do payload
    const rows = results.map((r) => ({
      produtoId: r.produtoId,
      sku: r.sku,
      nome: r.nome,
      estoqueId: r.estoqueId ?? null,
      quantidade: r.quantidade ?? 0,
      reservado: r.reservado ?? 0,
      disponivel: (r.quantidade ?? 0) - (r.reservado ?? 0),
      atualizadoEm: r.atualizadoEm ?? null,
    }));

    return NextResponse.json(rows);
  } catch (err: any) {
    const msg = err?.message ?? "Erro ao listar estoques";
    const status = /Token|Acesso|papel|perm/i.test(msg) ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
