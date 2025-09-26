export const dynamic = "force-dynamic";

import Link from "next/link";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import StatusActions from "@/app/solicitacoes/[id]/status-actions";

type Props = { params: { id: string } };

export default function SolicitacaoDetalhePage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return <main className="p-6">ID inválido</main>;
  }

  const header = db
    .select({
      id: schema.solicitacoes.id,
      status: schema.solicitacoes.status,
      criadoEm: schema.solicitacoes.criadoEm,
      consultoraNome: schema.consultoras.nome,
      consultoraCodigo: schema.consultoras.codigo,
    })
    .from(schema.solicitacoes)
    .leftJoin(
      schema.consultoras,
      eq(schema.solicitacoes.consultoraId, schema.consultoras.id)
    )
    .where(eq(schema.solicitacoes.id, id))
    .get();

  if (!header) {
    return <main className="p-6">Solicitação não encontrada.</main>;
  }

  const itens = db
    .select({
      id: schema.solicitacaoItens.id,
      quantidade: schema.solicitacaoItens.quantidade,
      produtoNome: schema.produtos.nome,
      produtoSku: schema.produtos.sku,
    })
    .from(schema.solicitacaoItens)
    .leftJoin(
      schema.produtos,
      eq(schema.solicitacaoItens.produtoId, schema.produtos.id)
    )
    .where(eq(schema.solicitacaoItens.solicitacaoId, id))
    .all();

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Solicitação #{header.id}</h1>
        <Link href="/solicitacoes" className="underline">Voltar</Link>
      </div>

      <section className="rounded border p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Consultora:</span> {header.consultoraNome} ({header.consultoraCodigo})</div>
          <div><span className="text-gray-500">Criado em:</span> {header.criadoEm}</div>
          <div><span className="text-gray-500">Status:</span>{" "}
            <span className="rounded px-2 py-1 bg-gray-100">{header.status}</span>
          </div>
        </div>
        <div className="pt-3">
          <StatusActions id={header.id} statusAtual={header.status} />
        </div>
      </section>

      <section className="rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">SKU</th>
              <th className="text-left p-2">Produto</th>
              <th className="text-left p-2">Qtd</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.produtoSku}</td>
                <td className="p-2">{it.produtoNome}</td>
                <td className="p-2">{it.quantidade}</td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={3}>
                  Sem itens.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
