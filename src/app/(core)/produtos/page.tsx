export const dynamic = "force-dynamic";

import { db, schema } from "@/server/db";

export default function ProdutosPage() {
  const produtos = db.select().from(schema.produtos).all();

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Produtos</h1>
      <ul className="space-y-2">
        {produtos.map((p) => (
          <li key={p.id} className="rounded border p-3">
            <div className="font-medium">{p.nome}</div>
            <div className="text-sm text-gray-500">
              SKU: {p.sku} • UN: {p.unidade}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
