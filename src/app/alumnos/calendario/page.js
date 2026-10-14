"use client";
import CalendarioEconomico from "@/components/CalendarioEconomico";

export default function CalendarioPage() {
  return (
    // Alto = pantalla menos el padding vertical del <main> del campus (pt-20 pb-8 en móvil, pt-8 pb-8 en lg),
    // para que el calendario use todo el espacio y el scroll quede dentro del widget.
    // Sin título visible: el menú lateral ya indica la sección y así entran más eventos.
    <div className="flex h-[calc(100dvh-7rem)] max-w-7xl flex-col lg:h-[calc(100dvh-4rem)]">
      <h1 className="sr-only">Calendario económico</h1>
      <div className="min-h-0 flex-1">
        <CalendarioEconomico />
      </div>
    </div>
  );
}
