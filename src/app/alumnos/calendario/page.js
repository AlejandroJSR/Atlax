"use client";
import CalendarioEconomico from "@/components/CalendarioEconomico";

export default function CalendarioPage() {
  return (
    // Alto = pantalla menos el padding vertical del <main> del campus (pt-20 pb-8 en móvil, pt-8 pb-8 en lg),
    // para que el calendario use todo el espacio y el scroll quede dentro del widget.
    <div className="flex h-[calc(100dvh-7rem)] max-w-7xl flex-col lg:h-[calc(100dvh-4rem)]">
      <div className="mb-3 flex items-baseline justify-between gap-4 sm:mb-4">
        <h1 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">Calendario económico</h1>
        <p className="hidden text-sm text-faint md:block">Qué noticias vienen y cuándo, para no operar a ciegas.</p>
      </div>
      <div className="min-h-0 flex-1">
        <CalendarioEconomico />
      </div>
    </div>
  );
}
