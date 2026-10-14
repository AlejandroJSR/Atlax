"use client";
import { useEffect, useMemo, useState } from "react";
import {
  GRUPOS,
  DIVISAS_CUENTA,
  especificacion,
  conversionACuenta,
  calcularPosicion,
  distanciaEnPips,
} from "@/lib/tamanoPosicion";

const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

const fmt = (n, dec = 2) =>
  Number.isFinite(n)
    ? n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec })
    : "—";

const PRESETS_RIESGO = ["0.5", "1", "2", "3"];

const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-muted";
// Accesos directos a lo más operado; el resto queda en el desplegable "Más…".
const FAVORITOS = ["EUR/USD", "GBP/USD", "XAU/USD", "US30", "US100", "BTC/USD"];

/** Calculadora de tamaño de posición. La usan /alumnos/calculadora y la landing (uso libre). */

/** Campo numérico compacto (44px) con la unidad visible dentro. */
function CampoNumero({ id, label, valor, onChange, sufijo, adorno, placeholder, title }) {
  return (
    <div className="min-w-0">
      {label && <label className={LABEL} htmlFor={id}>{label}</label>}
      <div className="flex h-11 items-stretch overflow-hidden rounded-md border border-line bg-bg transition-colors focus-within:border-accent" title={title}>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-3 font-mono text-base tabular-nums text-ink placeholder:text-faint focus:outline-none"
          placeholder={placeholder}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
        />
        {sufijo && (
          <span className="flex items-center border-l border-line bg-surface-2 px-2.5 font-mono text-xs text-muted">{sufijo}</span>
        )}
        {adorno}
      </div>
    </div>
  );
}

