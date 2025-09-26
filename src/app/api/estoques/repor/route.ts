export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { entrada } from "@/server/db/estoque";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.sku || !(Number(body.qtd) > 0)) {
    return NextResponse.json(
      { error: "Informe { sku, qtd > 0 }" },
      { status: 400 }
    );
  }

  const prod = db
    .select()
    .from(schema.produtos)
    .where(eq(schema.produtos.sku, String(body.sku)))
    .get();

  if (!prod) {
    return NextResponse.json(
      { error: "Produto não encontrado" },
      { status: 404 }
    );
  }

  db.transaction((tx) => entrada(prod.id, Number(body.qtd), tx));

  return NextResponse.json({ ok: true, sku: body.sku, entrada: Number(body.qtd) });
}
