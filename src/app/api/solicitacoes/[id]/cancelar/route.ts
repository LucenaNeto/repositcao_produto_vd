export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq, sql } from "drizzle-orm";
import { getTokenFromHeader } from "@/lib/getTokenFromHeader";
import { verificarPapel } from "@/lib/auth";

type Params = { id: string };

export async function PATCH(req: Request, { params }: { params: Params }) {
  try {
    // 1) Autorização: admin, estoque OU solicitante (MVP simples)
    const token = getTokenFromHeader(req);
    verificarPapel(token, ["admin", "estoque", "solicitante"]);

    // 2) Validação do ID
    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // 3) Transação SINCRONA (sem async/await dentro)
    db.transaction((tx) => {
      // 3.1) Cabeçalho
      const cab = tx
        .select()
        .from(schema.solicitacoes)
        .where(eq(schema.solicitacoes.id, id))
        .get();

      if (!cab) throw new Error("Solicitação não encontrada");
      if (cab.status !== "aberta") throw new Error("Apenas solicitações abertas podem ser canceladas");

      // 3.2) Itens da solicitação
      const itens = tx
        .select({
          produtoId: schema.solicitacaoItens.produtoId,
          quantidade: schema.solicitacaoItens.quantidade,
        })
        .from(schema.solicitacaoItens)
        .where(eq(schema.solicitacaoItens.solicitacaoId, id))
        .all();

      // 3.3) Libera reserva em estoque para cada item
      for (const it of itens) {
        // Garante que exista registro de estoque (defensivo)
        const row = tx
          .select()
          .from(schema.estoques)
          .where(eq(schema.estoques.produtoId, it.produtoId))
          .get();

        if (!row) {
          // se não existir, cria com zeros (para não quebrar)
          tx.insert(schema.estoques)
            .values({ produtoId: it.produtoId, quantidade: 0, reservado: 0 })
            .run();
        }

        // reservado -= quantidade (nunca negativo: opcional no MVP)
        tx.update(schema.estoques)
          .set({
            reservado: sql`${schema.estoques.reservado} - ${it.quantidade}`,
            atualizadoEm: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(schema.estoques.produtoId, it.produtoId))
          .run();
      }

      // 3.4) Remove as reservas dessa solicitação (liberação total)
      tx.delete(schema.reservas)
        .where(eq(schema.reservas.solicitacaoId, id))
        .run();

      // 3.5) Marca a solicitação como cancelada
      tx.update(schema.solicitacoes)
        .set({ status: "cancelada" })
        .where(eq(schema.solicitacoes.id, id))
        .run();
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const msg = err?.message || "Erro ao cancelar solicitação";
    const status = /não encontrada|Apenas solicitações abertas/.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
