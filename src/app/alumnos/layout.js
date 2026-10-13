"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase";

export default function AlumnosLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const alumno = JSON.parse(sessionStorage.getItem("alumno"));
    if (!alumno) router.push("/");
  }, [router]);

  const logout = async () => {
    try {
      await signOut(auth); // Cierra sesión real en Firebase
      sessionStorage.removeItem("alumno");
      router.push("/"); // Redirige a la landing
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-[#111113] to-[#1b154f] text-white">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-56" : "w-14"} 
                    fixed top-0 left-0 h-screen
                    flex flex-col justify-between 
                    bg-gradient-to-b from-[#1b154f] to-[#2d249c] 
                    border-r border-white/10 
                    transition-all duration-300 z-40`}
      >
        {/* Logo y Menú */}
        <div>
          <div className="py-6 px-4 text-2xl font-bold tracking-wide">
            {sidebarOpen ? "ATLAX" : ""}
          </div>
          <nav className="px-2 space-y-2">
            <a
              href="/alumnos"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-[#4137c6]"
            >
              <i className="fa fa-book"></i>
              {sidebarOpen && <span>Cursos adquiridos</span>}
            </a>
            <a
              href="/alumnos/calculadora"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-[#4137c6]"
            >
              <i className="fa fa-calculator"></i>
              {sidebarOpen && <span>Calculadora</span>}
            </a>
            <a
              href="/alumnos/calendario"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-[#4137c6]"
            >
              <i className="fa fa-calendar"></i>
              {sidebarOpen && <span>Calendario Económico</span>}
            </a>
          </nav>
        </div>

        {/* Botón de salir */}
        <div
          className={`px-4 py-4 border-t border-[#251e70] flex items-center justify-${
            sidebarOpen ? "start" : "center"
          }`}
        >
          <button
            className="bg-white text-[#2d249c] rounded px-3 py-2 font-bold text-xs 
                       hover:bg-violet-100 transition flex items-center gap-2"
            onClick={logout}
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
            {sidebarOpen && "Salir"}
          </button>
        </div>

        {/* Botón de colapsar */}
        <button
          className="absolute top-1/2 right-[-20px] -translate-y-1/2 z-50
                     bg-white border-2 border-[#2d249c]
                     rounded-full shadow-md w-10 h-10 
                     flex items-center justify-center
                     hover:bg-[#edeafc] transition"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label={sidebarOpen ? "Colapsar menú" : "Expandir menú"}
        >
          <svg
            className={`w-4 h-4 text-[#2d249c] transition-transform duration-200 ${
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
      </aside>

      {/* Contenido */}
      <main
        className={`p-8 transition-all duration-300 relative z-10 text-white 
                    ${sidebarOpen ? "ml-56" : "ml-14"}`}
      >
        {children}
      </main>
    </div>
  );
}
