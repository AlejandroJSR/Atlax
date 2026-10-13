"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/firebase";

const menuItems = [
  { icon: "📄", label: "Cursos Vendidos", href: "/admin/cursos-vendidos" },
  { icon: "📚", label: "Administrar Cursos", href: "/admin/administrar-cursos" },
  { icon: "👥", label: "Usuarios", href: "/admin/usuarios" },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  // --- Verificar sesión activa ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/"); // si no hay sesión, enviar a landing
      }
    });
    return () => unsub();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth); // cerrar sesión de Firebase
    sessionStorage.removeItem("logueado");
    router.push("/"); // redirigir a landing
  };

  return (
    <div className="flex min-h-screen bg-[#f7f8fa] relative">
      {/* SIDEBAR */}
      <aside
        className={`
          flex flex-col bg-[#2d249c] text-white shadow-lg transition-all duration-300
          ${sidebarOpen ? "w-56" : "w-12"}
          min-h-screen relative
        `}
        style={{ zIndex: 20 }}
      >
        <div className="flex items-center h-16 px-4 border-b border-[#251e70]">
          <span
            className={`font-extrabold text-xl tracking-wide transition-opacity duration-150 ${
              sidebarOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            {sidebarOpen && "ATLAX"}
          </span>
        </div>
        <nav className="flex-1 flex flex-col gap-1 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg font-semibold
                hover:bg-[#241d74] transition
                ${sidebarOpen ? "" : "justify-center"}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span
                className={`transition-opacity duration-200 ${
                  sidebarOpen ? "opacity-100 ml-2" : "opacity-0 ml-0"
                } whitespace-nowrap`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
        <button
          className={`
            absolute top-1/2 right-[-20px] -translate-y-1/2 z-50
            bg-white border-2 border-[#2d249c]
            rounded-full shadow-md flex items-center justify-center
            w-10 h-10 hover:bg-[#edeafc] transition
          `}
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label={sidebarOpen ? "Colapsar menú" : "Expandir menú"}
        >
          <svg
            className={`w-6 h-6 text-[#2d249c] transition-transform duration-200 ${
              sidebarOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div
          className={`px-4 py-4 border-t border-[#251e70] flex items-center justify-${
            sidebarOpen ? "start" : "center"
          }`}
        >
          {sidebarOpen ? (
            <button
              className="bg-white text-[#2d249c] rounded px-3 py-2 font-bold text-xs hover:bg-violet-100 transition flex items-center gap-2"
              onClick={handleLogout}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="#2d249c"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                />
              </svg>
              Salir
            </button>
          ) : (
            <button
              className="bg-white text-[#2d249c] rounded-full p-2 hover:bg-violet-100 transition flex items-center justify-center"
              title="Salir"
              onClick={handleLogout}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="#2d249c"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                />
              </svg>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-x-auto transition-all duration-300 relative z-10">
        {children}
      </main>
    </div>
  );
}
