import { db, schema } from "@/server/db";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

// POST /api/estoques/:id/saida
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { quantidade } = await req.json();
    const id = Number(params.id);

    if (isNaN(id)) return new Response("ID inválido", { status: 400 });
    if (!quantidade || quantidade <= 0)
      return new Response("Quantidade deve ser > 0", { status: 400 });

    // Busca estoque atual
    const [estoqueAtual] = await db
      .select()
      .from(schema.estoques)
      .where(eq(schema.estoques.id, id));

    if (!estoqueAtual)
      return new Response("Estoque não encontrado", { status: 404 });

    if (estoqueAtual.quantidade - estoqueAtual.reservado < quantidade) {
      return new Response("Estoque insuficiente", { status: 400 });
    }

    const novaQuantidade = estoqueAtual.quantidade - quantidade;

    // Atualiza saldo e timestamp
    const [row] = await db
      .update(schema.estoques)
      .set({
        quantidade: novaQuantidade,
        atualizadoEm: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(schema.estoques.id, id))
      .returning();

    // Cria movimentação
    await db.insert(schema.movimentacoesEstoque).values({
      produtoId: estoqueAtual.produtoId,
      tipo: "saida",
      quantidade,
    });

    return Response.json(row);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
}
