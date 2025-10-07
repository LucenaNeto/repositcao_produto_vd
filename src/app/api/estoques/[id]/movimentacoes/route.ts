import { db, schema } from "@/server/db";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/estoques/:id/movimentacoes
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const produtoId = Number(params.id);

    if (isNaN(produtoId)) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    const rows = await db
      .select({
        id: schema.movimentacoesEstoque.id,
        tipo: schema.movimentacoesEstoque.tipo,
        quantidade: schema.movimentacoesEstoque.quantidade,
        solicitacaoId: schema.movimentacoesEstoque.solicitacaoId,
        criadoEm: schema.movimentacoesEstoque.criadoEm,
      })
      .from(schema.movimentacoesEstoque)
      .where(eq(schema.movimentacoesEstoque.produtoId, produtoId))
      .orderBy(desc(schema.movimentacoesEstoque.criadoEm));

    return Response.json(rows);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
