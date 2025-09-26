"use client";

type Consultora = { id: number; codigo: string; nome: string };
type Produto   = { id: number; sku: string; nome: string };

export default function NovaSolicitacaoForm({
  consultoras,
  produtos,
}: {
  consultoras: Consultora[];
  produtos: Produto[];
}) {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const consultoraCodigo = String(data.get("consultoraCodigo"));

    // coleta até 5 linhas simples
    const linhas = [0, 1, 2, 3, 4];
    const itens: Array<{ sku: string; qtd: number }> = [];
    for (const i of linhas) {
      const sku = String(data.get(`sku_${i}`) || "").trim();
      const qtdRaw = String(data.get(`qtd_${i}`) || "").trim();
      if (!sku || !qtdRaw) continue;
      const qtd = Number(qtdRaw);
      if (Number.isFinite(qtd) && qtd > 0) itens.push({ sku, qtd });
    }

    const res = await fetch("/api/solicitacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultoraCodigo, itens }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(`Erro: ${JSON.stringify(json)}`);
      return;
    }

    alert(`Criado! ID ${json.solicitacaoId}`);
    // opcional: ir direto para o detalhe
    // location.href = `/solicitacoes/${json.solicitacaoId}`;
    form.reset();
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="block text-sm font-medium">Consultora</label>
        <select name="consultoraCodigo" className="border rounded p-2 w-full" required>
          <option value="">-- Selecione --</option>
          {consultoras.map((c) => (
            <option key={c.id} value={c.codigo}>
              {c.codigo} — {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Itens (SKU e Qtd)</div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input
              name={`sku_${i}`}
              placeholder="SKU"
              list="skus"
              className="border rounded p-2 col-span-2"
            />
            <input
              name={`qtd_${i}`}
              placeholder="Qtd"
              type="number"
              min={1}
              className="border rounded p-2"
            />
          </div>
        ))}
        <datalist id="skus">
          {produtos.map((p) => (
            <option key={p.id} value={p.sku}>
              {p.nome}
            </option>
          ))}
        </datalist>
        <p className="text-xs text-gray-500">Dica: digite o SKU ou selecione na lista</p>
      </div>

      <button className="bg-black text-white rounded px-4 py-2">Criar</button>
    </form>
  );
}
