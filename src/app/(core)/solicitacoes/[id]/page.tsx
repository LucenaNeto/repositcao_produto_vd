"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useFetchAuth } from "@/lib/fetchAuth";
import { useAuth } from "@/context/AuthContext";

type Item = {
  itemId: number;
  produtoId: number;
  sku: string;
  nome: string;
  quantidade: number; // solicitado
  reservado: number;  // já reservado
};

type DetalheSolicitacao = {
  id: number;
  status: "aberta" | "finalizada" | "cancelada";
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
  const id = Number(params.id);
  const router = useRouter();
  const { fetchAuth } = useFetchAuth();
  const { usuario } = useAuth();

  const fetcher = async (url: string) => {
    const res = await fetchAuth(url);
    if (!res.ok) throw new Error("Erro ao carregar detalhes");
    return res.json() as Promise<DetalheSolicitacao>;
  };

  const { data, error, isLoading, mutate } = useSWR(
    Number.isFinite(id) ? `/api/solicitacoes/${id}` : null,
    fetcher
  );

  const [loadingAcao, setLoadingAcao] = useState<"cancelar" | "finalizar" | null>(null);

  const podeCancelar = ["admin", "estoque", "solicitante"].includes(usuario?.papel || "");
  const podeFinalizar = ["admin", "estoque"].includes(usuario?.papel || "");

  async function cancelar() {
    if (!data || data.status !== "aberta") return;
    if (!confirm("Confirma cancelar esta solicitação? As reservas serão liberadas.")) return;
    try {
      setLoadingAcao("cancelar");
      const res = await fetchAuth(`/api/solicitacoes/${id}/cancelar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro ao cancelar");
      alert("🧹 Solicitação cancelada.");
      await mutate();
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao cancelar");
    } finally {
      setLoadingAcao(null);
    }
  }

  async function finalizar() {
    if (!data || data.status !== "aberta") return;
    if (!confirm("Deseja realmente finalizar esta solicitação?")) return;
    try {
      setLoadingAcao("finalizar");
      const res = await fetchAuth(`/api/solicitacoes/${id}/concluir`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro ao finalizar");
      alert("✅ Solicitação finalizada!");
      await mutate();
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao finalizar");
    } finally {
      setLoadingAcao(null);
    }
  }

  if (error) return <div className="p-6 text-red-600">Erro ao carregar.</div>;
  if (isLoading || !data) return <div className="p-6">Carregando...</div>;

  const statusClr =
    data.status === "aberta"
      ? "bg-yellow-500"
      : data.status === "cancelada"
      ? "bg-gray-500"
      : "bg-green-600";

  return (
    <ProtectedRoute allow={["admin", "estoque", "solicitante"]}>
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Solicitação #{data.id}{" "}
              <span className={`ml-2 px-2 py-1 rounded text-white text-xs ${statusClr}`}>
                {data.status}
              </span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Criada em: {data.criadoEm ?? "-"} · Consultora:{" "}
              <span className="font-medium">
                {data.consultoraNome ?? "-"} {data.consultoraCodigo ? `(${data.consultoraCodigo})` : ""}
              </span>
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/solicitacoes" className="px-3 py-2 border rounded hover:bg-gray-50">
              ← Voltar
            </Link>

            {data.status === "aberta" && podeCancelar && (
              <button
                onClick={cancelar}
                disabled={loadingAcao === "cancelar"}
                className={`px-3 py-2 rounded text-white ${
                  loadingAcao === "cancelar" ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
                }`}
                title="Cancelar solicitação"
              >
                {loadingAcao === "cancelar" ? "Cancelando..." : "Cancelar"}
              </button>
            )}

            {data.status === "aberta" && podeFinalizar && (
              <button
                onClick={finalizar}
                disabled={loadingAcao === "finalizar"}
                className={`px-3 py-2 rounded text-white ${
                  loadingAcao === "finalizar" ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                }`}
                title="Finalizar solicitação"
              >
                {loadingAcao === "finalizar" ? "Finalizando..." : "Finalizar"}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">SKU</th>
                <th className="text-left p-2">Produto</th>
                <th className="text-left p-2">Solicitado</th>
                <th className="text-left p-2">Reservado</th>
              </tr>
            </thead>
            <tbody>
              {data.itens.map((it) => (
                <tr key={it.itemId} className="border-t">
                  <td className="p-2">{it.sku}</td>
                  <td className="p-2">{it.nome}</td>
                  <td className="p-2">{it.quantidade}</td>
                  <td className="p-2">{it.reservado}</td>
                </tr>
              ))}
              {data.itens.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500 italic">
                    Sem itens.
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
