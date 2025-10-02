// src/app/api/consultoras/[id]/route.ts
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const ConsultoraUpdateSchema = z.object({
  codigo: z.string().min(1).optional(),
  nome: z.string().min(1).optional(),
});

// PATCH /api/consultoras/:id
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return new Response("ID inválido", { status: 400 });

    const payload = ConsultoraUpdateSchema.parse(await req.json());

    const [row] = await db
      .update(schema.consultoras)
      .set(payload)
      .where(eq(schema.consultoras.id, id))
      .returning();

    if (!row) return new Response("Consultora não encontrada", { status: 404 });

    return Response.json(row);
  } catch (err) {
    let msg = err instanceof Error ? err.message : String(err);

    // Trata erro de UNIQUE constraint (código duplicado)
    if (msg.includes("UNIQUE constraint failed")) {
      msg = "Já existe uma consultora com esse código.";
    }

    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
}


// DELETE /api/consultoras/:id
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return new Response("ID inválido", { status: 400 });

    const [row] = await db
      .delete(schema.consultoras)
      .where(eq(schema.consultoras.id, id))
      .returning();

    if (!row) return new Response("Consultora não encontrada", { status: 404 });

    return Response.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
}
