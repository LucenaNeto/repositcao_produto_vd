
export function getTokenFromHeader(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token ausente");
  }
  return authHeader.split(" ")[1];
}
