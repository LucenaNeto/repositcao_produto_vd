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
      quantidade: schema.estoques.quantidade,
      reservado: schema.estoques.reservado,
    })
    .from(schema.produtos)
    .leftJoin(
      schema.estoques,
      eq(schema.estoques.produtoId, schema.produtos.id)
    )
    .all()
    .map((r) => ({
      ...r,
      quantidade: r.quantidade ?? 0,
      reservado: r.reservado ?? 0,
      disponivel: (r.quantidade ?? 0) - (r.reservado ?? 0),
    }));

  return NextResponse.json(rows);
}
