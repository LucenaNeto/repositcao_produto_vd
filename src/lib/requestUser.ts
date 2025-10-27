// src/lib/requestUser.ts
export type RequestUser = {
  id: number;
  nome: string;
  email: string;
  papel: string;
};

export function getRequestUser(req: Request): RequestUser {
  const raw = req.headers.get("x-user");
  if (!raw) {
    throw new Error("Não autenticado (header x-user ausente).");
  }
  return JSON.parse(raw) as RequestUser;
}
