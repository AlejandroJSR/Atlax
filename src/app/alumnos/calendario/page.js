"use client";
import { useEffect } from "react";

export default function CalendarioPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://fxverify.com/Content/remote/remote-calendar-widget.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.RemoteCalendar) {
        window.RemoteCalendar({
          DefaultTime: "today",
          DefaultTheme: "dark",
          Url: "https://fxverify.com",
          SubPath: "economic-calendar",
          IsShowEmbedButton: false,
          DefaultCountries: "us,eu",
          ContainerId: "economic-calendar-603206",
        });
      }
    };
  }, []);

  return (
    <>
      <div id="economic-calendar-603206"></div>
    </>
  );
}
