"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/firebase";
import AppSidebar from "@/components/AppSidebar";

const menuItems = [
  { icon: "receipt", label: "Cursos vendidos", href: "/admin/cursos-vendidos" },
  { icon: "book", label: "Administrar cursos", href: "/admin/administrar-cursos" },
  { icon: "users", label: "Usuarios", href: "/admin/usuarios" },
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
    <div className="min-h-screen bg-bg text-ink">
      <AppSidebar
        items={menuItems}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onLogout={handleLogout}
        area="Administración"
      />
      <main className={`min-w-0 px-6 py-8 transition-[margin] duration-200 md:px-10 ${sidebarOpen ? "ml-60" : "ml-16"}`}>
        {children}
      </main>
    </div>
  );
}
