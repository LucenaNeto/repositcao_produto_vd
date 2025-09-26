"use client";

import { useEffect, useState } from "react";

type Row = {
  produtoId: number; sku: string; nome: string;
  quantidade: number; reservado: number; disponivel: number;
};

export default function EstoquesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [sku, setSku] = useState("");
  const [qtd, setQtd] = useState<number>(0);

  async function load() {
    const res = await fetch("/api/estoques", { cache: "no-store" });
    setRows(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function repor(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/estoques/repor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, qtd }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error || "Falha"); return; }
    setSku(""); setQtd(0);
    await load();
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Estoque</h1>

      <form onSubmit={repor} className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium">SKU</label>
          <input className="border rounded p-2 w-full"
            value={sku} onChange={(e)=>setSku(e.target.value)} placeholder="SKU-1001" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Qtd</label>
          <input className="border rounded p-2 w-32" type="number" min={1}
            value={qtd} onChange={(e)=>setQtd(Number(e.target.value))} required />
        </div>
        <button className="bg-black text-white rounded px-4 py-2">Repor</button>
      </form>

      <div className="overflow-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">SKU</th>
              <th className="text-left p-2">Produto</th>
              <th className="text-left p-2">Saldo</th>
              <th className="text-left p-2">Reservado</th>
              <th className="text-left p-2">Disponível</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.produtoId} className="border-t">
                <td className="p-2">{r.sku}</td>
                <td className="p-2">{r.nome}</td>
                <td className="p-2">{r.quantidade}</td>
                <td className="p-2">{r.reservado}</td>
                <td className="p-2">{r.disponivel}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-4 text-center text-gray-500" colSpan={5}>Sem dados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
