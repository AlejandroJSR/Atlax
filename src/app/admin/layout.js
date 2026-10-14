"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/firebase";
import AppSidebar from "@/components/AppSidebar";

const menuItems = [
  { icon: "receipt", label: "Ventas", href: "/admin/ventas" },
  { icon: "book", label: "Administrar planes", href: "/admin/planes" },
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
      <main className={`isolate min-w-0 px-4 pb-8 pt-20 transition-[margin] duration-200 sm:px-6 lg:px-10 lg:pt-8 ${sidebarOpen ? "lg:ml-60" : "lg:ml-16"}`}>
        {children}
      </main>
    </div>
  );
}
