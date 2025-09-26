export const dynamic = "force-dynamic";

import { db, schema } from "@/server/db";
import NovaSolicitacaoForm from "./form";

export default function NovaSolicitacaoPage() {
  // carregar dados no server (pode importar o DB aqui)
  const consultoras = db
    .select({
      id: schema.consultoras.id,
      codigo: schema.consultoras.codigo,
      nome: schema.consultoras.nome,
    })
    .from(schema.consultoras)
    .all();

  const produtos = db
    .select({
      id: schema.produtos.id,
      sku: schema.produtos.sku,
      nome: schema.produtos.nome,
    })
    .from(schema.produtos)
    .all();

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Nova Solicitação</h1>
      <NovaSolicitacaoForm consultoras={consultoras} produtos={produtos} />
    </main>
  );
}
