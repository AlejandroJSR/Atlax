"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import AppSidebar from "@/components/AppSidebar";

const menuItems = [
  { icon: "book", label: "Mi programa", href: "/alumnos", exact: true },
  { icon: "calculator", label: "Calculadora de riesgo", href: "/alumnos/calculadora" },
  { icon: "calendar", label: "Calendario económico", href: "/alumnos/calendario" },
];

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
    <div className="min-h-screen bg-bg text-ink">
      <AppSidebar
        items={menuItems}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onLogout={logout}
        area="Campus"
      />
      <main className={`isolate min-w-0 px-4 pb-8 pt-20 transition-[margin] duration-200 sm:px-6 lg:px-10 lg:pt-8 ${sidebarOpen ? "lg:ml-60" : "lg:ml-16"}`}>
        {children}
      </main>
    </div>
  );
}
