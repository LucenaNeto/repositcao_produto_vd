// src/app/api/estoques/repor/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { entrada } from "@/server/db/estoque";
import { verificarPapel } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1) Autenticação + papel
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;

    // Só admin/estoque podem repor
    const usuario = verificarPapel(token, ["admin", "estoque"]);

    // 2) Validação do body
    const body = await req.json().catch(() => null);
    const sku = String(body?.sku ?? "").trim();
    const qtd = Number(body?.qtd ?? 0);

    if (!sku || !(qtd > 0)) {
      return NextResponse.json(
        { error: "Informe { sku, qtd > 0 }" },
        { status: 400 }
      );
    }

    // 3) Localiza produto pelo SKU
    const prod = await db
      .select()
      .from(schema.produtos)
      .where(eq(schema.produtos.sku, sku))
      .get();

    if (!prod) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // 4) Efetiva a entrada e registra o nome de quem realizou
    await entrada(prod.id, qtd, usuario.nome);

    return NextResponse.json({
      ok: true,
      sku,
      entrada: qtd,
      por: usuario.nome,
    });
  } catch (err: any) {
    const msg = err?.message ?? "Erro ao repor";
    const status = /Token|Acesso|papel|perm/i.test(msg) ? 401 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
