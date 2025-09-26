export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";

// GET /api/solicitacoes/:id  -> cabeçalho + itens
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const header = db
    .select({
      id: schema.solicitacoes.id,
      status: schema.solicitacoes.status,
      criadoEm: schema.solicitacoes.criadoEm,
      consultoraNome: schema.consultoras.nome,
      consultoraCodigo: schema.consultoras.codigo,
    })
    .from(schema.solicitacoes)
    .leftJoin(
      schema.consultoras,
      eq(schema.solicitacoes.consultoraId, schema.consultoras.id)
    )
    .where(eq(schema.solicitacoes.id, id))
    .get();

  if (!header) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const itens = db
    .select({
      id: schema.solicitacaoItens.id,
      quantidade: schema.solicitacaoItens.quantidade,
      produtoNome: schema.produtos.nome,
      produtoSku: schema.produtos.sku,
    })
    .from(schema.solicitacaoItens)
    .leftJoin(
      schema.produtos,
      eq(schema.solicitacaoItens.produtoId, schema.produtos.id)
    )
    .where(eq(schema.solicitacaoItens.solicitacaoId, id))
    .all();

  return NextResponse.json({ header, itens });
}
