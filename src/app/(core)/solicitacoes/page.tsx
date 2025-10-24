"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { useFetchAuth } from "@/lib/fetchAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SolicitacoesPage() {
  const { usuario } = useAuth();
  const { fetchAuth } = useFetchAuth();
  const router = useRouter();

  const fetcher = async (url: string) => {
    const res = await fetchAuth(url);
    if (!res.ok) throw new Error("Erro ao carregar solicitações");
    return res.json();
  };

  const { data: rows, error, mutate } = useSWR("/api/solicitacoes", fetcher);

  const [finalizandoId, setFinalizandoId] = useState<number | null>(null);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);

  async function finalizarSolicitacao(id: number) {
    if (!confirm("Deseja realmente finalizar esta solicitação?")) return;
    try {
      setFinalizandoId(id);
      const res = await fetchAuth(`/api/solicitacoes/${id}/concluir`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao concluir");
      alert("✅ Solicitação finalizada com sucesso!");
      await mutate();
      router.refresh();
    } catch (err: any) {
      alert(`❌ ${err.message || "Erro desconhecido"}`);
    } finally {
      setFinalizandoId(null);
    }
  }

  async function cancelarSolicitacao(id: number) {
    if (!confirm("Confirma cancelar esta solicitação? As reservas serão liberadas.")) return;
    try {
      setCancelandoId(id);
      const res = await fetchAuth(`/api/solicitacoes/${id}/cancelar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cancelar");
      alert("🧹 Solicitação cancelada e reservas liberadas.");
      await mutate();
      router.refresh();
    } catch (err: any) {
      alert(`❌ ${err.message || "Erro desconhecido"}`);
    } finally {
      setCancelandoId(null);
    }
  }

  if (error) return <div className="p-6">Erro ao carregar solicitações.</div>;
  if (!rows) return <div className="p-6">Carregando...</div>;

  const podeCriar = usuario?.papel === "solicitante" || usuario?.papel === "admin";
  const podeFinalizar = usuario?.papel === "estoque" || usuario?.papel === "admin";
  const podeCancelar = ["solicitante", "estoque", "admin"].includes(usuario?.papel || "");

  return (
    <ProtectedRoute allow={["estoque", "admin", "solicitante"]}>
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Solicitações</h1>

          {podeCriar && (
            <Link href="/solicitacoes/novo" className="underline text-blue-600">
              Nova Solicitação
            </Link>
          )}
        </div>

        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Consultora</th>
                <th className="text-left p-2">Itens</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Criado em</th>
                <th className="text-left p-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.consultora ?? "-"}</td>
                  <td className="p-2">{r.itens}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        r.status === "aberta"
                          ? "bg-yellow-500"
                          : r.status === "cancelada"
                          ? "bg-gray-500"
                          : "bg-green-600"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-2">{r.criadoEm ?? "-"}</td>
                  <td className="p-2 text-center">
                    <div className="flex gap-3 justify-center">
                      <Link
                        href={`/solicitacoes/${r.id}`}
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        Abrir
                      </Link>

                      {r.status === "aberta" && podeCancelar && (
                        <button
                          onClick={() => cancelarSolicitacao(r.id)}
                          disabled={cancelandoId === r.id}
                          className={`px-2 py-1 rounded text-white ${
                            cancelandoId === r.id
                              ? "bg-gray-400"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                          title="Cancelar solicitação (libera reservas)"
                        >
                          {cancelandoId === r.id ? "Cancelando..." : "Cancelar"}
                        </button>
                      )}

                      {r.status === "aberta" && podeFinalizar && (
                        <button
                          onClick={() => finalizarSolicitacao(r.id)}
                          disabled={finalizandoId === r.id}
                          className={`px-2 py-1 rounded text-white ${
                            finalizandoId === r.id
                              ? "bg-gray-400"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {finalizandoId === r.id ? "Finalizando..." : "Finalizar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 p-4 italic">
                    Nenhuma solicitação encontrada.
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
