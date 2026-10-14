import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget({ theme = "dark" }) {
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
          { "proName": "CAPITALCOM:US100", "title": "NAS100" },
          { "proName": "CAPITALCOM:US500", "title": "SPX500" },
          { "proName": "CAPITALCOM:US30", "title": "US30" },
          { "proName": "CAPITALCOM:DE40", "title": "GER40" },
          { "proName": "OANDA:XAUUSD", "title": "XAUUSD" },
          { "proName": "BITSTAMP:BTCUSD", "title": "BTCUSD" }
        ],
        "colorTheme": "${theme}",
        "locale": "es",
        "largeChartUrl": "",
        "isTransparent": true,
        "showSymbolLogo": true,
        "displayMode": "regular"
      }`;
    container.current.appendChild(script);
  }, [theme]);

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
