// src/server/db/estoque.ts
import { schema } from "@/server/db";
import { eq, sql } from "drizzle-orm";

// Para o MVP: aceitamos o `tx` da transação como any para evitar fricção de tipos.
type Tx = any;

/** Entrada de estoque (NÃO usar async/await dentro de transação) */
export function entrada(
  tx: Tx,
  produtoId: number,
  qtd: number,
  solicitacaoId?: number,
  usuario = "Sistema",
) {
  if (!Number.isFinite(qtd) || qtd <= 0) throw new Error("Quantidade deve ser > 0");

  const [estoque] = tx
    .select()
    .from(schema.estoques)
    .where(eq(schema.estoques.produtoId, produtoId))
    .all();

  if (!estoque) {
    tx.insert(schema.estoques)
      .values({
        produtoId,
        quantidade: qtd,
        reservado: 0,
        atualizadoEm: sql`CURRENT_TIMESTAMP`,
      })
      .run();
  } else {
    tx.update(schema.estoques)
      .set({
        quantidade: (estoque.quantidade ?? 0) + qtd,
        atualizadoEm: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(schema.estoques.produtoId, produtoId))
      .run();
  }

  tx.insert(schema.movimentacoesEstoque)
    .values({
      produtoId,
      tipo: "entrada",
      quantidade: qtd,
      solicitacaoId,
      usuario,
      criadoEm: sql`CURRENT_TIMESTAMP`,
    })
    .run();
}

/** Saída de estoque (baixa saldo) */
export function saida(
  tx: Tx,
  produtoId: number,
  qtd: number,
  solicitacaoId?: number,
  usuario = "Sistema",
) {
  if (!Number.isFinite(qtd) || qtd <= 0) throw new Error("Quantidade deve ser > 0");

  const [estoque] = tx
    .select()
    .from(schema.estoques)
    .where(eq(schema.estoques.produtoId, produtoId))
    .all();

  const atual = estoque?.quantidade ?? 0;
  const novo = atual - qtd;
  if (novo < 0) throw new Error(`Saldo insuficiente no produto ${produtoId}`);

  tx.update(schema.estoques)
    .set({
      quantidade: novo,
      atualizadoEm: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(schema.estoques.produtoId, produtoId))
    .run();

  tx.insert(schema.movimentacoesEstoque)
    .values({
      produtoId,
      tipo: "saida",
      quantidade: qtd,
      solicitacaoId,
      usuario,
      criadoEm: sql`CURRENT_TIMESTAMP`,
    })
    .run();
}

/** Reserva saldo para uma solicitação (↑ reservado + grava em 'reservas') */
export function reservar(
  tx: Tx,
  solicitacaoId: number,
  produtoId: number,
  qtd: number,
) {
  if (!Number.isFinite(qtd) || qtd <= 0) throw new Error("Quantidade deve ser > 0");

  const [est] = tx
    .select()
    .from(schema.estoques)
    .where(eq(schema.estoques.produtoId, produtoId))
    .all();

  // cria o registro de estoque se não existir
  if (!est) {
    tx.insert(schema.estoques)
      .values({
        produtoId,
        quantidade: 0,
        reservado: 0,
        atualizadoEm: sql`CURRENT_TIMESTAMP`,
      })
      .run();
  }

  const quantidadeAtual = est?.quantidade ?? 0;
  const reservadoAtual = est?.reservado ?? 0;
  const disponivel = quantidadeAtual - reservadoAtual;

  if (qtd > disponivel) {
    throw new Error(`Saldo disponível insuficiente para reservar (prod ${produtoId})`);
  }

  // atualiza reservado
  tx.update(schema.estoques)
    .set({
      reservado: reservadoAtual + qtd,
      atualizadoEm: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(schema.estoques.produtoId, produtoId))
    .run();

  // ledger de reservas
  tx.insert(schema.reservas)
    .values({
      solicitacaoId,
      produtoId,
      quantidade: qtd,
      criadoEm: sql`CURRENT_TIMESTAMP`,
    })
    .run();
}

/** Libera TODAS as reservas de uma solicitação (↓ reservado e apaga linhas) */
export function liberarReservasPorSolicitacao(tx: Tx, solicitacaoId: number) {
  const reservas = tx
    .select()
    .from(schema.reservas)
    .where(eq(schema.reservas.solicitacaoId, solicitacaoId))
    .all();

  for (const r of reservas) {
    const [est] = tx
      .select()
      .from(schema.estoques)
      .where(eq(schema.estoques.produtoId, r.produtoId))
      .all();

    const reservadoAtual = est?.reservado ?? 0;
    const novoReservado = reservadoAtual - r.quantidade;
    if (novoReservado < 0) throw new Error(`Reservado negativo no produto ${r.produtoId}`);

    tx.update(schema.estoques)
      .set({
        reservado: novoReservado,
        atualizadoEm: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(schema.estoques.produtoId, r.produtoId))
      .run();
  }

  tx.delete(schema.reservas)
    .where(eq(schema.reservas.solicitacaoId, solicitacaoId))
    .run();
}
