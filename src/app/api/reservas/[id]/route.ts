import { db, schema } from "@/server/db";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

// DELETE /api/reservas/:id
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    // Busca reserva existente
    const [reserva] = await db
      .select()
      .from(schema.reservas)
      .where(eq(schema.reservas.id, id));

    if (!reserva) {
      return new Response(
        JSON.stringify({ error: "Reserva não encontrada" }),
        { status: 404 }
      );
    }

    // Transação: remove reserva e atualiza estoque
    await db.transaction(async (tx) => {
      // Remove reserva
      await tx.delete(schema.reservas).where(eq(schema.reservas.id, id));

      // Atualiza estoque (reduz reservado)
      await tx
        .update(schema.estoques)
        .set({
          reservado: sql`${schema.estoques.reservado} - ${reserva.quantidade}`,
          atualizadoEm: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(schema.estoques.produtoId, reserva.produtoId));
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
}
