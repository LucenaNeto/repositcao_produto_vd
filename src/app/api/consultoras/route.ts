// src/app/api/consultoras/route.ts
import { db, schema } from "@/server/db";
import { like, or } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // necessário quando a rota usa better-sqlite3 (drizzle)

const ConsultoraCreateSchema = z.object({
  codigo: z.string().min(1),
  nome: z.string().min(1),
});

// GET /api/consultoras?q=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    const rows = q
      ? await db
          .select()
          .from(schema.consultoras)
          .where(
            or(
              like(schema.consultoras.nome, `%${q}%`),
              like(schema.consultoras.codigo, `%${q}%`)
            )
          )
      : await db.select().from(schema.consultoras);

    return Response.json(rows);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}

// POST /api/consultoras
export async function POST(req: Request) {
  try {
    const payload = ConsultoraCreateSchema.parse(await req.json());
    const [row] = await db.insert(schema.consultoras).values(payload).returning();
    return Response.json(row, { status: 201 });
  } catch (err) {
    let msg = err instanceof Error ? err.message : String(err);

    // Trata erro de UNIQUE constraint
    if (msg.includes("UNIQUE constraint failed")) {
      msg = "Já existe uma consultora com esse código.";
    }

    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
}


