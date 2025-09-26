export const dynamic = "force-dynamic";

import Link from "next/link";
import { db, schema } from "@/server/db";
import { eq, sql } from "drizzle-orm";

export default function SolicitacoesPage() {
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
    .groupBy(
      schema.solicitacoes.id,
      schema.solicitacoes.criadoEm,
      schema.solicitacoes.status,
      schema.consultoras.nome
    )
    .all()
    .sort((a, b) => b.id - a.id);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Solicitações</h1>
        <Link href="/solicitacoes/novo" className="underline">
          Nova Solicitação
        </Link>
      </div>

      <div className="overflow-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Consultora</th>
              <th className="text-left p-2">Itens</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Criado em</th>
              <th className="text-left p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.id}</td>
                <td className="p-2">{r.consultora ?? "-"}</td>
                <td className="p-2">{r.itens}</td>
                <td className="p-2">
                  <span className="rounded px-2 py-1 bg-gray-100">{r.status}</span>
                </td>
                <td className="p-2">{r.criadoEm}</td>
                <td className="p-2">
                  <Link href={`/solicitacoes/${r.id}`} className="underline">
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={6}>
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
