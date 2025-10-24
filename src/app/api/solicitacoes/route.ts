// src/app/api/solicitacoes/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { eq, inArray, and, sql } from "drizzle-orm";
import { z } from "zod";
import { verificarPapel } from "@/lib/auth";
import { reservar } from "@/server/db/estoque";

// ---------- Schema de entrada (auto contido) ----------
const NovaSolicitacaoSchema = z.object({
  consultoraCodigo: z.string().min(1),
  itens: z.array(
    z.object({
      sku: z.string().min(1),
      qtd: z.number().int().positive(),
    })
  ).min(1, "Informe pelo menos 1 item"),
});

// =============== POST: criar solicitação + reservar ===============
export async function POST(req: Request) {
  try {
    // 1) Só "solicitante" e "admin" podem criar
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;
    verificarPapel(token, ["solicitante", "admin"]);

    // 2) Validação dos dados
    const json = await req.json();
    const parsed = NovaSolicitacaoSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { consultoraCodigo, itens } = parsed.data;

    // 3) Consultora existe?
    const consultora = db
      .select()
      .from(schema.consultoras)
      .where(eq(schema.consultoras.codigo, consultoraCodigo))
      .get();
    if (!consultora) {
      return NextResponse.json({ error: "Consultora não encontrada" }, { status: 404 });
    }

    // 4) Produtos por SKU
    const skus = itens.map(i => i.sku);
    const produtos = db
      .select()
      .from(schema.produtos)
      .where(inArray(schema.produtos.sku, skus))
      .all();

    if (produtos.length !== skus.length) {
      const encontrados = new Set(produtos.map(p => p.sku));
      const faltantes = skus.filter(s => !encontrados.has(s));
      return NextResponse.json(
        { error: `SKU(s) inexistente(s): ${faltantes.join(", ")}` },
        { status: 400 }
      );
    }
    const mapSKU = new Map(produtos.map(p => [p.sku, p]));

    // 5) Transação: cria cabeçalho + itens + RESERVA automática
    const solicitacaoId = db.transaction((tx) => {
      const res = tx
        .insert(schema.solicitacoes)
        .values({ consultoraId: consultora.id, status: "aberta" })
        .run();

      const newId = Number(res.lastInsertRowid);

      tx.insert(schema.solicitacaoItens)
        .values(
          itens.map(i => ({
            solicitacaoId: newId,
            produtoId: mapSKU.get(i.sku)!.id,
            quantidade: i.qtd,
          }))
        )
        .run();

      // Reserva automática por item (valida disponibilidade internamente)
      for (const i of itens) {
        const prodId = mapSKU.get(i.sku)!.id;
        // passar a transação "tx" para ficar tudo atômico
        // (reservar lança erro se não houver saldo disponível)
        // @ts-ignore (função aceitará tx como DBLike)
        reservar(prodId, i.qtd, newId, tx);
      }

      return newId;
    });

    return NextResponse.json({ ok: true, solicitacaoId }, { status: 201 });
  } catch (err: any) {
    const msg = err?.message ?? "Erro ao criar solicitação";
    // Se vier de reserva/saldo, devolvemos 400; demais, 500
    const status = /indisponível|invalida|insuficiente|SKU/i.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// =============== GET: lista resumida (todos os papéis veem) ===============
export async function GET(req: Request) {
  try {
    // 1) Apenas usuários autenticados (todos os papéis) podem listar
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;
    verificarPapel(token, ["solicitante", "estoque", "admin"]);

    // 2) Filtros simples: status, consultoraCodigo
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "aberta" | "finalizada" | etc
    const consultoraCodigo = searchParams.get("consultoraCodigo");

    const conditions = [];
    if (status) {
      conditions.push(eq(schema.solicitacoes.status, status));
    }
    if (consultoraCodigo) {
      // join com consultoras
      // (inserimos a checagem no where, mas precisamos do leftJoin abaixo)
      conditions.push(eq(schema.consultoras.codigo, consultoraCodigo));
    }

    const rows = db
      .select({
        id: schema.solicitacoes.id,
        criadoEm: schema.solicitacoes.criadoEm,
        status: schema.solicitacoes.status,
        consultora: schema.consultoras.nome,
        itens: sql<number>`count(${schema.solicitacaoItens.id})`,
      })
      .from(schema.solicitacoes)
      .leftJoin(
        schema.consultoras,
        eq(schema.solicitacoes.consultoraId, schema.consultoras.id)
      )
      .leftJoin(
        schema.solicitacaoItens,
        eq(schema.solicitacoes.id, schema.solicitacaoItens.solicitacaoId)
      )
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(
        schema.solicitacoes.id,
        schema.solicitacoes.criadoEm,
        schema.solicitacoes.status,
        schema.consultoras.nome
      )
      .all()
      .sort((a, b) => b.id - a.id);

    return NextResponse.json(rows);
  } catch (err: any) {
    const msg = err?.message ?? "Erro ao listar solicitações";
    const status = /Token|Acesso|papel|perm/i.test(msg) ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
