"use client";

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MovimentacoesPage() {
  const { data, error, isLoading } = useSWR("/api/movimentacoes", fetcher);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroProduto, setFiltroProduto] = useState("");

  if (isLoading) return <p className="p-4">Carregando movimentações...</p>;
  if (error) return <p className="p-4 text-red-600">Erro ao carregar dados</p>;

  const movimentacoes = data ?? [];

  // 🔍 Filtros aplicados localmente
  const filtradas = movimentacoes.filter((m: any) => {
    const tipoOk =
      filtroTipo === "todos" || m.tipo?.toLowerCase() === filtroTipo;
    const produtoOk = m.produtoNome
      ?.toLowerCase()
      .includes(filtroProduto.toLowerCase());
    return tipoOk && produtoOk;
  });

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Movimentações de Estoque</h1>

      {/* 🔎 Barra de Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar produto..."
          value={filtroProduto}
          onChange={(e) => setFiltroProduto(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-56 focus:ring focus:ring-blue-200"
        />

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="todos">Todos os tipos</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>

        <button
          onClick={() => {
            setFiltroProduto("");
            setFiltroTipo("todos");
          }}
          className="border rounded px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200"
        >
          Limpar filtros
        </button>
      </div>

      {/* 🧾 Tabela */}
      <table className="table-auto w-full border text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Data</th>
            <th className="p-2 border">Produto</th>
            <th className="p-2 border">Tipo</th>
            <th className="p-2 border text-right">Quantidade</th>
            <th className="p-2 border text-center">Solicitação</th>
          </tr>
        </thead>
        <tbody>
          {filtradas.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                Nenhuma movimentação encontrada.
              </td>
            </tr>
          ) : (
            filtradas.map((m: any) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="p-2 border">
                  {new Date(m.criadoEm).toLocaleString("pt-BR")}
                </td>
                <td className="p-2 border">{m.produtoNome ?? "—"}</td>
                <td
                  className={`p-2 border font-semibold ${
                    m.tipo === "entrada" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {m.tipo ? m.tipo.toUpperCase() : "N/A"}
                </td>
                <td className="p-2 border text-right">{m.quantidade}</td>
                <td className="p-2 border text-center">
                  {m.solicitacaoId ? `#${m.solicitacaoId}` : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
