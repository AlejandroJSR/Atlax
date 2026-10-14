import React, { useEffect, useRef, memo } from "react";
import { montarWidgetTradingView } from "@/lib/tradingview";

function TradingViewWidget({ theme = "dark" }) {
  const container = useRef();

  useEffect(
    () =>
      montarWidgetTradingView(container.current, "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js", {
        symbols: [
          { proName: "CAPITALCOM:US100", title: "NAS100" },
          { proName: "CAPITALCOM:US500", title: "SPX500" },
          { proName: "CAPITALCOM:US30", title: "US30" },
          { proName: "CAPITALCOM:DE40", title: "GER40" },
          { proName: "OANDA:XAUUSD", title: "XAUUSD" },
          { proName: "BITSTAMP:BTCUSD", title: "BTCUSD" },
        ],
        colorTheme: theme,
        locale: "es",
        largeChartUrl: "",
        isTransparent: true,
        showSymbolLogo: true,
        displayMode: "regular",
      }),
    [theme]
  );

  return (
    <div>
      <div ref={container} />
      <div className="tradingview-widget-copyright">
        <a href="https://es.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Siga los mercados en TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
