import Link from "next/link";
import CalculadoraRiesgo from "@/components/CalculadoraRiesgo";

export const metadata = {
  title: "Calculadora de riesgo gratuita · ATLAX",
  description:
    "Calcula cuántos lotes operar en CFDs, índices, oro, divisas y cripto para arriesgar solo el % de tu cuenta que elegiste. Gratis y sin registro.",
};

export default function CalculadoraPublicaPage() {
  return (
    <div className="font-landing min-h-screen">
      <nav className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-mono text-lg font-medium tracking-[0.2em] text-ink">
            <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-accent" aria-hidden="true" />
            ATLAX
          </Link>
          <Link href="/#cursos" className="btn-secondary btn-sm rounded-lg">
            Ver cursos
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-10 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-up">Herramienta gratuita</p>
            <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Calculadora de riesgo</h1>
          </div>
          <p className="max-w-sm text-muted">
            Calcula cuántos lotes operar para perder solo el % que elegiste si toca el stop. Úsala libremente, sin registrarte.
          </p>
        </div>

        <CalculadoraRiesgo instrumentoInicial="US100" />

        <section className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl border border-line bg-surface p-7 sm:flex-row sm:items-center sm:p-9">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-ink">¿Quieres operar con un plan de riesgo completo?</h2>
            <p className="max-w-xl text-muted">
              En nuestros cursos aprendes a gestionar capital y a operar dentro de las reglas de una prueba de fondeo.
            </p>
          </div>
          <Link href="/#cursos" className="btn-primary flex-none rounded-lg px-6 py-3.5">
            Ver cursos y precios
          </Link>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <p className="mx-auto max-w-7xl px-4 text-xs leading-relaxed text-faint sm:px-6">
          Resultado orientativo. Operar CFDs con apalancamiento implica un alto riesgo de pérdida. Contenido educativo, no asesoría financiera.
        </p>
      </footer>
    </div>
  );
}
