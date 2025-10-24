"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { useFetchAuth } from "@/lib/fetchAuth"; // Adicionado
import ProtectedRoute from "@/components/ProtectedRoute"; // Adicionado

// Tipos e Schemas permanecem os mesmos
type Produto = { id: number; sku: string; nome: string; unidade: string };

const ProdutoSchema = z.object({
  sku: z.string().min(1, "SKU é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
});
type ProdutoInput = z.infer<typeof ProdutoSchema>;

export default function ProdutosPage() {
  // 1. Hook de autenticação
  const { fetchAuth } = useFetchAuth();

  // 2. Fetcher agora usa o fetchAuth para incluir tokens/credenciais
  const fetcher = async (url: string) => {
    const res = await fetchAuth(url);
    if (!res.ok) throw new Error("Erro ao carregar produtos");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  const { data: produtos = [], error, mutate } = useSWR<Produto[]>("/api/produtos", fetcher);
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProdutoInput>({ resolver: zodResolver(ProdutoSchema) });

  async function onSubmit(data: ProdutoInput) {
    const url = editing ? `/api/produtos/${editing.id}` : "/api/produtos";
    const method = editing ? "PATCH" : "POST";

    try {
      // 3. Ação de salvar também usa fetchAuth
      const res = await fetchAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar produto");
      }

      toast.success(editing ? "Produto atualizado!" : "Produto criado!");
      reset();
      setEditing(null);
      setOpen(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar produto");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deseja excluir este produto?")) return;
    setLoadingId(id);
    try {
      // 3. Ação de deletar também usa fetchAuth
      const res = await fetchAuth(`/api/produtos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir produto");
      toast.success("Produto excluído!");
      mutate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  if (error) return <div className="p-4 text-red-600">Erro ao carregar produtos.</div>;
  if (!produtos) return <div className="p-4">Carregando...</div>;

  // 4. Toda a página é envolvida pelo ProtectedRoute
  return (
    <ProtectedRoute allow={["admin", "estoque"]}>
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
                  {/* ... o resto do formulário permanece igual ... */}
                  <div>
                    <input {...register("sku")} placeholder="SKU" defaultValue={editing?.sku} className="border p-2 rounded w-full" />
                    {errors.sku && <p className="text-red-500 text-sm">{errors.sku.message}</p>}
                  </div>
                  <div>
                    <input {...register("nome")} placeholder="Nome" defaultValue={editing?.nome} className="border p-2 rounded w-full" />
                    {errors.nome && <p className="text-red-500 text-sm">{errors.nome.message}</p>}
                  </div>
                  <div>
                    <input {...register("unidade")} placeholder="Unidade" defaultValue={editing?.unidade} className="border p-2 rounded w-full" />
                    {errors.unidade && <p className="text-red-500 text-sm">{errors.unidade.message}</p>}
                  </div>
                  <button type="submit" disabled={isSubmitting} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </button>
                </form>
                <Dialog.Close asChild>
                  <button className="absolute top-2 right-2 text-gray-500 hover:text-black">✕</button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <table className="table-auto w-full border">
            {/* ... o resto da tabela permanece igual ... */}
        </table>
      </div>
    </ProtectedRoute>
  );
}