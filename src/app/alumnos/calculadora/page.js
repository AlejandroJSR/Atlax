"use client";
import { useEffect, useState } from "react";

export default function CalculadoraPage() {
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(665);

  useEffect(() => {
    const updateScale = () => {
      if (window.innerWidth < 1400) {
        setScale(0.85);
        setWidth(565); // 665 * 0.85
      } else {
        setScale(1);
        setWidth(665);
      }
    };
    window.addEventListener("resize", updateScale);
    updateScale();
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://fxverify.com/Content/remote/remote-widgets.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.RemoteCalc) {
        window.RemoteCalc({
          Url: "https://fxverify.com",
          TopPaneStyle:
            "YmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KCMzNDM1NDAgMCUsICMyNDI4MzEgMTAwJSk7IGNvbG9yOiB3aGl0ZTsgYm9yZGVyLWJvdHRvbTogbm9uZTs=",
          BottomPaneStyle:
            "YmFja2dyb3VuZDogIzE1MTgxZDsgYm9yZGVyOiBzb2xpZCAwcHggIzJhMmUzOTsgY29sb3I6ICM5MTk0YTE7",
          ButtonStyle:
            "YmFja2dyb3VuZDogIzM0MzU0MDsgY29sb3I6IHdoaXRlOyBib3JkZXItcmFkaXVzOiAyMHB4Ow==",
          TitleStyle:
            "dGV4dC1hbGlnbjogbGVmdDsgZm9udC1zaXplOiA0MHB4OyBmb250LXdlaWdodDogNTAwOw==",
          TextboxStyle:
            "YmFja2dyb3VuZDogIzE1MTgxZDsgY29sb3I6ICM5MTk0YTE7IGJvcmRlcjogc29saWQgMHB4ICM5MTk0YTE7",
          ContainerWidth: "665",
          HighlightColor: "rgba(0,0,0,1.0)",
          IsDisplayTitle: false,
          IsShowChartLinks: true,
          IsShowEmbedButton: false,
          CompactType: "large",
          Calculator: "position-size-calculator",
          ContainerId: "position-size-calculator-993519",
        });
      }
    };
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: "40px", minHeight: "100vh" }}>
      <div style={{ width: `${width}px`, transform: `scale(${scale})`, transformOrigin: "top center" }}>
        <div id="position-size-calculator-993519"></div>
      </div>
    </div>
  );
}
