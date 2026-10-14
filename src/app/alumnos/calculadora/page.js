"use client";
import { useEffect, useMemo, useState } from "react";
import {
  INSTRUMENTOS,
  DIVISAS_CUENTA,
  especificacion,
  conversionACuenta,
  precioPar,
  calcularPosicion,
} from "@/lib/tamanoPosicion";

const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

const fmt = (n, dec = 2) =>
  Number.isFinite(n)
    ? n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec })
    : "—";

export default function CalculadoraPage() {
  const [instrumento, setInstrumento] = useState("EUR/USD");
  const [cuenta, setCuenta] = useState("USD");
  const [balance, setBalance] = useState("10000");
  const [riesgo, setRiesgo] = useState("1");
  const [stop, setStop] = useState("20");
  const [tasas, setTasas] = useState(null);
  const [fechaTasas, setFechaTasas] = useState(null);
  const [estadoTasas, setEstadoTasas] = useState("cargando"); // cargando | ok | error
  const [conversionManual, setConversionManual] = useState("");

  // Tipos de cambio de referencia del BCE (gratis, sin clave). Base = divisa de la cuenta.
  useEffect(() => {
    let cancelado = false;
    setEstadoTasas("cargando");
    fetch(`https://api.frankfurter.dev/v1/latest?base=${cuenta}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (cancelado) return;
        setTasas(data.rates);
        setFechaTasas(data.date);
        setEstadoTasas("ok");
      })
      .catch(() => !cancelado && setEstadoTasas("error"));
    return () => {
      cancelado = true;
    };
  }, [cuenta]);

  // Un tipo de cambio manual solo vale para el par y la cuenta en que se cargó.
  useEffect(() => setConversionManual(""), [instrumento, cuenta]);

  const spec = especificacion(instrumento);
  const conversionAuto = conversionACuenta(spec.quote, cuenta, tasas);
  const conversion = conversionManual !== "" ? num(conversionManual) : conversionAuto;
  const precio = precioPar(spec.base, spec.quote, cuenta, tasas);
  const necesitaConversion = spec.quote !== cuenta;

  const r = useMemo(
    () =>
      calcularPosicion({
        balance: num(balance),
        riesgoPct: num(riesgo),
        stopPips: num(stop),
        pip: spec.pip,
        contrato: spec.contrato,
        conversion,
      }),
    [balance, riesgo, stop, spec.pip, spec.contrato, conversion]
  );

  const riesgoAlto = num(riesgo) > 2;

  return (
    <div className="max-w-5xl">
      <h1 className="page-title mb-1">Calculadora de riesgo</h1>
      <p className="mb-8 text-muted">
        Cuántos lotes operar para que, si salta el stop, pierdas solo el % que elegiste.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ENTRADAS */}
        <form className="panel space-y-5 p-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="calc-instrumento">Instrumento</label>
              <select id="calc-instrumento" className="field font-mono" value={instrumento} onChange={(e) => setInstrumento(e.target.value)}>
                {INSTRUMENTOS.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="calc-cuenta">Divisa de la cuenta</label>
              <select id="calc-cuenta" className="field font-mono" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                {DIVISAS_CUENTA.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="calc-balance">Balance de la cuenta ({cuenta})</label>
            <input id="calc-balance" inputMode="decimal" className="field font-mono tabular-nums" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="calc-riesgo">Riesgo por operación (%)</label>
              <input id="calc-riesgo" inputMode="decimal" className="field font-mono tabular-nums" value={riesgo} onChange={(e) => setRiesgo(e.target.value)} />
              <div className="mt-2 flex gap-1.5">
                {["0.5", "1", "2"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setRiesgo(p)}
                    className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                      riesgo === p ? "border-accent bg-accent/15 text-accent-soft" : "border-line text-muted hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    {p.replace(".", ",")}%
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="calc-stop">Stop loss (pips)</label>
              <input id="calc-stop" inputMode="decimal" className="field font-mono tabular-nums" value={stop} onChange={(e) => setStop(e.target.value)} />
              <p className="mt-2 text-xs text-faint">
                1 pip = {String(spec.pip).replace(".", ",")} en el precio de {instrumento}
              </p>
            </div>
          </div>

          {riesgoAlto && (
            <p className="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
              Arriesgar más del 2% por operación puede vaciar la cuenta en una mala racha.
            </p>
          )}

          {/* Tipo de cambio */}
          {necesitaConversion && (
            <div className="rounded-md border border-line bg-bg p-4">
              <label className="field-label" htmlFor="calc-conversion">
                Tipo de cambio: 1 {spec.quote} = ? {cuenta}
              </label>
              <input
                id="calc-conversion"
                inputMode="decimal"
                className="field font-mono tabular-nums"
                placeholder={conversionAuto ? fmt(conversionAuto, 5) : "Ingresalo a mano"}
                value={conversionManual}
                onChange={(e) => setConversionManual(e.target.value)}
              />
              <p className="mt-2 text-xs text-faint" role="status">
                {estadoTasas === "cargando" && "Buscando cotización…"}
                {estadoTasas === "ok" && conversionManual === "" &&
                  `Automático: referencia del BCE del ${fechaTasas?.split("-").reverse().join("/")}. Escribí un valor para usar el de tu broker.`}
                {estadoTasas === "ok" && conversionManual !== "" && "Usando tu valor manual. Borralo para volver al automático."}
                {estadoTasas === "error" && "No pudimos obtener la cotización. Ingresá el tipo de cambio de tu broker."}
              </p>
            </div>
          )}
        </form>

        {/* RESULTADOS */}
        <section aria-live="polite" className="panel h-fit p-6 lg:sticky lg:top-8">
          <p className="eyebrow mb-4">Resultado</p>
          {r ? (
            <>
              <div className="mb-6">
                <div className="text-sm text-muted">Lotes a operar</div>
                <div className="font-mono text-5xl font-medium tabular-nums text-ink">{fmt(r.lotesOperables)}</div>
                <div className="mt-1 text-xs text-faint">
                  Exacto: {fmt(r.lotes, 4)} · redondeado hacia abajo a 0,01
                </div>
              </div>
              <dl className="divide-y divide-line border-t border-line text-sm">
                {[
                  ["Dinero en riesgo", `${fmt(r.montoRiesgo)} ${cuenta}`],
                  ["Riesgo real con ese lotaje", `${fmt(r.riesgoReal)} ${cuenta}`],
                  ["Unidades", fmt(r.unidades, 0)],
                  ["Valor del pip por lote", `${fmt(r.valorPipLote)} ${cuenta}`],
                  ...(precio ? [[`Precio ${instrumento}`, fmt(precio, spec.quote === "JPY" ? 3 : 5)]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-mono tabular-nums text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              {r.lotesOperables === 0 && (
                <p className="mt-4 text-sm text-warn">
                  El riesgo no alcanza para 0,01 lotes con ese stop. Achicá el stop o subí el % de riesgo.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">
              {necesitaConversion && !(conversion > 0)
                ? "Falta el tipo de cambio para convertir a tu cuenta."
                : "Completá balance, riesgo y stop con valores mayores a cero."}
            </p>
          )}
        </section>
      </div>

      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-faint">
        1 lote estándar = {spec.contrato.toLocaleString("es-AR")} {spec.base === "XAU" ? "oz" : "unidades"}.
        Los cálculos son orientativos: el valor del pip, el tamaño de contrato y el lote mínimo pueden variar según tu broker.
      </p>
    </div>
  );
}
