// src/app/(core)/solicitacoes/[id]/page.tsx
"use client";

import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useFetchAuth } from "@/lib/fetchAuth";
import { useAuth } from "@/context/AuthContext";

type Item = {
  itemId: number;
  produtoId: number;
  sku: string;
  nome: string;
  quantidade: number; // solicitada
  reservado: number;  // já reservado
};

type DetalheSolicitacao = {
  id: number;
  status: "aberta" | "finalizada" | string;
  criadoEm: string | null;
  consultoraCodigo: string | null;
  consultoraNome: string | null;
  itens: Item[];
};

export default function SolicitacaoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const { usuario } = useAuth();
  const { fetchAuth } = useFetchAuth();
  const router = useRouter();
  const [finLoading, setFinLoading] = useState(false);

  const fetcher = async (url: string) => {
    const res = await fetchAuth(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Erro ao carregar detalhes");
    return (await res.json()) as DetalheSolicitacao;
  };

  const { data, error, mutate } = useSWR(
    `/api/solicitacoes/${params.id}`,
    fetcher
  );

  async function finalizar() {
    if (!data || data.status !== "aberta") return;
    if (!confirm(`Finalizar solicitação #${data.id}?`)) return;
    try {
      setFinLoading(true);
      const res = await fetchAuth(`/api/solicitacoes/${data.id}/concluir`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Falha ao finalizar");
      alert("✅ Solicitação finalizada!");
      await mutate();
      router.push("/solicitacoes");
      router.refresh();
    } catch (e: any) {
      alert(e?.message || "Erro ao finalizar");
    } finally {
      setFinLoading(false);
    }
  }

  if (error) {
    return (
      <ProtectedRoute allow={["estoque", "admin", "solicitante"]}>
        <main className="max-w-5xl mx-auto p-6">Erro ao carregar detalhes.</main>
      </ProtectedRoute>
    );
  }
  if (!data) {
    return (
      <ProtectedRoute allow={["estoque", "admin", "solicitante"]}>
        <main className="max-w-5xl mx-auto p-6">Carregando...</main>
      </ProtectedRoute>
    );
  }

  const podeFinalizar =
    data.status === "aberta" &&
    (usuario?.papel === "estoque" || usuario?.papel === "admin");

  return (
    <ProtectedRoute allow={["estoque", "admin", "solicitante"]}>
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Solicitação #{data.id}{" "}
              <span
                className={`ml-2 rounded px-2 py-1 text-xs text-white ${
                  data.status === "aberta" ? "bg-yellow-600" : "bg-green-700"
                }`}
              >
                {data.status}
              </span>
            </h1>
            <p className="text-sm text-gray-600">
              Consultora:{" "}
              <span className="font-medium">
                {data.consultoraNome ?? "-"}
              </span>{" "}
              {data.consultoraCodigo ? `(${data.consultoraCodigo})` : ""}
              {data.criadoEm ? ` • Criado em ${data.criadoEm}` : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/solicitacoes"
              className="px-3 py-2 rounded border hover:bg-gray-50"
            >
              ← Voltar
            </Link>

            {podeFinalizar && (
              <button
                onClick={finalizar}
                disabled={finLoading}
                className={`px-3 py-2 rounded text-white ${
                  finLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-700 hover:bg-green-800"
                }`}
              >
                {finLoading ? "Finalizando..." : "Finalizar"}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">SKU</th>
                <th className="text-left p-2">Produto</th>
                <th className="text-right p-2">Solicitado</th>
                <th className="text-right p-2">Reservado</th>
              </tr>
            </thead>
            <tbody>
              {data.itens.map((it) => (
                <tr key={it.itemId} className="border-t">
                  <td className="p-2">{it.sku}</td>
                  <td className="p-2">{it.nome}</td>
                  <td className="p-2 text-right">{it.quantidade}</td>
                  <td className="p-2 text-right">{it.reservado}</td>
                </tr>
              ))}
              {data.itens.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500 italic">
                    Nenhum item.
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
