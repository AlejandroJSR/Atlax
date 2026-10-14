"use client";
import { useEffect, useRef, useState } from "react";
import { montarWidgetTradingView } from "@/lib/tradingview";

// Calendario económico: widget oficial de TradingView (gratis, con dato real al salir la noticia)
// envuelto con filtros propios. Los horarios salen en la zona horaria del navegador del alumno.

const DIVISAS = [
  { codigo: "USD", pais: "us" },
  { codigo: "EUR", pais: "eu" },
  { codigo: "GBP", pais: "gb" },
  { codigo: "JPY", pais: "jp" },
  { codigo: "CHF", pais: "ch" },
  { codigo: "CAD", pais: "ca" },
  { codigo: "AUD", pais: "au" },
  { codigo: "NZD", pais: "nz" },
  { codigo: "CNY", pais: "cn" },
];

// Mismo criterio que la escala de riesgo: color + palabra, nunca solo color.
const IMPACTOS = [
  { id: "alto", texto: "Alto", filtro: "1", color: "#ff5c5c" },
  { id: "medio", texto: "Alto y medio", filtro: "0,1", color: "#f5b041" },
  { id: "todos", texto: "Todos", filtro: "-1,0,1", color: "#9aa3ae" },
];

// Por defecto se ven todos los eventos: el impacto se lee en las barras de cada fila (ver leyenda).
const PREDETERMINADO = { divisas: ["USD", "EUR", "GBP"], impacto: "todos", zoom: 0.75 };

// Zoom del widget cuando hay espacio, y ancho desde el cual el widget usa su modo tabla
// (por debajo apila cada evento con etiquetas propias P:/A:). Medido: 700px apila, 760px tabla.
// Densidad ajustable por el alumno (cada pantalla y zoom del navegador es distinto).
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1;
const ZOOM_PASO = 0.05;
const ANCHO_TABLA = 760;
const ANCHO_TABLA_AMPLIA = 1212; // medido: 1210px diseño normal, 1215px diseño amplio

/** Réplica de las barras de impacto del widget, para la leyenda. */
function BarrasImpacto({ n }) {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={i * 4} y={6 - i * 3} width="2.5" height={4 + i * 3} rx="0.5" fill={i < n ? "#2962ff" : "#4a4e5a"} />
      ))}
    </svg>
  );
}
const CLAVE = "atlax.calendario";

function leerPreferencias() {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE));
    if (p && Array.isArray(p.divisas) && p.divisas.length && IMPACTOS.some((i) => i.id === p.impacto)) {
      const zoom = p.zoom >= ZOOM_MIN && p.zoom <= ZOOM_MAX ? p.zoom : PREDETERMINADO.zoom;
      return { ...p, zoom };
    }
  } catch {
    /* sin almacenamiento disponible: se usan los valores por defecto */
  }
  return PREDETERMINADO;
}

function WidgetEventos({ paises, importancia, intento, onEstado }) {
  const ref = useRef(null);

  useEffect(() => {
    onEstado("cargando");
    const desmontar = montarWidgetTradingView(
      ref.current,
      "https://s3.tradingview.com/external-embedding/embed-widget-events.js",
      { colorTheme: "dark", isTransparent: true, locale: "es", countryFilter: paises, importanceFilter: importancia, width: "100%", height: "100%" },
      { alto: "100%", onIframeListo: () => onEstado("listo"), onError: () => onEstado("error") }
    );
    const demora = setTimeout(() => onEstado((e) => (e === "cargando" ? "lento" : e)), 15000);
    return () => {
      clearTimeout(demora);
      desmontar();
    };
  }, [paises, importancia, intento, onEstado]);

  return <div ref={ref} className="h-full" />;
}

