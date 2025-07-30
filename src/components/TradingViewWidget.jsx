import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget() {
  const container = useRef();

  useEffect(() => {
    // Limpia por si acaso
    container.current.innerHTML = '';
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = `
      {
        "symbols": [
          { "proName": "FX_IDC:EURUSD", "title": "EURUSD" },
          { "proName": "OANDA:AUDUSD", "title": "AUDUSD" },
          { "proName": "CAPITALCOM:US30", "title": "US30" },
          { "proName": "OKX:BTCUSD", "title": "BTCUSD" }
        ],
        "colorTheme": "dark",
        "locale": "es",
        "largeChartUrl": "",
        "isTransparent": true,
        "showSymbolLogo": true,
        "displayMode": "adaptive"
      }`;
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright">
        <a href="https://es.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Siga los mercados en TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
