// src/app/(core)/estoques/page.tsx
"use client";

import { useEffect, useState } from "react";
import { fetchAuth } from "@/lib/fetchAuth";            // ⬅️ use a função, não um hook
import ProtectedRoute from "@/components/ProtectedRoute";

type Row = {
  produtoId: number;
  sku: string;
  nome: string;
  quantidade: number;
  reservado: number;
  disponivel: number;
};

export default function EstoquesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [sku, setSku] = useState("");
  const [qtd, setQtd] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await fetchAuth("/api/estoques", { cache: "no-store" });
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar estoques");
    }
  }

  useEffect(() => { load(); }, []);

  async function repor(e: React.FormEvent) {
    e.preventDefault();
    if (!sku.trim() || qtd <= 0) return alert("Informe SKU e quantidade válida");

    setLoading(true);
    try {
      const res = await fetchAuth("/api/estoques/repor", {
        method: "POST",
        body: JSON.stringify({ sku: sku.trim(), qtd: Number(qtd) }), // já serializado
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Falha ao repor estoque");

      setSku("");
      setQtd(0);
      await load();
      alert("✅ Estoque atualizado com sucesso!");
    } catch (err: any) {
      alert(`❌ ${err.message || "Erro ao repor estoque"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute allow={["estoque", "admin"]}>
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Estoque</h1>

        <form onSubmit={repor} className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium">SKU</label>
            <input
              className="border rounded p-2 w-full"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SKU-1001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Qtd</label>
            <input
              className="border rounded p-2 w-32"
              type="number"
              min={1}
              value={qtd}
              onChange={(e) => setQtd(Number(e.target.value))}
              required
            />
          </div>
          <button
            disabled={loading}
            className={`rounded px-4 py-2 text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
            }`}
          >
            {loading ? "Repondo..." : "Repor"}
          </button>
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
              {rows.map((r) => (
                <tr key={r.produtoId} className="border-t">
                  <td className="p-2">{r.sku}</td>
                  <td className="p-2">{r.nome}</td>
                  <td className="p-2">{r.quantidade}</td>
                  <td className="p-2">{r.reservado}</td>
                  <td className="p-2">{r.disponivel}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-500 italic" colSpan={5}>
                    Nenhum item no estoque.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </ProtectedRoute>
  );
}
 