import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// Validação dos dados de entrada
const ReservaSchema = z.object({
  solicitacaoId: z.number(),
  produtoId: z.number(),
  quantidade: z.number().min(1),
});

// 🔹 Criar reserva
export async function POST(req: Request) {
  try {
    const data = ReservaSchema.parse(await req.json());
    const { solicitacaoId, produtoId, quantidade } = data;

    // 1️⃣ Verifica se a solicitação existe e está aberta
    const [solicitacao] = await db
      .select()
      .from(schema.solicitacoes)
      .where(eq(schema.solicitacoes.id, solicitacaoId));

    if (!solicitacao) {
      return NextResponse.json(
        { error: "Solicitação não encontrada" },
        { status: 404 }
      );
    }

    if (solicitacao.status !== "aberta") {
      return NextResponse.json(
        { error: "Não é possível criar reserva para solicitação concluída" },
        { status: 400 }
      );
    }

    // 2️⃣ Verifica estoque disponível
    const [estoque] = await db
      .select()
      .from(schema.estoques)
      .where(eq(schema.estoques.produtoId, produtoId));

    if (!estoque) {
      return NextResponse.json(
        { error: "Produto sem registro de estoque" },
        { status: 400 }
      );
    }

    const disponivel = estoque.quantidade - estoque.reservado;
    if (quantidade > disponivel) {
      return NextResponse.json(
        {
          error: `Quantidade indisponível para reserva. Saldo atual: ${disponivel}`,
        },
        { status: 400 }
      );
    }

    // 3️⃣ Executa a transação (sem retornar Promise)
    await db.transaction(async (tx) => {
      // Cria a reserva
      await tx.insert(schema.reservas).values({
        solicitacaoId,
        produtoId,
        quantidade,
      });

      // Atualiza estoque (reserva)
      await tx
        .update(schema.estoques)
        .set({
          reservado: estoque.reservado + quantidade,
        })
        .where(eq(schema.estoques.produtoId, produtoId));

      return; // 👈 evita erro "Transaction function cannot return a promise"
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// 🔹 Listar reservas
export async function GET() {
  try {
    const rows = await db.select().from(schema.reservas);
    return NextResponse.json(rows);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
