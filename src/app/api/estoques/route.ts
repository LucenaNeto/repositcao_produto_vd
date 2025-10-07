export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = db
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
    .all()
    .map((r) => ({
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
}
