// src/lib/fetchAuth.ts
import { useCallback } from "react";

export function getToken() {
  try {
    return localStorage.getItem("token") ?? "";
  } catch {
    return "";
  }
}

export function logout() {
  try {
    localStorage.removeItem("token");
  } catch {}
  const from = typeof window !== "undefined" ? window.location.pathname : "/";
  window.location.href = `/login?from=${encodeURIComponent(from)}`;
}

export async function fetchAuth(input: RequestInfo, init: RequestInit = {}) {
  const token = getToken();

  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(input, {
    ...init,
    headers,
    cache: "no-store",
    credentials: "same-origin",
  });

  if (res.status === 401) {
    logout();
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return res;
}

// 🔧 Hook para usar nas páginas
export function useFetchAuth() {
  const wrapped = useCallback(
    (input: RequestInfo, init: RequestInit = {}) => fetchAuth(input, init),
    []
  );
  return { fetchAuth: wrapped, logout, getToken };
}
