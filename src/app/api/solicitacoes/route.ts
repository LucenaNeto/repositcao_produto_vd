export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq, inArray, sql } from "drizzle-orm";
import { NovaSolicitacaoSchema } from "@/lib/schemas";

// POST /api/solicitacoes -> cria uma solicitação (cabeçalho + itens)
export async function POST(req: Request) {
  const json = await req.json();
  const parsed = NovaSolicitacaoSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { consultoraCodigo, itens } = parsed.data;

  // valida consultora
  const consultora = db
    .select()
    .from(schema.consultoras)
    .where(eq(schema.consultoras.codigo, consultoraCodigo))
    .get();

  if (!consultora) {
    return NextResponse.json({ error: "Consultora não encontrada" }, { status: 404 });
  }

  // valida produtos por SKU
  const skus = itens.map((i) => i.sku);
  const prods = db
    .select()
    .from(schema.produtos)
    .where(inArray(schema.produtos.sku, skus))
    .all();

  if (prods.length !== skus.length) {
    return NextResponse.json({ error: "Algum SKU não existe" }, { status: 400 });
  }

  const map = new Map(prods.map((p) => [p.sku, p]));

  // transação: cria cabeçalho + itens
  const solicitacaoId = db.transaction((tx) => {
    const res = tx
      .insert(schema.solicitacoes)
      .values({ consultoraId: consultora.id, status: "aberta" })
      .run();

    const newId = Number(res.lastInsertRowid);

    tx.insert(schema.solicitacaoItens)
      .values(
        itens.map((i) => ({
          solicitacaoId: newId,
          produtoId: map.get(i.sku)!.id,
          quantidade: i.qtd,
        }))
      )
      .run();

    return newId;
  });

  return NextResponse.json({ ok: true, solicitacaoId }, { status: 201 });
}

// GET /api/solicitacoes -> lista resumida
export async function GET() {
  const rows = db
    .select({
      id: schema.solicitacoes.id,
      criadoEm: schema.solicitacoes.criadoEm,
      status: schema.solicitacoes.status,
      consultora: schema.consultoras.nome,
      itens: sql<number>`count(${schema.solicitacaoItens.id})`,
    })
    .from(schema.solicitacoes)
    .leftJoin(
      schema.consultoras,
      eq(schema.solicitacoes.consultoraId, schema.consultoras.id)
    )
    .leftJoin(
      schema.solicitacaoItens,
      eq(schema.solicitacoes.id, schema.solicitacaoItens.solicitacaoId)
    )
    .groupBy(
      schema.solicitacoes.id,
      schema.solicitacoes.criadoEm,
      schema.solicitacoes.status,
      schema.consultoras.nome
    )
    .all();

  return NextResponse.json(rows);
}
