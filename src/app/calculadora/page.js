import CalculadoraRiesgo from "@/components/CalculadoraRiesgo";
import HerramientaPublica from "@/components/HerramientaPublica";

export const metadata = {
  title: "Calculadora de riesgo gratuita · ATLAX",
  description:
    "Calcula cuántos lotes operar en CFDs, índices, oro, divisas y cripto para arriesgar solo el % de tu cuenta que elegiste. Gratis y sin registro.",
};

export default function CalculadoraPublicaPage() {
  return (
    <HerramientaPublica
      titulo="Calculadora de riesgo"
      descripcion="Calcula cuántos lotes operar para perder solo el % que elegiste si toca el stop. Úsala libremente, sin registrarte."
    >
      <CalculadoraRiesgo instrumentoInicial="US100" />
    </HerramientaPublica>
  );
}
