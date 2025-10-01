"use client";

import React from "react";
import useSWR from "swr";

type Consultora = { id: number; codigo: string; nome: string };

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Erro na requisição");
    return res.json();
  });

export default function ConsultorasPage() {
  const { data: consultoras, error, mutate } = useSWR<Consultora[]>(
    "/api/consultoras",
    fetcher
  );

  async function handleDelete(id: number) {
    if (!confirm("Deseja realmente excluir esta consultora?")) return;
    const res = await fetch(`/api/consultoras/${id}`, { method: "DELETE" });
    if (res.ok) mutate();
    else alert("Erro ao excluir consultora");
  }

  if (error) return <div className="p-4">Erro: {String(error.message)}</div>;
  if (!consultoras) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Consultoras</h1>
      <table className="table-auto w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Código</th>
            <th className="p-2 text-left">Nome</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {consultoras.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.codigo}</td>
              <td className="p-2">{c.nome}</td>
              <td className="p-2 text-right">
                <button
                  onClick={() => handleDelete(c.id)}
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
