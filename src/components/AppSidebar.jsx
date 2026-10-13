"use client";

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
};

function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/**
 * Menú lateral compartido por /admin y /alumnos.
 * items: [{ href, label, icon }] — icon es una clave de ICONS.
 */
export default function AppSidebar({ items, open, onToggle, onLogout, area }) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface transition-[width] duration-200 ${
        open ? "w-60" : "w-16"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-line px-4">
        {open && (
          <Link href="/" className="flex items-center gap-2 font-mono text-base font-medium tracking-[0.2em] text-ink">
            <span className="inline-block h-2 w-2 rounded-[2px] bg-accent" aria-hidden="true" />
            ATLAX
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label={open ? "Colapsar menú" : "Expandir menú"}
        >
          <Icon name="collapse" className={`h-4 w-4 transition-transform ${open ? "" : "rotate-180"}`} />
        </button>
      </div>

      {open && area && (
        <p className="px-5 pb-1 pt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{area}</p>
      )}

      <nav className={`flex flex-1 flex-col gap-1 px-2 ${open && area ? "pt-1" : "pt-4"}`}>
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={open ? undefined : item.label}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                active ? "bg-accent/15 text-accent-soft" : "text-muted hover:bg-surface-2 hover:text-ink"
              } ${open ? "" : "justify-center"}`}
            >
              <Icon name={item.icon} />
              {open && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-2">
        <button
          type="button"
          onClick={onLogout}
          title={open ? undefined : "Cerrar sesión"}
          className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink ${
            open ? "" : "justify-center"
          }`}
        >
          <Icon name="logout" />
          {open && "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
