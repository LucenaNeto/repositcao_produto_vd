export const dynamic = "force-dynamic";

import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";

export default function MovimentacoesPage() {
  const rows = db
    .select({
      id: schema.movimentacoesEstoque.id,
      tipo: schema.movimentacoesEstoque.tipo,
      quantidade: schema.movimentacoesEstoque.quantidade,
      solicitacaoId: schema.movimentacoesEstoque.solicitacaoId,
      criadoEm: schema.movimentacoesEstoque.criadoEm,
      sku: schema.produtos.sku,
      nome: schema.produtos.nome,
    })
    .from(schema.movimentacoesEstoque)
    .leftJoin(schema.produtos, eq(schema.produtos.id, schema.movimentacoesEstoque.produtoId))
    .all()
    .sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Movimentações de Estoque</h1>
      <div className="overflow-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">SKU</th>
              <th className="text-left p-2">Produto</th>
              <th className="text-left p-2">Qtd</th>
              <th className="text-left p-2">Solicitação</th>
              <th className="text-left p-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.id}</td>
                <td className="p-2">{r.tipo}</td>
                <td className="p-2">{r.sku}</td>
                <td className="p-2">{r.nome}</td>
                <td className="p-2">{r.quantidade}</td>
                <td className="p-2">{r.solicitacaoId ?? "-"}</td>
                <td className="p-2">{r.criadoEm}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-4 text-center text-gray-500" colSpan={7}>Sem movimentações.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
