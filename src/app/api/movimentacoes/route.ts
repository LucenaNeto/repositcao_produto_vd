import { db, schema } from "@/server/db";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { TimePrecision } from "zod";

export const runtime = "nodejs";

// GET /api/movimentacoes
export async function GET() {
    try {
        const rows = await db
            .select({
                id:schema.movimentacoesEstoque.id,
                produtoId:schema.movimentacoesEstoque.produtoId,
                ProdutoNome:schema.produtos.nome,
                Tipo:schema.movimentacoesEstoque.tipo,
                quantidade:schema.movimentacoesEstoque.quantidade,
                solicitacaoId:schema.movimentacoesEstoque.solicitacaoId,
                criadoEm:schema.movimentacoesEstoque.criadoEm,
            })
            .from(schema.movimentacoesEstoque)
            .leftJoin(
                 schema.produtos,
                 eq(schema.produtos.id,schema.movimentacoesEstoque.produtoId)
                )
            .orderBy(desc(schema.movimentacoesEstoque.criadoEm));

        return NextResponse.json(rows);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }
}

