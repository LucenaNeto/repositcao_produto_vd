import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const InitSchema = z.object({
  produtoId: z.number().int(),
  quantidade: z.number().int().nonnegative().default(0),
});

// POST /api/estoques/init
export async function POST(req: Request) {
  try {
    const body = InitSchema.parse(await req.json());
    const { produtoId, quantidade } = body;

    // Verifica se produto existe
    const [produto] = await db
      .select()
      .from(schema.produtos)
      .where(eq(schema.produtos.id, produtoId));

    if (!produto) {
      return new Response(JSON.stringify({ error: "Produto não encontrado" }), {
        status: 404,
      });
    }

    // Verifica se já existe estoque para esse produto
    const [existente] = await db
      .select()
      .from(schema.estoques)
      .where(eq(schema.estoques.produtoId, produtoId));

    if (existente) {
      return new Response(
        JSON.stringify({ error: "Estoque já inicializado para este produto" }),
        { status: 400 }
      );
    }

    // Cria estoque inicial
    const [row] = await db
      .insert(schema.estoques)
      .values({
        produtoId,
        quantidade,
        reservado: 0,
      })
      .returning();

    return new Response(JSON.stringify(row), { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
}
