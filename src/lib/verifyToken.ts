import * as jwt from "jsonwebtoken";

export function verifyToken(authorization?: string) {
  if (!authorization) throw new Error("Token ausente");

  const token = authorization.replace("Bearer ", "").trim();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    return payload;
  } catch {
    throw new Error("Token inválido ou expirado");
  }
}
