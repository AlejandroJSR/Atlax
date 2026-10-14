"use client";
import { useEffect, useRef, useState } from "react";

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
const PREDETERMINADO = { divisas: ["USD", "EUR", "GBP"], impacto: "todos" };

// Zoom del widget cuando hay espacio, y ancho desde el cual el widget usa su modo tabla
// (por debajo apila cada evento con etiquetas propias P:/A:). Medido: 700px apila, 760px tabla.
const ESCALA_ANCHO = 0.85;
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
    if (p && Array.isArray(p.divisas) && p.divisas.length && IMPACTOS.some((i) => i.id === p.impacto)) return p;
  } catch {
    /* sin almacenamiento disponible: se usan los valores por defecto */
  }
  return PREDETERMINADO;
}

function WidgetEventos({ paises, importancia, intento, onEstado }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    onEstado("cargando");

    // Cada carga va en su propio envoltorio. El script de TradingView busca su contenedor al
    // ejecutarse: si lo sacamos antes (cambio de filtro, doble montaje de React en desarrollo)
    // tira "Cannot read properties of null". Por eso el envoltorio viejo se oculta ya y se
    // elimina recién cuando su script terminó de correr.
    const envoltorio = document.createElement("div");
    envoltorio.className = "tradingview-widget-container h-full";
    el.appendChild(envoltorio);

    const contenedor = document.createElement("div");
    contenedor.className = "tradingview-widget-container__widget";
    contenedor.style.height = "100%";
    envoltorio.appendChild(contenedor);

    let scriptTermino = false;
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      locale: "es",
      countryFilter: paises,
      importanceFilter: importancia,
      width: "100%",
      height: "100%",
    });
    let vigente = true;
    script.onload = () => {
      scriptTermino = true;
    };
    script.onerror = () => {
      scriptTermino = true;
      if (vigente) onEstado("error");
    };
    envoltorio.appendChild(script);

    // El script inyecta un iframe: cuando termina de cargar, el calendario está listo.
    const observador = new MutationObserver(() => {
      const iframe = envoltorio.querySelector("iframe");
      if (iframe) {
        iframe.addEventListener("load", () => vigente && onEstado("listo"), { once: true });
        observador.disconnect();
      }
    });
    observador.observe(envoltorio, { childList: true, subtree: true });
    const demora = setTimeout(() => onEstado((e) => (e === "cargando" ? "lento" : e)), 15000);

    return () => {
      vigente = false;
      observador.disconnect();
      clearTimeout(demora);
      envoltorio.style.display = "none";
      if (scriptTermino) {
        envoltorio.remove();
      } else {
        const quitar = () => setTimeout(() => envoltorio.remove(), 0);
        script.addEventListener("load", quitar, { once: true });
        script.addEventListener("error", quitar, { once: true });
      }
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
  const escala = ancho >= 700 ? ESCALA_ANCHO : 1;
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
      <div className="flex flex-col gap-3 @container lg:flex-row lg:items-center lg:justify-between">
        <div role="radiogroup" aria-label="Impacto" className="grid grid-cols-3 rounded-md border border-line bg-surface p-1 lg:inline-grid">
          {IMPACTOS.map((i) => {
            const activo = pref.impacto === i.id;
            return (
              <button
                key={i.id}
                type="button"
                role="radio"
                aria-checked={activo}
                onClick={() => setPref((p) => ({ ...p, impacto: i.id }))}
                className={`flex h-9 items-center justify-center gap-2 rounded px-3 text-sm font-medium transition-colors ${
                  activo ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: i.color }} />
                <span className="whitespace-nowrap">{i.texto}</span>
              </button>
            );
          })}
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="group" aria-label="Divisas">
          {DIVISAS.map((d) => {
            const activa = pref.divisas.includes(d.codigo);
            return (
              <button
                key={d.codigo}
                type="button"
                onClick={() => alternarDivisa(d.codigo)}
                aria-pressed={activa}
                className={`h-9 flex-none rounded-md border px-3 font-mono text-sm font-medium transition-colors ${
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
      <div ref={panelRef} className="panel relative flex min-h-[300px] flex-1 flex-col overflow-hidden">
        {modoTabla && (
          // Títulos propios: el widget no los tiene. Posiciones medidas sobre el widget en modo tabla
          // (hora/país/impacto/evento fijas en px desde la izquierda; valores en % desde la derecha).
          <div className="relative h-8 flex-none border-b border-line bg-surface-2 font-mono text-[11px] uppercase tracking-wider text-muted" aria-hidden="true">
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
          {/* Zoom: el widget se dibuja más grande y se escala, para ver más eventos sin scrollear. */}
          <div
            className="absolute left-0 top-0"
            style={{ width: `${100 / escala}%`, height: `${100 / escala}%`, transform: `scale(${escala})`, transformOrigin: "0 0" }}
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
      </div>
    </div>
  );
}
