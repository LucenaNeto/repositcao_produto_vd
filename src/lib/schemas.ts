import { z } from "zod";

export const NovaSolicitacaoSchema = z.object({
  consultoraCodigo: z.string().min(1),
  itens: z.array(
    z.object({
      sku: z.string().min(1),
      qtd: z.number().int().positive(),
    })
  ).min(1),
});

export type NovaSolicitacaoInput = z.infer<typeof NovaSolicitacaoSchema>;
