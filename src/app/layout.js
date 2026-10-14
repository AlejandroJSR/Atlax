import { IBM_Plex_Sans, IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "ATLAX · Trading de CFDs y gestión de capital",
  description:
    "Formación en trading de CFDs con estrategias para gestionar capital y prepararte para pruebas de fondeo: clases en vivo, material grabado y seguimiento personal.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${plexSans.variable} ${plexMono.variable} ${sora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
