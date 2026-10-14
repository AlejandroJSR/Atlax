// Cálculo de tamaño de posición para Forex.
// Funciones puras: sin red ni React, para poder probarlas aisladas.

export const INSTRUMENTOS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "USD/CAD", "AUD/USD", "NZD/USD",
  "EUR/GBP", "EUR/JPY", "GBP/JPY", "EUR/CHF", "EUR/AUD", "AUD/JPY", "GBP/CHF", "CAD/JPY",
  "XAU/USD",
];

export const DIVISAS_CUENTA = ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "JPY", "NZD"];

/**
 * Tamaño de pip y de contrato estándar (1 lote) por instrumento.
 * Oro: convención más usada, 1 pip = 0,10 de precio y 1 lote = 100 oz.
 */
export function especificacion(instrumento) {
  const [base, quote] = instrumento.split("/");
  if (base === "XAU") return { base, quote, pip: 0.1, contrato: 100 };
  return { base, quote, pip: quote === "JPY" ? 0.01 : 0.0001, contrato: 100000 };
}

/**
 * Cuántas unidades de la divisa de la cuenta vale 1 unidad de `divisa`.
 * `tasas` viene de la API con base = divisa de la cuenta (1 cuenta = tasas[X] de X).
 */
export function conversionACuenta(divisa, cuenta, tasas) {
  if (divisa === cuenta) return 1;
  const t = tasas?.[divisa];
  return t ? 1 / t : null;
}

/** Precio del par (cuántas `quote` por 1 `base`) a partir de las tasas. */
export function precioPar(base, quote, cuenta, tasas) {
  const r = (d) => (d === cuenta ? 1 : tasas?.[d]);
  const rb = r(base);
  const rq = r(quote);
  return rb && rq ? rq / rb : null;
}

/**
 * balance: saldo de la cuenta · riesgoPct: % a arriesgar · stopPips: distancia del stop
 * pip / contrato: especificación · conversion: 1 quote = conversion de la cuenta
 */
export function calcularPosicion({ balance, riesgoPct, stopPips, pip, contrato, conversion }) {
  if (!(balance > 0) || !(riesgoPct > 0) || !(stopPips > 0) || !(pip > 0) || !(contrato > 0) || !(conversion > 0)) {
    return null;
  }
  const montoRiesgo = (balance * riesgoPct) / 100;
  const valorPipUnidad = pip * conversion; // en divisa de la cuenta
  const valorPipLote = valorPipUnidad * contrato;
  const unidades = montoRiesgo / (stopPips * valorPipUnidad);
  const lotes = unidades / contrato;
  // Los brokers aceptan pasos de 0,01 lote: se redondea hacia abajo para no superar el riesgo.
  const lotesOperables = Math.floor(lotes * 100 + 1e-9) / 100;
  const riesgoReal = lotesOperables * valorPipLote * stopPips;
  return { montoRiesgo, valorPipLote, unidades, lotes, lotesOperables, riesgoReal };
}
