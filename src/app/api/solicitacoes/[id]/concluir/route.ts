import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const solicitacaoId = Number(params.id);
  if (isNaN(solicitacaoId))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    // 1️⃣ Busca a solicitação
    const [solicitacao] = await db
      .select()
      .from(schema.solicitacoes)
      .where(eq(schema.solicitacoes.id, solicitacaoId));

    if (!solicitacao)
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });

    if (solicitacao.status === "concluida") {
      return NextResponse.json({ error: "Solicitação já está concluída" }, { status: 400 });
    }

    // 2️⃣ Busca todas as reservas da solicitação
    const reservas = await db
      .select()
      .from(schema.reservas)
      .where(eq(schema.reservas.solicitacaoId, solicitacaoId));

    if (reservas.length === 0)
      return NextResponse.json(
        { error: "Nenhuma reserva encontrada para essa solicitação" },
        { status: 400 }
      );

    // 3️⃣ Transação: aplica todas as saídas de estoque
    await db.transaction(async (tx) => {
      for (const r of reservas) {
        // Busca o estoque do produto
        const [estoque] = await tx
          .select()
          .from(schema.estoques)
          .where(eq(schema.estoques.produtoId, r.produtoId));

        if (!estoque) {
          throw new Error(`Produto ${r.produtoId} sem estoque registrado`);
        }

        const novaQtd = estoque.quantidade - r.quantidade;
        const novoReservado = estoque.reservado - r.quantidade;

        if (novaQtd < 0 || novoReservado < 0) {
          throw new Error(`Saldo insuficiente no produto ${r.produtoId}`);
        }

        // Atualiza o estoque (baixa e libera reserva)
        await tx
          .update(schema.estoques)
          .set({
            quantidade: novaQtd,
            reservado: novoReservado,
          })
          .where(eq(schema.estoques.produtoId, r.produtoId));

        // Registra a movimentação
        await tx.insert(schema.movimentacoesEstoque).values({
          produtoId: r.produtoId,
          tipo: "saida",
          quantidade: r.quantidade,
          solicitacaoId,
        });
      }

      // Atualiza o status da solicitação
      await tx
        .update(schema.solicitacoes)
        .set({ status: "concluida" })
        .where(eq(schema.solicitacoes.id, solicitacaoId));
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
