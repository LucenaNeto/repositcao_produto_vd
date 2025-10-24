"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  allow,
  children,
}: {
  allow?: string[];
  children: React.ReactNode;
}) {
  const { usuario } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!usuario) {
      router.push("/login");
    }
  }, [usuario, router]);

  if (!usuario) {
    return <div className="p-6 text-gray-500">Verificando autenticação...</div>;
  }

  if (allow && !allow.includes(usuario.papel)) {
    return <div className="p-6 text-red-600">Acesso negado.</div>;
  }

  return <>{children}</>;
}
