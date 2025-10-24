import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const produtos = sqliteTable("produtos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  nome: text("nome").notNull(),
  unidade: text("unidade").notNull().default("UN"),
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
  // ainda vou implmentar atualizado em 
});

export const consultoras = sqliteTable("consultoras", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  codigo: text("codigo").notNull().unique(),
  nome: text("nome").notNull(),
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const solicitacoes = sqliteTable("solicitacoes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  consultoraId: integer("consultora_id")
    .notNull()
    .references(() => consultoras.id, { onDelete: "restrict" }),
  status: text("status").notNull().default("aberta"),
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const solicitacaoItens = sqliteTable("solicitacao_itens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  solicitacaoId: integer("solicitacao_id")
    .notNull()
    .references(() => solicitacoes.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "restrict" }),
  quantidade: integer("quantidade").notNull(),
});

// Saldo atual por produto (agora com campo reservado)
export const estoques = sqliteTable("estoques", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "restrict" }),
  quantidade: integer("quantidade").notNull().default(0),
  reservado: integer("reservado").notNull().default(0), // <— NOVO
  atualizadoEm: text("atualizado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Reservas por solicitação (ledger de reserva)
export const reservas = sqliteTable("reservas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  solicitacaoId: integer("solicitacao_id")
    .notNull()
    .references(() => solicitacoes.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "restrict" }),
  quantidade: integer("quantidade").notNull(),
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Ledger de entradas/saídas
export const movimentacoesEstoque = sqliteTable("movimentacoes_estoque", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  produtoId: integer("produto_id").notNull().references(() => produtos.id),
  tipo: text("tipo").notNull(), // "entrada" ou "saida"
  quantidade: integer("quantidade").notNull(),
  solicitacaoId: integer("solicitacao_id"),
  criadoEm: text("criado_em").default(sql`CURRENT_TIMESTAMP`),
  usuario: text("usuario").notNull().default("Sistema"), // <-- ADICIONE ESTA LINHA
});


export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senha: text("senha").notNull(),
  papel: text("papel").notNull(),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`), // 
});
