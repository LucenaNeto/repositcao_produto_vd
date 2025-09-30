import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const ProdutoUpdateSchema = z.object({
  sku: z.string().min(1).optional(),
  nome: z.string().min(1).optional(),
  unidade: z.string().min(1).optional(),
});

// PATCH /api/produtos/:id
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return new Response("ID inválido", { status: 400 });

    const data = ProdutoUpdateSchema.parse(await req.json());

    const [row] = await db
      .update(schema.produtos)
      .set(data)
      .where(eq(schema.produtos.id, id))
      .returning();

    if (!row) return new Response("Produto não encontrado", { status: 404 });

    return Response.json(row);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
}

// DELETE /api/produtos/:id
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return new Response("ID inválido", { status: 400 });

    const [row] = await db
      .delete(schema.produtos)
      .where(eq(schema.produtos.id, id))
      .returning();

    if (!row) return new Response("Produto não encontrado", { status: 404 });

    return Response.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
}
