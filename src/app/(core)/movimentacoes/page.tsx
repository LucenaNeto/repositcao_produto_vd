"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import * as XLSX from "xlsx";

type Movimentacao = {
  id: number;
  criadoEm: string;
  produto: string | null;
  tipo: "entrada" | "saida" | null;
  quantidade: number;
  solicitacaoId: number | null;
};

const fetcher = (url: string): Promise<Movimentacao[]> =>
  fetch(url).then((res) => res.json());

export default function MovimentacoesPage() {
  const { data: movimentacoes, error } = useSWR("/api/movimentacoes", fetcher);

  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroSolicitacao, setFiltroSolicitacao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 10;

  // Filtro
  const filtradas = useMemo(() => {
    if (!movimentacoes) return [];

    return movimentacoes.filter((m) => {
      const matchProduto =
        !filtroProduto ||
        m.produto?.toLowerCase().includes(filtroProduto.toLowerCase());
      const matchTipo =
        !filtroTipo || m.tipo?.toLowerCase().includes(filtroTipo.toLowerCase());
      const matchSolicitacao =
        !filtroSolicitacao ||
        String(m.solicitacaoId || "")
          .toLowerCase()
          .includes(filtroSolicitacao.toLowerCase());

      const dataMov = new Date(m.criadoEm);
      const inicio = dataInicio ? new Date(dataInicio) : null;
      const fim = dataFim ? new Date(dataFim) : null;

      const matchData =
        (!inicio || dataMov >= inicio) && (!fim || dataMov <= fim);

      return matchProduto && matchTipo && matchSolicitacao && matchData;
    });
  }, [
    movimentacoes,
    filtroProduto,
    filtroTipo,
    filtroSolicitacao,
    dataInicio,
    dataFim,
  ]);

  // Resumo
  const resumo = useMemo(() => {
    const entradas = filtradas
      .filter((m) => m.tipo === "entrada")
      .reduce((acc, m) => acc + m.quantidade, 0);

    const saidas = filtradas
      .filter((m) => m.tipo === "saida")
      .reduce((acc, m) => acc + m.quantidade, 0);

    const saldo = entradas - saidas;

    return { entradas, saidas, saldo };
  }, [filtradas]);

  if (error) return <div>Erro ao carregar movimentações.</div>;
  if (!movimentacoes) return <div>Carregando...</div>;

  // Paginação
  const totalPaginas = Math.ceil(filtradas.length / itensPorPagina);
  const inicioPaginacao = (pagina - 1) * itensPorPagina;
  const paginadas = filtradas.slice(
    inicioPaginacao,
    inicioPaginacao + itensPorPagina
  );

  // Exportações
  const exportarCSV = () => {
    const csv = [
      ["Data", "Produto", "Tipo", "Quantidade", "Solicitação"],
      ...movimentacoes.map((m) => [
        m.criadoEm,
        m.produto ?? "—",
        m.tipo ?? "—",
        m.quantidade,
        m.solicitacaoId ? `#${m.solicitacaoId}` : "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "movimentacoes.csv";
    link.click();
  };

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      movimentacoes.map((m) => ({
        Data: m.criadoEm,
        Produto: m.produto ?? "—",
        Tipo: m.tipo ?? "—",
        Quantidade: m.quantidade,
        Solicitação: m.solicitacaoId ? `#${m.solicitacaoId}` : "-",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimentações");
    XLSX.writeFile(wb, "movimentacoes.xlsx");
  };

  // ===================== JSX =====================
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">📦 Movimentações de Estoque</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Produto"
          className="border p-2 rounded"
          value={filtroProduto}
          onChange={(e) => setFiltroProduto(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos os Tipos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
        <input
          type="text"
          placeholder="Solicitação"
          className="border p-2 rounded"
          value={filtroSolicitacao}
          onChange={(e) => setFiltroSolicitacao(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />
      </div>

      {/* Exportação */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={exportarExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Exportar Excel
        </button>
        <button
          onClick={exportarCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Exportar CSV
        </button>
      </div>

      {/* Resumo */}
      <div className="flex flex-wrap gap-6 mb-4 text-lg font-semibold">
        <div className="text-green-700">
          🟢 Entradas: <span className="text-green-800">{resumo.entradas}</span>
        </div>
        <div className="text-red-700">
          🔴 Saídas: <span className="text-red-800">{resumo.saidas}</span>
        </div>
        <div
          className={`${
            resumo.saldo >= 0 ? "text-green-700" : "text-red-700"
          }`}
        >
          ⚖️ Saldo:{" "}
          <span
            className={`font-bold ${
              resumo.saldo >= 0 ? "text-green-800" : "text-red-800"
            }`}
          >
            {resumo.saldo}
          </span>
        </div>
      </div>

      {/* Tabela */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Data</th>
            <th className="p-2 border">Produto</th>
            <th className="p-2 border">Tipo</th>
            <th className="p-2 border">Quantidade</th>
            <th className="p-2 border">Solicitação</th>
          </tr>
        </thead>
        <tbody>
          {paginadas.map((m) => (
            <tr key={m.id}>
              <td className="p-2 border">{m.criadoEm}</td>
              <td className="p-2 border">{m.produto ?? "—"}</td>
              <td
                className={`p-2 border font-semibold text-center ${
                  m.tipo === "entrada"
                    ? "text-green-600"
                    : m.tipo === "saida"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {m.tipo ? m.tipo.toUpperCase() : "N/A"}
              </td>
              <td className="p-2 border text-right">{m.quantidade}</td>
              <td className="p-2 border text-center">
                {m.solicitacaoId ? `#${m.solicitacaoId}` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginação */}
      <div className="flex items-center justify-center mt-4 gap-3">
        <button
          disabled={pagina === 1}
          onClick={() => setPagina((p) => Math.max(p - 1, 1))}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          ← Anterior
        </button>
        <span>
          Página {pagina} de {totalPaginas}
        </span>
        <button
          disabled={pagina === totalPaginas}
          onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
