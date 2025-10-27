export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

// Validação do corpo
const BodySchema = z.object({
  consultoraCodigo: z.string().min(1, "Informe o código da consultora"),
  itens: z
    .array(
      z.object({
        sku: z.string().min(1, "SKU é obrigatório"),
        qtd: z.number().int().positive("Qtd deve ser > 0"),
      })
    )
    .min(1, "Inclua ao menos um item"),
});

// POST /api/solicitacoes/criar-e-reservar
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { consultoraCodigo, itens } = parsed.data;

    // 1) Consultora por código
    const consultora = db
      .select()
      .from(schema.consultoras)
      .where(eq(schema.consultoras.codigo, consultoraCodigo))
      .get();

    if (!consultora) {
      return NextResponse.json({ error: "Consultora não encontrada" }, { status: 404 });
    }

    // 2) Produtos pelos SKUs
    const skus = itens.map((i) => i.sku);
    const produtos = db
      .select()
      .from(schema.produtos)
      .where(inArray(schema.produtos.sku, skus))
      .all();

    if (produtos.length !== skus.length) {
      const encontrados = new Set(produtos.map((p) => p.sku));
      const faltantes = skus.filter((s) => !encontrados.has(s));
      return NextResponse.json(
        { error: `SKU(s) inexistente(s): ${faltantes.join(", ")}` },
        { status: 400 }
      );
    }

    const produtoPorSku = new Map(produtos.map((p) => [p.sku, p]));

    // 3) Transação: cria solicitação + itens + reservas (tudo junto)
    const solicitacaoId = db.transaction((tx) => {
      // Cabeçalho
      const res = tx
        .insert(schema.solicitacoes)
        .values({ consultoraId: consultora.id, status: "aberta" })
        .run();
      const newId = Number(res.lastInsertRowid);

      // Itens
      tx.insert(schema.solicitacaoItens)
        .values(
          itens.map((i) => ({
            solicitacaoId: newId,
            produtoId: produtoPorSku.get(i.sku)!.id,
            quantidade: i.qtd,
          }))
        )
        .run();

      // Reservas por item
      for (const i of itens) {
        const produtoId = produtoPorSku.get(i.sku)!.id;

        // Garante que estoque existe
        const estoqueRow = tx
          .select()
          .from(schema.estoques)
          .where(eq(schema.estoques.produtoId, produtoId))
          .get();

        if (!estoqueRow) {
          tx.insert(schema.estoques)
            .values({ produtoId, quantidade: 0, reservado: 0 })
            .run();
        }

        // Lê saldo e reservado atuais
        const atual = tx
          .select({
            quantidade: schema.estoques.quantidade,
            reservado: schema.estoques.reservado,
          })
          .from(schema.estoques)
          .where(eq(schema.estoques.produtoId, produtoId))
          .get();

        const saldo = atual?.quantidade ?? 0;
        const reservado = atual?.reservado ?? 0;
        const disponivel = saldo - reservado;

        if (disponivel < i.qtd) {
          throw new Error(`Saldo indisponível para reservar o SKU ${i.sku}`);
        }

        // Aumenta reservado
        tx.update(schema.estoques)
          .set({ reservado: reservado + i.qtd })
          .where(eq(schema.estoques.produtoId, produtoId))
          .run();

        // Registra reserva (ledger)
        tx.insert(schema.reservas)
          .values({ solicitacaoId: newId, produtoId, quantidade: i.qtd })
          .run();
      }

      return newId;
    });

    return NextResponse.json({ ok: true, solicitacaoId }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
