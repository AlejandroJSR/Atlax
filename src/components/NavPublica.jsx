"use client";
import { useState } from "react";
import Link from "next/link";
import MenuHerramientas, { GrupoHerramientasMovil } from "@/components/MenuHerramientas";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/#faq", label: "Preguntas" },
  { href: "/#contacto", label: "Contacto" },
];

// "Acceso alumnos" vuelve a la landing con ?acceso, que abre el login.
const ACCESO = "/?acceso=1";

/** Menú de las páginas públicas de herramientas (/calculadora, /calendario). */
export default function NavPublica() {
  const [abierto, setAbierto] = useState(false);

  return (
    <nav className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Link href="/" className="mr-auto flex items-center gap-2 font-mono text-lg font-medium tracking-[0.2em] text-ink transition-opacity hover:opacity-80">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-accent" aria-hidden="true" />
          ATLAX
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:text-ink">
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <MenuHerramientas />
          </li>
          <li className="ml-3">
            <Link href={ACCESO} className="btn-secondary btn-sm rounded-lg">
              Acceso alumnos
            </Link>
          </li>
        </ul>

        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-ink lg:hidden"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={abierto}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {abierto && (
        <div className="flex flex-col border-t border-line px-4 pb-5 pt-2 lg:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setAbierto(false)} className="border-b border-line py-3.5 text-ink transition-colors hover:text-accent-soft">
              {l.label}
            </Link>
          ))}
          <GrupoHerramientasMovil onNavegar={() => setAbierto(false)} />
          <Link href={ACCESO} className="btn-primary mt-4">
            Acceso alumnos
          </Link>
        </div>
      )}
    </nav>
  );
}
