// src/app/(core)/solicitacoes/novo/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { fetchAuth } from "@/lib/fetchAuth";   // ⬅️ função (não hook)
import { toast } from "sonner";

type Item = { sku: string; qtd: number };

export default function NovaSolicitacaoPage() {
  const router = useRouter();

  const [consultoraCodigo, setConsultoraCodigo] = useState("");
  const [itens, setItens] = useState<Item[]>([{ sku: "", qtd: 1 }]);
  const [saving, setSaving] = useState(false);

  function addItem() {
    setItens((arr) => [...arr, { sku: "", qtd: 1 }]);
  }

  function removeItem(index: number) {
    setItens((arr) => arr.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<Item>) {
    setItens((arr) => arr.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validações básicas no front
    const cleanItens = itens
      .map((i) => ({ sku: i.sku.trim(), qtd: Number(i.qtd) }))
      .filter((i) => i.sku && i.qtd > 0);

    if (!consultoraCodigo.trim()) {
      toast.error("Informe o código da consultora.");
      return;
    }
    if (cleanItens.length === 0) {
      toast.error("Adicione ao menos um item com SKU e quantidade > 0.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetchAuth("/api/solicitacoes/criar-e-reservar", {
        method: "POST",
        body: JSON.stringify({
          consultoraCodigo: consultoraCodigo.trim(),
          itens: cleanItens,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Falha ao criar solicitação");

      toast.success(`Solicitação #${json.solicitacaoId} criada e reservada!`);
      router.push("/solicitacoes");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute allow={["solicitante", "admin"]}>
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Nova Solicitação</h1>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Consultora */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Código da consultora</label>
            <input
              className="border rounded p-2 w-full"
              placeholder="ex: 0255"
              value={consultoraCodigo}
              onChange={(e) => setConsultoraCodigo(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Use o <span className="font-mono">codigo</span> cadastrado (não o nome).
            </p>
          </div>

          {/* Itens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Itens</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                + Adicionar item
              </button>
            </div>

            <div className="rounded border divide-y">
              {itens.map((it, idx) => (
                <div key={idx} className="p-3 grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-8">
                    <label className="block text-sm font-medium">SKU</label>
                    <input
                      className="border rounded p-2 w-full"
                      placeholder="ex: SKU-1001"
                      value={it.sku}
                      onChange={(e) => updateItem(idx, { sku: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      className="border rounded p-2 w-full"
                      value={it.qtd}
                      onChange={(e) => updateItem(idx, { qtd: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-600 hover:underline"
                      disabled={itens.length === 1}
                      title={itens.length === 1 ? "Mantenha ao menos um item" : "Remover"}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar e Reservar"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/solicitacoes")}
              className="px-4 py-2 rounded border hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </ProtectedRoute>
  );
}
