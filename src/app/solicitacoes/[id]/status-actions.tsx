"use client";

type Props = { id: number; statusAtual: string };

export default function StatusActions({ id, statusAtual }: Props) {
  async function change(to: string) {
    const res = await fetch(`/api/solicitacoes/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(`Erro: ${json.error || "falha"}`);
    } else {
      location.reload();
    }
  }

  return (
    <div className="flex items-center gap-2">
      {statusAtual === "aberta" && (
        <>
          <button
            onClick={() => change("separacao")}
            className="rounded bg-blue-600 text-white px-3 py-1"
          >
            Iniciar separação
          </button>
          <button
            onClick={() => change("cancelada")}
            className="rounded bg-gray-300 px-3 py-1"
          >
            Cancelar
          </button>
        </>
      )}

      {statusAtual === "separacao" && (
        <>
          <button
            onClick={() => change("concluida")}
            className="rounded bg-green-600 text-white px-3 py-1"
          >
            Concluir
          </button>
          <button
            onClick={() => change("cancelada")}
            className="rounded bg-gray-300 px-3 py-1"
          >
            Cancelar
          </button>
        </>
      )}

      {(statusAtual === "concluida" || statusAtual === "cancelada") && (
        <span className="text-sm text-gray-500">Fluxo encerrado.</span>
      )}
    </div>
  );
}
