"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Iconos de línea (24px, stroke) para el menú lateral.
const ICONS = {
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6",
  book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13",
  users: "M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 19v-1a4 4 0 00-3-3.87M16 3.13a3.5 3.5 0 010 6.75",
  calculator: "M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01",
  calendar: "M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM4 10h16M8 3v4M16 3v4",
  logout: "M15 17l5-5-5-5M20 12H9M12 21H5a1 1 0 01-1-1V4a1 1 0 011-1h7",
  collapse: "M15 18l-6-6 6-6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
};

function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-mono text-base font-medium tracking-[0.2em] text-ink">
      <span className="inline-block h-2 w-2 rounded-[2px] bg-accent" aria-hidden="true" />
      ATLAX
    </Link>
  );
}

/**
 * Menú lateral compartido por /admin y /alumnos.
 * items: [{ href, label, icon }] — icon es una clave de ICONS.
 * En escritorio (lg+) es fijo y colapsable con `open`; debajo de lg es un cajón
 * que se abre desde la barra superior y no ocupa ancho del contenido.
 */
export default function AppSidebar({ items, open, onToggle, onLogout, area }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const expanded = open || mobileOpen;

  // Cerrar el cajón al navegar.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Barra superior en móvil y tablet */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-ink hover:bg-surface-2"
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-surface transition-[width,transform] duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${expanded ? "w-64 lg:w-60" : "w-64 lg:w-16"}`}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-4 lg:h-16">
          {expanded && <Logo />}
          <button
            type="button"
            onClick={onToggle}
            className="hidden h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink lg:flex"
            aria-label={open ? "Colapsar menú" : "Expandir menú"}
          >
            <Icon name="collapse" className={`h-4 w-4 transition-transform ${open ? "" : "rotate-180"}`} />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink lg:hidden"
            aria-label="Cerrar menú"
          >
            <Icon name="close" />
          </button>
        </div>

        {expanded && area && (
          <p className="px-5 pb-1 pt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{area}</p>
        )}

        <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto px-2 ${expanded && area ? "pt-1" : "pt-4"}`}>
          {items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={expanded ? undefined : item.label}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                  active ? "bg-accent/15 text-accent-soft" : "text-muted hover:bg-surface-2 hover:text-ink"
                } ${expanded ? "" : "justify-center"}`}
              >
                <Icon name={item.icon} />
                {expanded && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={onLogout}
            title={expanded ? undefined : "Cerrar sesión"}
            className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink ${
              expanded ? "" : "justify-center"
            }`}
          >
            <Icon name="logout" />
            {expanded && "Cerrar sesión"}
          </button>
        </div>
      </aside>
    </>
  );
}
