// src/app/api/estoques/repor/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { entrada } from "@/server/db/estoque";
import { getRequestUser } from "@/lib/requestUser";

const ReporSchema = z.object({
  sku: z.string().min(1),
  qtd: z.number().int().positive(),
});

export async function POST(req: Request) {
  try {
    // 1) usuário e permissão
    const user = getRequestUser(req); // { id, nome, email, papel }
    if (!user || !["admin", "estoque"].includes(user.papel)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // 2) valida corpo
    const body = ReporSchema.parse(await req.json());

    // 3) busca produto pelo SKU
    const [prod] = await db
      .select({ id: schema.produtos.id })
      .from(schema.produtos)
      .where(eq(schema.produtos.sku, body.sku))
      .limit(1);

    if (!prod) {
      return NextResponse.json({ error: "SKU não encontrado" }, { status: 404 });
    }

    // 4) transação síncrona (NADA async dentro do callback)
    db.transaction((tx) => {
      entrada(tx, prod.id, body.qtd, undefined, user.nome);
    });

    // 5) resposta
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Erro ao repor" },
      { status: 400 }
    );
  }
}
