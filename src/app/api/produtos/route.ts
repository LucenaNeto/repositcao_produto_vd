import { db, schema } from "@/server/db";
import { like } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const ProdutoSchema = z.object({
  sku: z.string().min(1),
  nome: z.string().min(1),
  unidade: z.string().min(1),
});

// GET /api/produtos?q=nome
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    const rows = q
      ? await db
          .select()
          .from(schema.produtos)
          .where(like(schema.produtos.nome, `%${q}%`))
      : await db.select().from(schema.produtos);

    return Response.json(rows);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}

// POST /api/produtos
export async function POST(req: Request) {
  try {
    const data = ProdutoSchema.parse(await req.json());
    const [row] = await db.insert(schema.produtos).values(data).returning();
    return Response.json(row, { status: 201 });
  } catch (err) {
    let msg = err instanceof Error ? err.message : String(err);

    // Trata erro de UNIQUE constraint (SKU duplicado)
    if (msg.includes("UNIQUE constraint failed")) {
      msg = "Já existe um produto com esse SKU.";
    }

    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
}
