/** @type {import('next').NextConfig} */
const nextConfig = {
  // Rutas del admin renombradas (evitamos la palabra "cursos"): las viejas redirigen a las nuevas.
  async redirects() {
    return [
      { source: "/admin/administrar-cursos", destination: "/admin/planes", permanent: true },
      { source: "/admin/administrar-cursos/:ruta*", destination: "/admin/planes/:ruta*", permanent: true },
      { source: "/admin/cursos-vendidos", destination: "/admin/ventas", permanent: true },
    ];
  },
};

export default nextConfig;
