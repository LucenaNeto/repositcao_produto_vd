export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { getRequestUser } from "@/lib/requestUser";
import type { RequestUser } from "@/lib/requestUser";
import { saida, liberarReservasPorSolicitacao } from "@/server/db/estoque";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    // 1) usuário (tipado) e permissão
    const user = getRequestUser(req) as RequestUser;
    if (!["admin", "estoque"].includes(user.papel)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // 2) valida ID
    const solicitacaoId = Number(params.id);
    if (!Number.isFinite(solicitacaoId) || solicitacaoId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // 3) carrega cabeçalho + itens
    const cab = db
      .select()
      .from(schema.solicitacoes)
      .where(eq(schema.solicitacoes.id, solicitacaoId))
      .get();

    if (!cab) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
    }
    if (cab.status !== "aberta") {
      return NextResponse.json({ error: "Somente solicitações 'aberta' podem ser concluídas" }, { status: 400 });
    }

    const itens = db
      .select({
        itemId: schema.solicitacaoItens.id,
        produtoId: schema.solicitacaoItens.produtoId,
        quantidade: schema.solicitacaoItens.quantidade,
      })
      .from(schema.solicitacaoItens)
      .where(eq(schema.solicitacaoItens.solicitacaoId, solicitacaoId))
      .all();

    // 4) transação síncrona (NADA async aqui dentro)
    db.transaction((tx) => {
  for (const it of itens) {
    // baixa do estoque
    saida(tx, it.produtoId, it.quantidade, solicitacaoId, user?.nome ?? "Sistema");
  }

      // libera as reservas da própria solicitação
      // ⚠️ ordem correta: (tx, solicitacaoId)
      liberarReservasPorSolicitacao(tx, solicitacaoId);

      // marca o cabeçalho como finalizado
      tx
        .update(schema.solicitacoes)
        .set({ status: "finalizada" })
        .where(eq(schema.solicitacoes.id, solicitacaoId))
        .run();
    });

    return NextResponse.json({ ok: true, solicitacaoId, por: user.nome });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Falha ao concluir solicitação" },
      { status: 400 }
    );
  }
}
