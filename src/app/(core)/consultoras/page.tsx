"use client";

import { toast } from "sonner";
import React, { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";

type Consultora = { id: number; codigo: string; nome: string };

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ConsultoraSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
});
type ConsultoraInput = z.infer<typeof ConsultoraSchema>;

export default function ConsultorasPage() {
  const { data: consultoras, error, mutate } = useSWR<Consultora[]>(
    "/api/consultoras",
    fetcher
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Consultora | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConsultoraInput>({ resolver: zodResolver(ConsultoraSchema) });

  async function onSubmit(data: ConsultoraInput) {
    const url = editing ? `/api/consultoras/${editing.id}` : "/api/consultoras";
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
      toast.success(editing ? "Consultora atualizada!" : "Consultora criada!");
    } else {
      const err = await res.json();
      toast.error(err.error || "Erro ao salvar consultora");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deseja excluir esta consultora?")) return;

    const res = await fetch(`/api/consultoras/${id}`, { method: "DELETE" });

    if (res.ok) {
      mutate();
      toast.success("Consultora excluída!");
    } else {
      toast.error("Erro ao excluir consultora");
    }
  }

  if (error) return <div className="p-4">Erro: {String(error.message)}</div>;
  if (!consultoras) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Consultoras</h1>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button
              onClick={() => {
                setEditing(null);
                reset();
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Nova Consultora
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 w-[400px] -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg space-y-4">
              <Dialog.Title className="text-lg font-bold">
                {editing ? "Editar Consultora" : "Nova Consultora"}
              </Dialog.Title>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <input
                    {...register("codigo")}
                    placeholder="Código"
                    defaultValue={editing?.codigo}
                    className="border p-2 rounded w-full"
                  />
                  {errors.codigo && (
                    <p className="text-red-500 text-sm">
                      {errors.codigo.message}
                    </p>
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
                    <p className="text-red-500 text-sm">
                      {errors.nome.message}
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
              <td className="p-2 text-right space-x-2">
                <button
                  onClick={() => {
                    setEditing(c);
                    reset(c);
                    setOpen(true);
                  }}
                  className="text-blue-500 hover:underline"
                >
                  Editar
                </button>
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
