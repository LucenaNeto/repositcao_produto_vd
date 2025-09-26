export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { reservar, saida, liberarReservasPorSolicitacao } from "@/server/db/estoque";

const ALLOWED = new Set(["aberta", "separacao", "concluida", "cancelada"]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({} as any));
  const next = String(body?.status || "");
  if (!ALLOWED.has(next)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const current = db
    .select({ s: schema.solicitacoes.status })
    .from(schema.solicitacoes)
    .where(eq(schema.solicitacoes.id, id))
    .get();

  if (!current) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  const can = (from: string, to: string) => {
    if (from === "aberta") return to === "separacao" || to === "cancelada";
    if (from === "separacao") return to === "concluida" || to === "cancelada";
    return false;
  };

  if ((current.s === "concluida" || current.s === "cancelada") || !can(current.s, next)) {
    return NextResponse.json({ error: `Transição não permitida: ${current.s} -> ${next}` }, { status: 400 });
  }

  // itens da solicitação
  const itens = db
    .select({
      produtoId: schema.solicitacaoItens.produtoId,
      quantidade: schema.solicitacaoItens.quantidade,
    })
    .from(schema.solicitacaoItens)
    .where(eq(schema.solicitacaoItens.solicitacaoId, id))
    .all();

  try {
    db.transaction((tx) => {
      if (next === "separacao") {
        // cria reservas
        for (const it of itens) {
          reservar(it.produtoId, it.quantidade, id, tx);
        }
        tx.update(schema.solicitacoes)
          .set({ status: "separacao" })
          .where(eq(schema.solicitacoes.id, id))
          .run();
        return;
      }

      if (next === "concluida") {
        // baixa estoque e consome reservas
        for (const it of itens) {
          saida(it.produtoId, it.quantidade, id, tx);
        }
        // remove reservas (reduz 'reservado')
        liberarReservasPorSolicitacao(id, tx);

        tx.update(schema.solicitacoes)
          .set({ status: "concluida" })
          .where(eq(schema.solicitacoes.id, id))
          .run();
        return;
      }

      if (next === "cancelada") {
        // se estava em separação, precisa devolver reservas
        if (current.s === "separacao") {
          liberarReservasPorSolicitacao(id, tx);
        }
        tx.update(schema.solicitacoes)
          .set({ status: "cancelada" })
          .where(eq(schema.solicitacoes.id, id))
          .run();
        return;
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha na mudança de status" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id, from: current.s, to: next });
}
