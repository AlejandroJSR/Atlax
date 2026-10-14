"use client";
import { useEffect, useState } from "react";

export default function CalendarioPage() {
  const [estado, setEstado] = useState("cargando"); // cargando | listo | error

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://fxverify.com/Content/remote/remote-calendar-widget.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.RemoteCalendar) {
        window.RemoteCalendar({
          DefaultTime: "today",
          DefaultTheme: "dark",
          Url: "https://fxverify.com",
          SubPath: "economic-calendar",
          IsShowEmbedButton: false,
          DefaultCountries: "us,eu",
          ContainerId: "economic-calendar-603206",
        });
        setEstado("listo");
      } else {
        setEstado("error");
      }
    };
    script.onerror = () => setEstado("error");

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="max-w-6xl">
      <h1 className="page-title mb-1">Calendario económico</h1>
      <p className="mb-6 text-muted">Eventos de hoy para EE. UU. y la zona euro.</p>
      <div className="panel min-h-[480px] overflow-hidden p-2">
        {estado === "cargando" && (
          <p className="p-6 text-sm text-muted" role="status">Cargando calendario…</p>
        )}
        {estado === "error" && (
          <div className="p-6" role="alert">
            <p className="font-medium text-ink">No pudimos cargar el calendario</p>
            <p className="mt-1 text-sm text-muted">
              El proveedor externo no respondió. Recargá la página o probá en unos minutos.
            </p>
          </div>
        )}
        <div id="economic-calendar-603206"></div>
      </div>
    </div>
  );
}
