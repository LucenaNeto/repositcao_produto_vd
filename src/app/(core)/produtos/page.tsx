"use client";

import React from "react";
import useSWR from "swr";

type Produto = { id: number; sku: string; nome: string; unidade: string };

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Erro na requisição");
    return res.json();
  });

export default function ProdutosPage() {
  const { data: produtos, error, mutate } = useSWR<Produto[]>("/api/produtos", fetcher);

  async function handleDelete(id: number) {
    if (!confirm("Deseja realmente excluir este produto?")) return;
    const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    if (res.ok) mutate();
    else alert("Erro ao excluir produto");
  }

  if (error) return <div className="p-4">Erro: {String(error.message)}</div>;
  if (!produtos) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Produtos</h1>
      <table className="table-auto w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">SKU</th>
            <th className="p-2 text-left">Nome</th>
            <th className="p-2 text-left">Unidade</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.sku}</td>
              <td className="p-2">{p.nome}</td>
              <td className="p-2">{p.unidade}</td>
              <td className="p-2 text-right">
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-500 hover:underline"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
