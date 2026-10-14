import Link from "next/link";

const secciones = [
  { href: "/admin/ventas", titulo: "Ventas", texto: "Aprobá compras pendientes y revisá los TXID." },
  { href: "/admin/planes", titulo: "Administrar planes", texto: "Precios, beneficios, módulos y clases." },
  { href: "/admin/usuarios", titulo: "Usuarios", texto: "Creá cuentas y asigná planes a cada alumno." },
];

export default function AdminHome() {
  return (
    <div className="max-w-4xl">
      <h1 className="page-title mb-2">Panel de administración</h1>
      <p className="mb-8 text-muted">Elegí una sección para empezar.</p>
      <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        {secciones.map((s) => (
          <Link key={s.href} href={s.href} className="group bg-surface p-5 transition-colors hover:bg-surface-2">
            <h2 className="mb-1 font-semibold text-ink">
              {s.titulo} <span className="text-faint transition-colors group-hover:text-accent-soft" aria-hidden="true">→</span>
            </h2>
            <p className="text-sm text-muted">{s.texto}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
