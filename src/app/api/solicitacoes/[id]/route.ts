export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq, sql } from "drizzle-orm";

// (opcional) manter o mesmo padrão de segurança das outras rotas
import { getTokenFromHeader } from "@/lib/getTokenFromHeader";
import { verificarToken } from "@/lib/auth";

type Params = { params: { id: string } };

export async function GET(req: Request, { params }: Params) {
  try {
    // 1) Autenticação básica (mantém padrão das outras rotas)
    const token = getTokenFromHeader(req);
    verificarToken(token);

    // 2) Validação do ID
    const idNum = Number(params.id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // 3) Cabeçalho da solicitação + consultora
    const cab = db
      .select({
        id:     schema.solicitacoes.id,
        status: schema.solicitacoes.status,
        criadoEm: schema.solicitacoes.criadoEm,
        consultoraCodigo: schema.consultoras.codigo,
        consultoraNome:   schema.consultoras.nome,
      })
      .from(schema.solicitacoes)
      .leftJoin(
        schema.consultoras,
        eq(schema.solicitacoes.consultoraId, schema.consultoras.id)
      )
      .where(eq(schema.solicitacoes.id, idNum))
      .get();

    if (!cab) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
    }

    // 4) Itens (produto + quantidade solicitada)
    const itens = db
      .select({
        itemId:     schema.solicitacaoItens.id,
        produtoId:  schema.produtos.id,
        sku:        schema.produtos.sku,
        nome:       schema.produtos.nome,
        quantidade: schema.solicitacaoItens.quantidade,
      })
      .from(schema.solicitacaoItens)
      .leftJoin(
        schema.produtos,
        eq(schema.solicitacaoItens.produtoId, schema.produtos.id)
      )
      .where(eq(schema.solicitacaoItens.solicitacaoId, idNum))
      .all();

    // 5) Reservas somadas por produto para essa solicitação
    const reservasPorProduto = db
      .select({
        produtoId: schema.reservas.produtoId,
        reservado: sql<number>`sum(${schema.reservas.quantidade})`,
      })
      .from(schema.reservas)
      .where(eq(schema.reservas.solicitacaoId, idNum))
      .groupBy(schema.reservas.produtoId)
      .all();

    const mapReservas = new Map<number, number>(
      reservasPorProduto.map(r => [r.produtoId, r.reservado ?? 0])
    );

   const itensComReserva = itens.map((it) => {
      const pid = Number(it.produtoId ?? 0); // garante number
      return {
        ...it,
        reservado: mapReservas.get(pid) ?? 0,
      };
    });

    // 6) Resposta final no formato que o front espera
    return NextResponse.json({
      id: cab.id,
      status: cab.status,
      criadoEm: cab.criadoEm,
      consultoraCodigo: cab.consultoraCodigo ?? null,
      consultoraNome:   cab.consultoraNome ?? null,
      itens: itensComReserva,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
