"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/solicitacoes", label: "Solicitações" },
  { href: "/estoques", label: "Estoques" },
  { href: "/movimentacoes", label: "Movimentações" },
  { href: "/produtos", label: "Produtos" }, // lista simples que já temos
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="font-bold">Reposição VD</div>
        <nav className="flex gap-3 text-sm">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "px-3 py-1.5 rounded hover:bg-gray-100",
                  active && "bg-gray-900 text-white hover:bg-gray-900"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