export default function CalendarioEconomico() {
  const [pref, setPref] = useState(PREDETERMINADO);
  const [cargadas, setCargadas] = useState(false);
  const [estado, setEstado] = useState("cargando"); // cargando | listo | lento | error
  const [intento, setIntento] = useState(0);
  const [zona, setZona] = useState("");

  // Ancho real del panel: decide el zoom y si el widget está en modo tabla (para mostrar títulos).
  const panelRef = useRef(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAncho(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // En el celular no se achica: ahí el widget ya apila los eventos con etiquetas y achicarlo lo haría ilegible.
  const escala = ancho >= 700 ? pref.zoom : 1;
  const cambiarZoom = (delta) =>
    setPref((p) => ({ ...p, zoom: Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, p.zoom + delta)) * 100) / 100 }));
  const modoTabla = ancho > 0 && ancho / escala >= ANCHO_TABLA;
  // Desde ~1212px el widget agrega el nombre del país y corre impacto y evento a la derecha.
  const modoAncho = ancho / escala >= ANCHO_TABLA_AMPLIA;

  // Preferencias y zona horaria solo existen en el navegador.
  useEffect(() => {
    setPref(leerPreferencias());
    setZona(Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " "));
    setCargadas(true);
  }, []);

  useEffect(() => {
    if (!cargadas) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(pref));
    } catch {
      /* ignorar: es solo una comodidad */
    }
  }, [pref, cargadas]);

  const alternarDivisa = (codigo) =>
    setPref((p) => {
      const activa = p.divisas.includes(codigo);
      if (activa && p.divisas.length === 1) return p; // siempre queda al menos una
      return { ...p, divisas: activa ? p.divisas.filter((d) => d !== codigo) : [...p.divisas, codigo] };
    });

  const paises = DIVISAS.filter((d) => pref.divisas.includes(d.codigo)).map((d) => d.pais).join(",");
  const importancia = IMPACTOS.find((i) => i.id === pref.impacto).filtro;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* FILTROS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
        <div role="radiogroup" aria-label="Impacto" className="grid flex-none grid-cols-3 rounded-md border border-line bg-surface p-1 sm:inline-grid">
          {IMPACTOS.map((i) => {
            const activo = pref.impacto === i.id;
            return (
              <button
                key={i.id}
                type="button"
                role="radio"
                aria-checked={activo}
                onClick={() => setPref((p) => ({ ...p, impacto: i.id }))}
                className={`flex h-9 items-center justify-center gap-1.5 rounded px-2.5 text-sm font-medium transition-colors ${
                  activo ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: i.color }} />
                <span className="whitespace-nowrap">{i.texto}</span>
              </button>
            );
          })}
        </div>

        <div className="-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 pb-0.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0" role="group" aria-label="Divisas">
          {DIVISAS.map((d) => {
            const activa = pref.divisas.includes(d.codigo);
            return (
              <button
                key={d.codigo}
                type="button"
                onClick={() => alternarDivisa(d.codigo)}
                aria-pressed={activa}
                className={`h-9 flex-none rounded-md border px-2.5 font-mono text-sm font-medium transition-colors ${
                  activa ? "border-accent bg-accent/15 text-accent-soft" : "border-line text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {d.codigo}
              </button>
            );
          })}
        </div>

      </div>

      {/* CALENDARIO */}
      <div ref={panelRef} className="panel relative flex min-h-[300px] flex-1 flex-col overflow-hidden px-3 pt-3">
        {modoTabla && (
          // Títulos propios: el widget no los tiene. Posiciones medidas sobre el widget en modo tabla
          // (hora/país/impacto/evento fijas en px desde la izquierda; valores en % desde la derecha).
          <div className="relative h-8 flex-none rounded-md bg-surface-2 font-mono text-[11px] uppercase tracking-wider text-muted" aria-hidden="true">
            <span className="absolute top-2" style={{ left: 18 * escala }}>Hora</span>
            <span className="absolute top-2" style={{ left: 92 * escala }}>País</span>
            <span className="absolute top-2" style={{ left: (modoAncho ? 262 : 140) * escala }}>Imp.</span>
            <span className="absolute top-2" style={{ left: (modoAncho ? 324 : 200) * escala }}>Evento</span>
            <span className="absolute top-2 text-ink" style={{ right: "34%" }}>Actual</span>
            <span className="absolute top-2" style={{ right: "17%" }}>Previsión</span>
            <span className="absolute top-2" style={{ right: 14 * escala }}>Anterior</span>
          </div>
        )}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {/* Zoom con la propiedad CSS zoom (no transform: scale, que reduce una imagen ya dibujada y
              se ve pixelado con escala de Windows 125–150%). zoom vuelve a dibujar el texto nítido. */}
          <div
            className="absolute left-0 top-0"
            style={{ width: "100%", height: "100%", zoom: escala }}
          >
            {cargadas && (
              <WidgetEventos paises={paises} importancia={importancia} intento={intento} onEstado={setEstado} />
            )}
          </div>
        </div>
        {estado !== "listo" && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 p-6 text-center" role="status">
            {estado === "cargando" ? (
              <p className="text-sm text-muted">Cargando calendario…</p>
            ) : (
              <div>
                <p className="font-medium text-ink">
                  {estado === "lento" ? "El calendario está tardando más de lo normal" : "No pudimos cargar el calendario"}
                </p>
                <p className="mt-1 text-sm text-muted">Revisá tu conexión o si un bloqueador de anuncios está frenando TradingView.</p>
                <button type="button" onClick={() => setIntento((n) => n + 1)} className="btn-secondary btn-sm mt-4">
                  Reintentar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
        <span className="flex items-center gap-3" aria-label="Impacto: una barra bajo, dos medio, tres alto">
          <span className="text-muted">Impacto:</span>
          {[["Bajo", 1], ["Medio", 2], ["Alto", 3]].map(([t, n]) => (
            <span key={t} className="flex items-center gap-1">
              <BarrasImpacto n={n} />
              {t}
            </span>
          ))}
        </span>
        <span>
          {!modoTabla && "R: real · P: previsión · A: anterior. "}
          {zona && <>Horarios en tu zona ({zona}). </>}Fuente: TradingView.
        </span>
        {/* Densidad junto a la leyenda: no ocupa una fila arriba. Más chico = más eventos del día a la vista; en celular no se achica. */}
        {ancho >= 700 && (
          <div className="ml-auto flex flex-none items-center rounded-md border border-line bg-surface" role="group" aria-label="Tamaño del calendario">
            <button
              type="button"
              onClick={() => cambiarZoom(-ZOOM_PASO)}
              disabled={pref.zoom <= ZOOM_MIN}
              aria-label="Achicar: ver más eventos"
              title="Ver más eventos"
              className="flex h-8 w-8 items-center justify-center rounded-l-md text-muted hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              −
            </button>
            <span className="w-12 text-center font-mono text-xs tabular-nums text-muted" aria-live="polite">
              {Math.round(pref.zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => cambiarZoom(ZOOM_PASO)}
              disabled={pref.zoom >= ZOOM_MAX}
              aria-label="Agrandar"
              title="Agrandar"
              className="flex h-8 w-8 items-center justify-center rounded-r-md text-muted hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
