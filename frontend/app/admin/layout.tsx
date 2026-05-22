"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clearToken } from "@/lib/api";

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getSnapshot = () => !!localStorage.getItem("mkteam_token");
const getServerSnapshot = () => false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const hasToken = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!isLoginPage && !localStorage.getItem("mkteam_token")) {
      router.replace("/admin/login");
    }
  }, [isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;
  if (!hasToken) return null;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <p className="font-bold text-sm">MK Team Paris</p>
          <p className="text-gray-400 text-xs">Portail staff</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/admin/dashboard">Dashboard</NavLink>
          <NavLink href="/admin/membres">Membres</NavLink>
        </nav>
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={() => {
              clearToken();
              router.push("/admin/login");
            }}
            className="w-full text-left text-sm text-gray-400 hover:text-white py-1.5 px-2 rounded"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-gray-50 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded px-3 py-2 transition"
    >
      {children}
    </Link>
  );
}
