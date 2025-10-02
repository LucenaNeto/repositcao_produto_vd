"use client";

import { toast } from "sonner";
import React, { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";

type Produto = { id: number; sku: string; nome: string; unidade: string };

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ProdutoSchema = z.object({
  sku: z.string().min(1, "SKU é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
});
type ProdutoInput = z.infer<typeof ProdutoSchema>;

export default function ProdutosPage() {
  const { data: produtos, error, mutate } = useSWR<Produto[]>(
    "/api/produtos",
    fetcher
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null); // corrigido

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProdutoInput>({ resolver: zodResolver(ProdutoSchema) });

  async function onSubmit(data: ProdutoInput) {
    const url = editing ? `/api/produtos/${editing.id}` : "/api/produtos";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      reset();
      setEditing(null);
      setOpen(false);
      mutate();
      toast.success(editing ? "Produto atualizado!" : "Produto criado!");
    } else {
      const err = await res.json();
      toast.error(err.error || "Erro ao salvar produto");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deseja excluir este produto?")) return;
    setLoadingId(id);
    const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    setLoadingId(null);
    if (res.ok) {
      mutate();
      toast.success("Produto excluído!");
    } else {
      toast.error("Erro ao excluir produto");
    }
  }

  if (error) return <div className="p-4">Erro: {String(error.message)}</div>;
  if (!produtos) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Produtos</h1>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button
              onClick={() => {
                setEditing(null);
                reset();
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Novo Produto
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 w-[400px] -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg space-y-4">
              <Dialog.Title className="text-lg font-bold">
                {editing ? "Editar Produto" : "Novo Produto"}
              </Dialog.Title>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <input
                    {...register("sku")}
                    placeholder="SKU"
                    defaultValue={editing?.sku}
                    className="border p-2 rounded w-full"
                  />
                  {errors.sku && (
                    <p className="text-red-500 text-sm">{errors.sku.message}</p>
                  )}
                </div>
                <div>
                  <input
                    {...register("nome")}
                    placeholder="Nome"
                    defaultValue={editing?.nome}
                    className="border p-2 rounded w-full"
                  />
                  {errors.nome && (
                    <p className="text-red-500 text-sm">{errors.nome.message}</p>
                  )}
                </div>
                <div>
                  <input
                    {...register("unidade")}
                    placeholder="Unidade"
                    defaultValue={editing?.unidade}
                    className="border p-2 rounded w-full"
                  />
                  {errors.unidade && (
                    <p className="text-red-500 text-sm">
                      {errors.unidade.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </button>
              </form>
              <Dialog.Close asChild>
                <button className="absolute top-2 right-2 text-gray-500 hover:text-black">
                  ✕
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Listagem */}
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
          {produtos?.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.sku}</td>
              <td className="p-2">{p.nome}</td>
              <td className="p-2">{p.unidade}</td>
              <td className="p-2 text-right space-x-2">
                <button
                  onClick={() => {
                    setEditing(p);
                    reset(p);
                    setOpen(true);
                  }}
                  className="text-blue-500 hover:underline disabled:text-gray-400"
                  disabled={loadingId === p.id}
                >
                  {loadingId === p.id ? "..." : "Editar"}
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-500 hover:underline disabled:text-gray-400"
                  disabled={loadingId === p.id}
                >
                  {loadingId === p.id ? "Excluindo..." : "Excluir"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
