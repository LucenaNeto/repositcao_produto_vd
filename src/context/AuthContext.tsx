"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  papel: string;
};

type AuthContextType = {
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  token: null,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  // 🔄 Restaura login salvo no navegador
  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      const parsed = JSON.parse(saved);
      setUsuario(parsed.usuario);
      setToken(parsed.token);
    }
  }, []);

  async function login(email: string, senha: string): Promise<boolean> {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no login");

      setUsuario(data.usuario);
      setToken(data.token);
      localStorage.setItem("auth", JSON.stringify(data));

      router.push("/"); // vai pra home após login
      return true;
    } catch (err: any) {
      alert(err.message || "Erro no login");
      return false;
    }
  }

  function logout() {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem("auth");
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
