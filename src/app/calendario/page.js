import CalendarioEconomico from "@/components/CalendarioEconomico";
import HerramientaPublica from "@/components/HerramientaPublica";

export const metadata = {
  title: "Calendario económico gratuito · ATLAX",
  description:
    "Noticias económicas del día con impacto, previsión, dato anterior y dato real al publicarse, en tu zona horaria. Gratis y sin registro.",
};

export default function CalendarioPublicoPage() {
  return (
    <HerramientaPublica
      compacto
      titulo="Calendario económico"
      descripcion="Qué noticias vienen y cuándo, con el dato real al publicarse. En tu zona horaria y sin registrarte."
    >
      {/* El calendario ocupa el alto que le da su contenedor. */}
      <div className="h-[calc(100dvh-4rem)] min-h-[520px] max-h-[900px]">
        <CalendarioEconomico />
      </div>
    </HerramientaPublica>
  );
}
