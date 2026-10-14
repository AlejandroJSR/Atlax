// Cálculo de tamaño de posición para Forex, metales, índices y cripto.
// Funciones puras: sin red ni React, para poder probarlas aisladas.

// quote: divisa en la que cotiza el instrumento (la que se convierte a la cuenta).
// pip: cuánto se mueve el precio por cada pip/punto del stop.
// contrato: unidades por lote estándar (default más común; varía según el broker).
const FX = (par) => {
  const [base, quote] = par.split("/");
  return { id: par, base, quote, pip: quote === "JPY" ? 0.01 : 0.0001, contrato: 100000, unidadStop: "pips", unidadContrato: "unidades" };
};
const INDICE = (id, quote) => ({ id, base: id, quote, pip: 1, contrato: 1, unidadStop: "puntos", unidadContrato: "contratos", variable: true });
const CRIPTO = (base) => ({ id: `${base}/USD`, base, quote: "USD", pip: 1, contrato: 1, unidadStop: "puntos", unidadContrato: base, variable: true });

export const GRUPOS = [
  {
    grupo: "Divisas",
    items: [
      "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "USD/CAD", "AUD/USD", "NZD/USD",
      "EUR/GBP", "EUR/JPY", "GBP/JPY", "EUR/CHF", "EUR/AUD", "AUD/JPY", "GBP/CHF", "CAD/JPY",
    ].map(FX),
  },
  {
    grupo: "Metales",
    // Oro: convención más usada, 1 pip = 0,10 de precio y 1 lote = 100 oz.
    items: [{ id: "XAU/USD", base: "XAU", quote: "USD", pip: 0.1, contrato: 100, unidadStop: "pips", unidadContrato: "oz", variable: true }],
  },
  {
    grupo: "Índices",
    items: [
      INDICE("US30", "USD"),
      INDICE("US100", "USD"),
      INDICE("US500", "USD"),
      INDICE("GER40", "EUR"),
      INDICE("UK100", "GBP"),
      INDICE("JP225", "JPY"),
    ],
  },
  {
    grupo: "Cripto",
    items: [CRIPTO("BTC"), CRIPTO("ETH")],
  },
];

const POR_ID = Object.fromEntries(GRUPOS.flatMap((g) => g.items).map((i) => [i.id, i]));

export const INSTRUMENTOS = Object.keys(POR_ID);

export const DIVISAS_CUENTA = ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "JPY", "NZD"];

export function especificacion(instrumento) {
  return POR_ID[instrumento];
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

/** Precio del par (cuántas `quote` por 1 `base`); null si alguna no es una divisa con tasa. */
export function precioPar(base, quote, cuenta, tasas) {
  const r = (d) => (d === cuenta ? 1 : tasas?.[d]);
  const rb = r(base);
  const rq = r(quote);
  return rb && rq ? rq / rb : null;
}

/**
 * Distancia entre entrada y stop expresada en pips/puntos.
 * Se redondea a 0,1 para eliminar ruido de punto flotante (1,08500 − 1,08250 = 25,000000002).
 */
export function distanciaEnPips(entrada, stopLoss, pip) {
  if (!(entrada > 0) || !(stopLoss > 0) || !(pip > 0) || entrada === stopLoss) return NaN;
  return Math.round((Math.abs(entrada - stopLoss) / pip) * 10) / 10;
}

/**
 * balance: saldo de la cuenta · riesgoPct: % a arriesgar · stopPips: distancia del stop (pips o puntos)
 * pip / contrato: especificación · conversion: 1 quote = conversion de la cuenta
 * pasoLote: incremento mínimo que acepta el broker (0,01 en la mayoría; algunos 0,1 o 1)
 */
export function calcularPosicion({ balance, riesgoPct, stopPips, pip, contrato, conversion, pasoLote = 0.01 }) {
  if (!(balance > 0) || !(riesgoPct > 0) || !(stopPips > 0) || !(pip > 0) || !(contrato > 0) || !(conversion > 0) || !(pasoLote > 0)) {
    return null;
  }
  const montoRiesgo = (balance * riesgoPct) / 100;
  const valorPipUnidad = pip * conversion; // en divisa de la cuenta
  const valorPipLote = valorPipUnidad * contrato;
  const unidades = montoRiesgo / (stopPips * valorPipUnidad);
  const lotes = unidades / contrato;
  // Se redondea hacia abajo al paso del broker para no superar el riesgo.
  // toFixed con los decimales del paso elimina el ruido de punto flotante (0,1 × 3 = 0,30000000000000004).
  const decimales = (String(pasoLote).split(".")[1] || "").length;
  const lotesOperables = Number((Math.floor(lotes / pasoLote + 1e-9) * pasoLote).toFixed(decimales));
  const riesgoReal = lotesOperables * valorPipLote * stopPips;
  return { montoRiesgo, valorPipLote, unidades, lotes, lotesOperables, riesgoReal };
}