export default function CalculadoraRiesgo({ instrumentoInicial = "EUR/USD" }) {
  const [instrumento, setInstrumento] = useState(instrumentoInicial);
  const [cuenta, setCuenta] = useState("USD");
  const [balance, setBalance] = useState("10000");
  const [riesgo, setRiesgo] = useState("1");
  const [stop, setStop] = useState("20");
  const [modoStop, setModoStop] = useState("distancia"); // distancia | precios
  const [entrada, setEntrada] = useState("");
  const [precioSl, setPrecioSl] = useState("");
  const [tasas, setTasas] = useState(null);
  const [fechaTasas, setFechaTasas] = useState(null);
  const [estadoTasas, setEstadoTasas] = useState("cargando"); // cargando | ok | error
  const [conversionManual, setConversionManual] = useState("");
  const [contratoManual, setContratoManual] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);

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

  // Un tipo de cambio o contrato manual solo vale para el instrumento/cuenta en que se cargó.
  useEffect(() => setConversionManual(""), [instrumento, cuenta]);
  // Los precios de entrada/SL de un instrumento no sirven para otro.
  useEffect(() => {
    setContratoManual("");
    setEntrada("");
    setPrecioSl("");
  }, [instrumento]);

  const base = especificacion(instrumento);
  const spec = { ...base, contrato: contratoManual !== "" ? num(contratoManual) : base.contrato };
  const unidadStopSing = spec.unidadStop === "pips" ? "pip" : "punto";
  const stopPips =
    modoStop === "distancia" ? num(stop) : distanciaEnPips(num(entrada), num(precioSl), spec.pip);
  const esCompra = num(precioSl) < num(entrada);
  const conversionAuto = conversionACuenta(spec.quote, cuenta, tasas);
  const conversion = conversionManual !== "" ? num(conversionManual) : conversionAuto;
  const necesitaConversion = spec.quote !== cuenta;

  const r = useMemo(
    () =>
      calcularPosicion({
        balance: num(balance),
        riesgoPct: num(riesgo),
        stopPips,
        pip: spec.pip,
        contrato: spec.contrato,
        conversion,
      }),
    [balance, riesgo, stopPips, spec.pip, spec.contrato, conversion]
  );

  const riesgoNum = num(riesgo);
  const nivelRiesgo = !(riesgoNum > 0) ? null : riesgoNum <= 1 ? "conservador" : riesgoNum <= 2 ? "moderado" : "alto";

  const copiarLotes = async () => {
    if (!r) return;
    try {
      await navigator.clipboard.writeText(r.lotesOperables.toFixed(2));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* el portapapeles puede estar bloqueado; el número sigue visible */
    }
  };

  const faltante = !r
    ? necesitaConversion && !(conversion > 0)
      ? `Falta el tipo de cambio ${spec.quote} → ${cuenta}.`
      : modoStop === "precios" && !(stopPips > 0)
      ? "Ingresá el precio de entrada y el del stop loss."
      : "Completá balance, riesgo y stop con valores mayores a cero."
    : null;

  const lotesTexto = r ? fmt(r.lotesOperables) : "—";
  const tieneAjustes = spec.variable || necesitaConversion;
  const faltaCotizacion = estadoTasas === "error" && necesitaConversion && conversionManual === "";

  return (
    // Container queries: se adapta al espacio real (página pública ancha o campus con sidebar), no al ancho de pantalla.
    <div className="@container">
    <div className="grid grid-cols-1 gap-3 sm:gap-4 @3xl:grid-cols-[minmax(0,1fr)_320px] @3xl:items-stretch">
      {/* ENTRADAS */}
      <form className="panel @container/form" onSubmit={(e) => e.preventDefault()}>
        {/* Mercado: accesos directos + el resto en "Más…" */}
        <div className="border-b border-line p-3 sm:p-5 @2xl/form:px-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className={LABEL + " mb-0"}>Instrumento</span>
            {tieneAjustes && (
              <button
                type="button"
                onClick={() => setAjustesAbiertos((a) => !a)}
                aria-expanded={ajustesAbiertos}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors hover:bg-surface-2 ${
                  faltaCotizacion ? "text-warn" : "text-muted hover:text-ink"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" strokeLinecap="round" />
                  <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
                </svg>
                {faltaCotizacion ? "Falta tipo de cambio" : "Ajustes del broker"}
              </button>
            )}
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 @xl/form:grid @xl/form:grid-cols-7 @xl/form:overflow-visible" role="group" aria-label="Instrumento">
            {FAVORITOS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setInstrumento(f)}
                aria-pressed={instrumento === f}
                className={`h-10 flex-none rounded-md border px-3 font-mono text-sm font-medium transition-colors @xl/form:h-11 @xl/form:px-1 ${
                  instrumento === f
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-line-strong text-ink hover:border-muted hover:bg-surface-2"
                }`}
              >
                {f}
              </button>
            ))}
            <label className="sr-only" htmlFor="calc-instrumento">Otro instrumento</label>
            <select
              id="calc-instrumento"
              value={FAVORITOS.includes(instrumento) ? "" : instrumento}
              onChange={(e) => e.target.value && setInstrumento(e.target.value)}
              className={`h-10 flex-none rounded-md border px-2 font-mono text-sm font-medium focus:border-accent focus:outline-none @xl/form:h-11 ${
                FAVORITOS.includes(instrumento) ? "border-line-strong bg-bg text-muted" : "border-accent bg-accent text-accent-ink"
              }`}
            >
              <option value="">Más…</option>
              {GRUPOS.map((g) => (
                <optgroup key={g.grupo} label={g.grupo}>
                  {g.items.filter((i) => !FAVORITOS.includes(i.id)).map((i) => <option key={i.id}>{i.id}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Ajustes del broker (solo cuando aplican) */}
          {tieneAjustes && ajustesAbiertos && (
            <div className="mt-3 grid gap-3 rounded-md border border-line bg-bg/50 p-3 sm:grid-cols-2">
              {spec.variable && (
                <div>
                  <CampoNumero
                    id="calc-contrato"
                    label="Contrato por lote"
                    valor={contratoManual}
                    onChange={setContratoManual}
                    placeholder={String(base.contrato)}
                    sufijo={spec.unidadContrato}
                  />
                  <p className="mt-1 text-xs text-faint">Por defecto {base.contrato}. Revisalo en tu plataforma.</p>
                </div>
              )}
              {necesitaConversion && (
                <div>
                  <CampoNumero
                    id="calc-conversion"
                    label={`1 ${spec.quote} =`}
                    valor={conversionManual}
                    onChange={setConversionManual}
                    placeholder={conversionAuto ? fmt(conversionAuto, 5) : "Ingresalo"}
                    sufijo={cuenta}
                  />
                  <p className="mt-1 text-xs text-faint">
                    {estadoTasas === "cargando" && "Buscando cotización…"}
                    {estadoTasas === "error" && "Sin cotización: usá la de tu broker."}
                    {estadoTasas === "ok" && (conversionManual === "" ? `Automático (BCE ${fechaTasas?.split("-").reverse().join("/")})` : "Valor manual")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid @2xl/form:grid-cols-2">
          {/* Cuenta y riesgo */}
          <div className="space-y-3 border-b border-line p-3 sm:p-5 @2xl/form:border-b-0 @2xl/form:border-r @2xl/form:px-6">
            <div className="grid grid-cols-2 gap-3">
              <CampoNumero
                id="calc-balance"
                label="Balance"
                valor={balance}
                onChange={setBalance}
                adorno={
                  <>
                    <label className="sr-only" htmlFor="calc-cuenta">Moneda de la cuenta</label>
                    <select
                      id="calc-cuenta"
                      value={cuenta}
                      onChange={(e) => setCuenta(e.target.value)}
                      className="border-l border-line bg-surface-2 px-1.5 font-mono text-xs text-ink focus:outline-none"
                    >
                      {DIVISAS_CUENTA.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </>
                }
              />
              <CampoNumero id="calc-riesgo" label="Riesgo" valor={riesgo} onChange={setRiesgo} sufijo="%" />
            </div>
            <div className="grid grid-cols-4 gap-2" role="group" aria-label="Riesgo rápido">
              {PRESETS_RIESGO.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setRiesgo(p)}
                  aria-pressed={riesgo === p}
                  className={`h-10 rounded-md border font-mono text-sm transition-colors ${
                    riesgo === p
                      ? "border-accent bg-accent/15 text-accent-soft"
                      : "border-line text-muted hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {p.replace(".", ",")}%
                </button>
              ))}
            </div>
            {nivelRiesgo === "alto" ? (
              <p className="text-xs text-down">Más del 2% por operación: una mala racha puede vaciar la cuenta.</p>
            ) : (
              <p className="hidden text-xs text-faint @2xl/form:block">Recomendado: entre 0,5% y 2% por operación.</p>
            )}
          </div>

          {/* Stop loss */}
          <div className="p-3 sm:p-5 @2xl/form:px-6">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2" role="status">
                <span className={LABEL + " mb-0 whitespace-nowrap"}>Stop<span className="hidden sm:inline"> loss</span></span>
                {modoStop === "precios" && stopPips > 0 && (
                  <>
                    <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase ${esCompra ? "bg-up/15 text-up" : "bg-down/15 text-down"}`}>
                      {esCompra ? "Compra" : "Venta"}
                    </span>
                    <span className="whitespace-nowrap font-mono text-xs tabular-nums text-muted">{fmt(stopPips, stopPips % 1 ? 1 : 0)} <span className="hidden sm:inline">{spec.unidadStop}</span></span>
                  </>
                )}
              </span>
              <div role="radiogroup" aria-label="Cómo ingresar el stop" className="inline-flex flex-none rounded-md border border-line p-0.5">
                {[
                  ["distancia", spec.unidadStop === "pips" ? "Pips" : "Puntos"],
                  ["precios", <><span key="c" className="sm:hidden">Precios</span><span key="l" className="hidden sm:inline">Entrada + SL</span></>],
                ].map(([valor, texto]) => (
                  <button
                    key={valor}
                    type="button"
                    role="radio"
                    aria-checked={modoStop === valor}
                    onClick={() => setModoStop(valor)}
                    className={`h-8 rounded px-3 text-xs font-medium transition-colors ${
                      modoStop === valor ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"
                    }`}
                  >
                    {texto}
                  </button>
                ))}
              </div>
            </div>
            {modoStop === "distancia" ? (
              <CampoNumero id="calc-stop" valor={stop} onChange={setStop} sufijo={spec.unidadStop} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <CampoNumero id="calc-entrada" valor={entrada} onChange={setEntrada} sufijo={<><span className="sm:hidden">Ent.</span><span className="hidden sm:inline">Entrada</span></>} placeholder="0,00" />
                <CampoNumero id="calc-sl" valor={precioSl} onChange={setPrecioSl} sufijo="SL" placeholder="0,00" />
              </div>
            )}
            <p className="mt-3 hidden text-xs text-faint @2xl/form:block">
              {modoStop === "distancia"
                ? `1 ${unidadStopSing} = ${String(spec.pip).replace(".", ",")} en el precio de ${instrumento}.`
                : "La distancia y si es compra o venta se calculan solas."}
            </p>
          </div>
        </div>
      </form>

      {/* RESULTADO */}
      <aside aria-live="polite" className="panel flex flex-col overflow-hidden">
        <div className="bg-accent/10 p-4 sm:p-5 @3xl:flex-1 @3xl:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-accent-soft">Lotes a operar · {instrumento}</p>
              <p className="font-mono text-4xl font-medium leading-tight tabular-nums text-ink sm:text-5xl @3xl:text-6xl">{lotesTexto}</p>
            </div>
            {r && (
              <button type="button" onClick={copiarLotes} className="btn-secondary btn-sm h-10" aria-label="Copiar lotes">
                {copiado ? "¡Copiado!" : "Copiar"}
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-ink @3xl:mt-3 @3xl:text-base">
            {!r ? (
              <span className="text-muted">{faltante}</span>
            ) : r.lotesOperables === 0 ? (
              <span className="text-warn">No alcanza para 0,01 lotes: achicá el stop o subí el riesgo.</span>
            ) : (
              <>
                Si toca el SL perdés{" "}
                <strong className="font-mono font-medium tabular-nums text-down">{fmt(r.riesgoReal)} {cuenta}</strong>
              </>
            )}
          </p>
          {r && r.lotesOperables > 0 && (
            <p className="mt-4 hidden rounded-md border border-line bg-bg/60 px-3 py-2 font-mono text-xs leading-relaxed text-muted @3xl:block">
              {fmt(r.montoRiesgo)} {cuenta} ÷ ({fmt(stopPips, stopPips % 1 ? 1 : 0)} {spec.unidadStop} × {fmt(r.valorPipLote)} {cuenta})
              <br />= {fmt(r.lotes, 4)} → <span className="text-ink">{fmt(r.lotesOperables)} lotes</span>
            </p>
          )}
        </div>
        {r && (
          <dl className="hidden grid-cols-2 border-t border-line text-sm sm:grid">
            {[
              ["Riesgo", `${fmt((r.riesgoReal / num(balance)) * 100)}%`],
              [`Por ${unidadStopSing}`, `${fmt(r.valorPipLote * r.lotesOperables)} ${cuenta}`],
              [
                spec.unidadContrato === "unidades" ? "Unidades" : spec.unidadContrato === "contratos" ? "Contratos" : spec.unidadContrato,
                fmt(r.lotesOperables * spec.contrato, r.lotesOperables * spec.contrato < 10 ? 2 : 0),
              ],
              ["Stop", `${fmt(stopPips, stopPips % 1 ? 1 : 0)} ${spec.unidadStop}`],
            ].map(([k, v], i) => (
              <div key={k} className={`px-4 py-2.5 @3xl:px-6 @3xl:py-3 ${i % 2 === 0 ? "border-r border-line" : ""} ${i < 2 ? "border-b border-line" : ""}`}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="font-mono tabular-nums text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </aside>

      <p className="hidden text-xs text-faint sm:block @3xl:col-span-2">
        Orientativo: redondeado hacia abajo a 0,01 lote. El contrato y el valor del pip pueden variar según tu broker.
      </p>
    </div>
    </div>
  );
}
