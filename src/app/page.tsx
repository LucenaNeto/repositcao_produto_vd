export const dynamic = "force-dynamic";

import Link from "next/link";
import { db, schema } from "@/server/db";
import { sql } from "drizzle-orm";

export default function Dashboard() {
  // contagem por status
  const statusRows = db
    .select({
      status: schema.solicitacoes.status,
      qtd: sql<number>`count(*)`,
    })
    .from(schema.solicitacoes)
    .groupBy(schema.solicitacoes.status)
    .all();

  const byStatus = Object.fromEntries(statusRows.map(r => [r.status, r.qtd]));

  // KPIs de estoque (total, reservado, disponível)
  const estoqueAgg = db
    .select({
      total: sql<number>`coalesce(sum(${schema.estoques.quantidade}),0)`,
      reservado: sql<number>`coalesce(sum(${schema.estoques.reservado}),0)`,
    })
    .from(schema.estoques)
    .get() ?? { total: 0, reservado: 0 };

  const disponivel = estoqueAgg.total - estoqueAgg.reservado;

  // total de produtos
  const totalProdutos = db
    .select({ qtd: sql<number>`count(*)` })
    .from(schema.produtos)
    .get()?.qtd ?? 0;

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Cards rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Solicitações Abertas" value={byStatus["aberta"] ?? 0} href="/solicitacoes" />
        <Card title="Em Separação" value={byStatus["separacao"] ?? 0} href="/solicitacoes" />
        <Card title="Concluídas" value={byStatus["concluida"] ?? 0} href="/solicitacoes" />
        <Card title="Canceladas" value={byStatus["cancelada"] ?? 0} href="/solicitacoes" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Itens em Estoque" value={estoqueAgg.total} href="/estoques" />
        <Card title="Reservado" value={estoqueAgg.reservado} href="/estoques" />
        <Card title="Disponível" value={disponivel} href="/estoques" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Produtos Cadastrados" value={totalProdutos} href="/produtos" />
        <CTA />
      </div>
    </main>
  );
}

function Card({ title, value, href }: { title: string; value: number; href?: string }) {
  const content = (
    <div className="rounded border p-4 hover:shadow-sm transition">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function CTA() {
  return (
    <div className="rounded border p-4 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">Atalhos</div>
        <div className="mt-1 text-sm">
          Crie uma solicitação, reponha estoque ou veja o histórico de movimentações.
        </div>
      </div>
      <div className="flex gap-2">
        <Link href="/solicitacoes/novo" className="px-3 py-2 rounded bg-black text-white text-sm">
          Nova Solicitação
        </Link>
        <Link href="/estoques" className="px-3 py-2 rounded border text-sm">
          Estoques
        </Link>
        <Link href="/movimentacoes" className="px-3 py-2 rounded border text-sm">
          Movimentações
        </Link>
      </div>
    </div>
  );
}
