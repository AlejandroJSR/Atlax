"use client";
import CalculadoraRiesgo from "@/components/CalculadoraRiesgo";

export default function CalculadoraPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-2 flex items-baseline justify-between gap-4 sm:mb-4">
        <h1 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">Calculadora de riesgo</h1>
        <p className="hidden text-sm text-faint md:block">Lotes para perder solo el % que elegiste si toca el stop.</p>
      </div>
      <CalculadoraRiesgo />
    </div>
  );
}
