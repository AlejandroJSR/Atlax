// Montaje seguro de widgets de TradingView (ticker, calendario, etc.).
//
// El script de TradingView busca su contenedor recién cuando termina de ejecutarse. Si el contenedor
// se quita antes (React desmonta/vuelve a montar en desarrollo, o cambian las props), el script tira
// "Cannot read properties of null (reading 'querySelector')". Por eso cada montaje usa su propio
// envoltorio, que al desmontar se oculta enseguida y se elimina recién cuando su script terminó.

/**
 * @param {HTMLElement} destino  elemento donde se monta el widget
 * @param {string} src           URL del script embed de TradingView
 * @param {object} config        configuración JSON del widget
 * @param {object} [opciones]    { onIframeListo, onError, alto: "100%" }
 * @returns {() => void}         función de limpieza para el useEffect
 */
export function montarWidgetTradingView(destino, src, config, { onIframeListo, onError, alto } = {}) {
  let vigente = true;
  let scriptTermino = false;

  const envoltorio = document.createElement("div");
  envoltorio.className = "tradingview-widget-container";
  if (alto) envoltorio.style.height = alto;
  destino.appendChild(envoltorio);

  const contenedor = document.createElement("div");
  contenedor.className = "tradingview-widget-container__widget";
  if (alto) contenedor.style.height = alto;
  envoltorio.appendChild(contenedor);

  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.type = "text/javascript";
  script.innerHTML = JSON.stringify(config);
  script.onload = () => {
    scriptTermino = true;
  };
  script.onerror = () => {
    scriptTermino = true;
    if (vigente && onError) onError();
  };
  envoltorio.appendChild(script);

  // El script inyecta un iframe: avisar cuando termina de cargar.
  const observador = new MutationObserver(() => {
    const iframe = envoltorio.querySelector("iframe");
    if (iframe) {
      if (onIframeListo) iframe.addEventListener("load", () => vigente && onIframeListo(), { once: true });
      observador.disconnect();
    }
  });
  observador.observe(envoltorio, { childList: true, subtree: true });

  return () => {
    vigente = false;
    observador.disconnect();
    envoltorio.style.display = "none";
    if (scriptTermino) {
      envoltorio.remove();
    } else {
      const quitar = () => setTimeout(() => envoltorio.remove(), 0);
      script.addEventListener("load", quitar, { once: true });
      script.addEventListener("error", quitar, { once: true });
    }
  };
}
