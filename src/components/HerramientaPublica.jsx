import Link from "next/link";
import NavPublica from "@/components/NavPublica";

/**
 * Marco común de las herramientas gratuitas públicas (/calculadora, /calendario):
 * menú con "Herramientas", encabezado, contenido, llamado a los cursos y aviso legal.
 */
export default function HerramientaPublica({ titulo, descripcion, children, compacto = false }) {
  return (
    <div className="font-landing min-h-screen">
      <NavPublica />

      <main className={`mx-auto max-w-7xl px-4 sm:px-6 ${compacto ? "py-6 lg:py-8" : "py-12 lg:py-16"}`}>
        <div className={`flex flex-col justify-between gap-3 md:flex-row md:items-end ${compacto ? "mb-6" : "mb-10"}`}>
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-up">Herramienta gratuita</p>
            <h1 className={`font-bold tracking-tight text-ink ${compacto ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"}`}>{titulo}</h1>
          </div>
          <p className="max-w-sm text-muted">{descripcion}</p>
        </div>

        {children}

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
          Contenido educativo, no asesoría financiera. Operar CFDs con apalancamiento implica un alto riesgo de pérdida.
        </p>
      </footer>
    </div>
  );
}
