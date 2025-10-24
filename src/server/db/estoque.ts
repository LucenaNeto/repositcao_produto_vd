import { db, schema } from "./index";
import { eq } from "drizzle-orm";

// Aceita db ou tx (transação)
type DBLike = any;

// --- FUNÇÕES BASE ---

export function ensureEstoque(produtoId: number, cx?: DBLike) {
  const tx = cx ?? db;
  const row = tx
    .select()
    .from(schema.estoques)
    .where(eq(schema.estoques.produtoId, produtoId))
    .get();

  if (!row) {
    tx.insert(schema.estoques).values({
      produtoId,
      quantidade: 0,
      reservado: 0,
    }).run?.() ?? tx.insert(schema.estoques).values({
      produtoId,
      quantidade: 0,
      reservado: 0,
    });
  }
}

export function getSaldo(produtoId: number, cx?: DBLike): number {
  const tx = cx ?? db;
  const row = tx
    .select({ quantidade: schema.estoques.quantidade })
    .from(schema.estoques)
    .where(eq(schema.estoques.produtoId, produtoId))
    .get();

  return row?.quantidade ?? 0;
}

export function getReservado(produtoId: number, cx?: DBLike): number {
  const tx = cx ?? db;
  const row = tx
    .select({ reservado: schema.estoques.reservado })
    .from(schema.estoques)
    .where(eq(schema.estoques.produtoId, produtoId))
    .get();

  return row?.reservado ?? 0;
}

export function getDisponivel(produtoId: number, cx?: DBLike): number {
  const tx = cx ?? db;
  return getSaldo(produtoId, tx) - getReservado(produtoId, tx);
}

// --- MOVIMENTAÇÕES ---

export async function entrada(
  produtoId: number,
  qtd: number,
  usuarioNome?: string,  
  cx?: DBLike
) {
  const tx = cx ?? db;
  if (!(qtd > 0)) throw new Error("Quantidade de entrada inválida");

  await ensureEstoque(produtoId, tx);
  const saldoAtual = await getSaldo(produtoId, tx);

  await tx
    .update(schema.estoques)
    .set({ quantidade: saldoAtual + qtd })
    .where(eq(schema.estoques.produtoId, produtoId));

 
  await tx.insert(schema.movimentacoesEstoque).values({
    produtoId,
    tipo: "entrada",
    quantidade: qtd,
    usuario: usuarioNome ?? "Sistema",
  });
}

export async function saida(
  produtoId: number,
  qtd: number,
  solicitacaoId: number,
  usuarioNome?: string,   
  cx?: DBLike
) {
  const tx = cx ?? db;
  if (!(qtd > 0)) throw new Error("Quantidade de saída inválida");

  await ensureEstoque(produtoId, tx);
  const saldo = await getSaldo(produtoId, tx);
  if (saldo < qtd) throw new Error("Saldo insuficiente");

  await tx
    .update(schema.estoques)
    .set({ quantidade: saldo - qtd })
    .where(eq(schema.estoques.produtoId, produtoId));

  await tx.insert(schema.movimentacoesEstoque).values({
    produtoId,
    tipo: "saida",
    quantidade: qtd,
    solicitacaoId,
    usuario: usuarioNome ?? "Sistema",
  });
}

// --- RESERVAS ---

export function reservar(produtoId: number, qtd: number, solicitacaoId: number, cx?: DBLike) {
  const tx = cx ?? db;
  if (!(qtd > 0)) throw new Error("Quantidade de reserva inválida");

  ensureEstoque(produtoId, tx);
  const disponivel = getDisponivel(produtoId, tx);
  if (disponivel < qtd) throw new Error("Saldo indisponível para reservar");

  const reservadoAtual = getReservado(produtoId, tx);

  tx.update(schema.estoques)
    .set({ reservado: reservadoAtual + qtd })
    .where(eq(schema.estoques.produtoId, produtoId))
    .run?.() ?? tx.update(schema.estoques)
    .set({ reservado: reservadoAtual + qtd })
    .where(eq(schema.estoques.produtoId, produtoId));

  tx.insert(schema.reservas)
    .values({ solicitacaoId, produtoId, quantidade: qtd })
    .run?.() ?? tx.insert(schema.reservas)
    .values({ solicitacaoId, produtoId, quantidade: qtd });
}

export function liberarReservasPorSolicitacao(solicitacaoId: number, cx?: DBLike) {
  const tx = cx ?? db;
  const rows = tx
    .select()
    .from(schema.reservas)
    .where(eq(schema.reservas.solicitacaoId, solicitacaoId))
    .all();

  for (const r of rows) {
    const atual = getReservado(r.produtoId, tx);
    tx.update(schema.estoques)
      .set({ reservado: Math.max(0, atual - r.quantidade) })
      .where(eq(schema.estoques.produtoId, r.produtoId))
      .run?.() ?? tx.update(schema.estoques)
      .set({ reservado: Math.max(0, atual - r.quantidade) })
      .where(eq(schema.estoques.produtoId, r.produtoId));
  }

  tx.delete(schema.reservas)
    .where(eq(schema.reservas.solicitacaoId, solicitacaoId))
    .run?.() ?? tx.delete(schema.reservas)
    .where(eq(schema.reservas.solicitacaoId, solicitacaoId));
}
