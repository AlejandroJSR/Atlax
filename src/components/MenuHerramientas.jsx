"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Herramientas gratuitas: una sola lista para el menú de la landing, el menú móvil y las páginas públicas.
export const HERRAMIENTAS = [
  {
    href: "/calculadora",
    titulo: "Calculadora de riesgo",
    texto: "Cuántos lotes operar según tu stop y tu % de riesgo.",
    icono: "M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01",
  },
  {
    href: "/calendario",
    titulo: "Calendario económico",
    texto: "Noticias del día con previsión y dato real al publicarse.",
    icono: "M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM4 10h16M8 3v4M16 3v4",
  },
];

function Icono({ d, className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Flecha({ abierto }) {
  return (
    <svg className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Menú desplegable de escritorio: "Herramientas ▾". */
export default function MenuHerramientas({ className = "" }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  // Cerrar con clic afuera o Escape.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => ref.current && !ref.current.contains(e.target) && setAbierto(false);
    const esc = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-haspopup="true"
        className={`flex items-center gap-1 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-surface-2 hover:text-ink ${abierto ? "text-ink" : "text-muted"}`}
      >
        Herramientas
        <Flecha abierto={abierto} />
      </button>
      {abierto && (
        <div className="animate-fadein absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-line bg-surface p-2 shadow-2xl">
          {HERRAMIENTAS.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              onClick={() => setAbierto(false)}
              className="flex gap-3 rounded-md p-3 transition-colors hover:bg-surface-2"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-accent/15 text-accent-soft">
                <Icono d={h.icono} />
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">{h.titulo}</span>
                <span className="block text-xs leading-relaxed text-muted">{h.texto}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Versión para el menú móvil: grupo plegable con las herramientas como subítems. */
export function GrupoHerramientasMovil({ onNavegar }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between py-3.5 text-left text-ink transition-colors hover:text-accent-soft"
      >
        Herramientas
        <Flecha abierto={abierto} />
      </button>
      {abierto && (
        <div className="pb-2">
          {HERRAMIENTAS.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              onClick={onNavegar}
              className="flex items-center gap-3 rounded-md py-2.5 pl-3 text-muted hover:text-ink"
            >
              <Icono d={h.icono} className="h-4 w-4 text-accent-soft" />
              {h.titulo}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
