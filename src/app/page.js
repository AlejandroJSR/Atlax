"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import MenuHerramientas, { GrupoHerramientasMovil, HERRAMIENTAS } from "@/components/MenuHerramientas";

// Firebase
import { db, auth } from "@/services/firebase";
import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

const TradingViewWidget = dynamic(
  () => import("../components/TradingViewWidget"),
  { ssr: false }
);

const EMAIL_CONTACTO = "atlaxacademy@gmail.com";
const DIRECCION_USDT = "TBJzaDGosSyhtUPC7BkH9TMgGQDMAC3U6K";

// Solo testimonios reales y con permiso del alumno (sin fotos de stock).
// Si el arreglo está vacío, la sección no se muestra.
const testimonios = [
  // { nombre: "Nombre Apellido", detalle: "Alumno desde 2025 · México", texto: "..." },
];

const programa = [
  {
    titulo: "Análisis y estrategia",
    resumen: "Lee el mercado con criterios concretos, no con intuición.",
    puntos: [
      "Acción del precio y estructura de mercado",
      "Zonas clave, tendencia y contexto",
      "Reglas claras de entrada y salida",
    ],
  },
  {
    titulo: "Gestión de capital",
    resumen: "Protege tu cuenta antes de pensar en ganancias.",
    puntos: [
      "Tamaño de posición según tu capital",
      "Stop loss y relación riesgo / beneficio",
      "Límites de pérdida diarios y semanales",
    ],
  },
  {
    titulo: "Pruebas de fondeo",
    resumen: "Opera dentro de las reglas de la cuenta, no contra ellas.",
    puntos: [
      "Drawdown diario y máximo: cómo no tocarlos",
      "Plan para las fases de evaluación",
      "Gestión de la cuenta una vez fondeada",
    ],
  },
  {
    titulo: "Psicología y disciplina",
    resumen: "Sigue tu plan también cuando el mercado se pone en tu contra.",
    puntos: [
      "Plan de trading escrito",
      "Registro y revisión de operaciones",
      "Cómo evitar las decisiones impulsivas",
    ],
  },
  {
    titulo: "Acompañamiento",
    resumen: "No aprendes solo: tienes a quién preguntar.",
    puntos: [
      "Clases en vivo operando el mercado real",
      "Seguimiento diario del mercado",
      "Seguimiento de cada alumno para despejar dudas",
    ],
  },
];


const incluye = [
  ["En vivo", "Clases en vivo", "Analizamos y operamos el mercado en directo, con espacio para tus preguntas."],
  ["Grabado", "Material de apoyo", "Cada clase y módulo queda grabado para repasarlo cuando lo necesites."],
  ["Diario", "Seguimiento del mercado", "Análisis diario de los activos que operamos y del contexto de la sesión."],
  ["Personal", "Seguimiento del alumno", "Revisamos tu avance y tus dudas uno a uno durante todo el proceso."],
];

const pasos = [
  ["Elige tu curso", "Completa tus datos y crea la contraseña de tu cuenta de alumno."],
  ["Realiza el pago", "Por PayPal o USDT (TRC20). Si pagas con USDT, pega el ID de la transacción."],
  ["Empieza a estudiar", "Verificamos el pago, activamos tu cuenta y entras a la plataforma de clases."],
];

const faqs = [
  {
    pregunta: "¿Necesito experiencia previa?",
    respuesta: "No. Los cursos empiezan por los fundamentos y avanzan por módulos, a tu ritmo.",
  },
  {
    pregunta: "¿Garantizan ganancias?",
    respuesta:
      "No. Nadie puede garantizar resultados en los mercados. Lo que enseñamos es un método para analizar, gestionar el riesgo y evaluar tus propias operaciones.",
  },
  {
    pregunta: "¿Me sirve para pasar una prueba de fondeo?",
    respuesta:
      "El programa está pensado para eso: aprendes a operar respetando los límites de pérdida diaria y máxima y a planificar cada fase de la evaluación. Aprobarla depende de tu ejecución; no garantizamos el resultado.",
  },
  {
    pregunta: "¿Cómo pago y cuándo tengo acceso?",
    respuesta:
      "Puedes pagar con PayPal o con USDT en la red TRON (TRC20). Revisamos cada pago manualmente; una vez verificado, activamos tu cuenta y entras con el correo y la contraseña que elegiste.",
  },
  {
    pregunta: "¿El acceso tiene vencimiento?",
    respuesta: "No. El pago es único y el material grabado queda disponible de por vida.",
  },
];

// Aparece con un fundido suave cuando entra en pantalla.
function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default function Home() {
  const [cursos, setCursos] = useState([]);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    metodo: "Transferencia USDT",
    txid: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [tabPrograma, setTabPrograma] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);

  // "Acceso alumnos" desde otras páginas (p. ej. las herramientas) llega como /?acceso: abre el login.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("acceso")) {
      setShowLogin(true);
      params.delete("acceso");
      const resto = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (resto ? `?${resto}` : "") + window.location.hash);
    }
  }, []);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "cursos"));
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((curso) => curso.activo);
        setCursos(data);
      } catch (error) {
        console.error("Error al obtener cursos:", error);
      } finally {
        setLoadingCursos(false);
      }
    };
    fetchCursos();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const cursosEl = document.getElementById("cursos");
      const pasadoHero = window.scrollY > window.innerHeight * 0.8;
      const enCursos =
        cursosEl &&
        cursosEl.getBoundingClientRect().top < window.innerHeight &&
        cursosEl.getBoundingClientRect().bottom > 0;
      setShowStickyCta(pasadoHero && !enCursos);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleComprar = (curso) => {
    setCursoSeleccionado(curso);
    setShowModal(true);
  };

  const handleInput = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleLoginInput = (e) =>
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

  const copiarDireccion = async () => {
    try {
      await navigator.clipboard.writeText(DIRECCION_USDT);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: la dirección sigue visible para copiarla a mano.
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      await addDoc(collection(db, "compras"), {
        uid: user.uid,
        curso: cursoSeleccionado?.nombre || "",
        precio: cursoSeleccionado?.precio || "",
        nombre: form.nombre,
        email: form.email,
        metodo: form.metodo,
        txid: form.txid || "",
        rol: "alumno",
        estado: "PENDIENTE",
        fecha: Timestamp.now(),
      });

      alert(
        `¡Gracias, ${form.nombre}! Registramos tu compra; activaremos tu acceso cuando verifiquemos el pago.`
      );
      setShowModal(false);
      setForm({
        nombre: "",
        email: "",
        password: "",
        metodo: "Transferencia USDT",
        txid: "",
      });
    } catch (err) {
      console.error("Error al crear usuario o registrar compra:", err);
      alert("No pudimos registrar la compra. Revisa los datos e inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        loginForm.email,
        loginForm.password
      );

      let rol = "alumno";

      if (user.email === "atlaxacademy@gmail.com") {
        rol = "administrador";
      } else {
        const userRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          rol = userDoc.data().rol || "alumno";
        }
      }

      sessionStorage.setItem(
        "alumno",
        JSON.stringify({ uid: user.uid, email: user.email, rol })
      );

      if (rol === "administrador") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/alumnos";
      }
    } catch (error) {
      console.error("Error en login:", error);
      setLoginError("Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.");
    } finally {
      setLoginLoading(false);
    }
  };

  const navLinks = [
    { href: "#programa", label: "Programa" },
    { href: "#cursos", label: "Cursos" },
    { href: "#inscripcion", label: "Inscripción" },
    { href: "#faq", label: "Preguntas" },
    { href: "#contacto", label: "Contacto" },
    { herramientas: true }, // desplegable con calculadora y calendario, al final junto a "Acceso alumnos"
  ];

  const tab = programa[tabPrograma];

  return (
    <div className="font-landing">
      {/* NAVBAR */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          scrolled ? "border-line bg-bg/85 backdrop-blur-md" : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <a href="#inicio" className="flex items-center gap-2 font-mono text-lg font-medium tracking-[0.2em] text-ink">
            <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-accent" aria-hidden="true" />
            ATLAX
          </a>
          <ul className="ml-auto hidden items-center gap-1 lg:flex">
            {navLinks.map((l) =>
              l.herramientas ? (
                <li key="herramientas">
                  <MenuHerramientas />
                </li>
              ) : (
                <li key={l.href}>
                  <a className="rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:text-ink" href={l.href}>
                    {l.label}
                  </a>
                </li>
              )
            )}
            <li className="ml-3">
              <button className="btn-secondary btn-sm" onClick={() => setShowLogin(true)} type="button">
                Acceso alumnos
              </button>
            </li>
          </ul>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-md text-ink lg:hidden"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            type="button"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="flex flex-col border-t border-line bg-bg px-4 pb-5 pt-2 lg:hidden">
            {navLinks.map((l) =>
              l.herramientas ? (
                <GrupoHerramientasMovil key="herramientas" onNavegar={() => setMenuOpen(false)} />
              ) : (
                <a key={l.href} className="border-b border-line py-3.5 text-ink" href={l.href} onClick={() => setMenuOpen(false)}>
                  {l.label}
                </a>
              )
            )}
            <button
              className="btn-primary mt-4"
              type="button"
              onClick={() => { setShowLogin(true); setMenuOpen(false); }}>
              Acceso alumnos
            </button>
          </div>
        )}
      </nav>

      {/* MODAL LOGIN */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowLogin(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-titulo"
            className="panel animate-fadein relative z-10 w-full max-w-sm p-7 shadow-2xl"
          >
            <button
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
              onClick={() => setShowLogin(false)}
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <h2 id="login-titulo" className="mb-1 text-xl font-semibold text-ink">Acceso alumnos</h2>
            <p className="mb-6 text-sm text-muted">Disponible para cuentas con el pago verificado.</p>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="field-label" htmlFor="login-email">Correo electrónico</label>
                <input id="login-email" type="email" name="email" required autoComplete="email" className="field"
                  value={loginForm.email} onChange={handleLoginInput} />
              </div>
              <div>
                <label className="field-label" htmlFor="login-password">Contraseña</label>
                <input id="login-password" type="password" name="password" required autoComplete="current-password" className="field"
                  value={loginForm.password} onChange={handleLoginInput} />
              </div>
              {loginError && (
                <p role="alert" className="rounded-md border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">
                  {loginError}
                </p>
              )}
              <button type="submit" className="btn-primary w-full" disabled={loginLoading}>
                {loginLoading ? "Ingresando…" : "Ingresar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HERO */}
      <section id="inicio" className="overflow-hidden pt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:py-20">
          <div className="relative z-10">
            <p className="animate-fadeInUp mb-6 inline-flex items-center gap-2.5 rounded-md border border-up/25 bg-up/5 px-3 py-1.5 font-mono text-xs text-up">
              <span className="h-1.5 w-1.5 rounded-full bg-up" aria-hidden="true" />
              Trading de CFDs · Gestión de capital
            </p>
            <h1 className="animate-fadeInUp mb-6 text-5xl font-extrabold leading-[1.02] tracking-tight text-ink sm:text-6xl" style={{ animationDelay: "60ms" }}>
              Opera el mercado con <span className="text-accent-soft">método</span>, no con suerte.
            </h1>
            <p className="animate-fadeInUp mb-10 max-w-md text-lg leading-relaxed text-muted" style={{ animationDelay: "120ms" }}>
              Estrategias de trading en CFDs pensadas para gestionar capital y superar pruebas de fondeo. Clases en vivo, seguimiento diario del mercado y acompañamiento personal hasta que lo domines.
            </p>
            <div className="animate-fadeInUp flex flex-wrap gap-3" style={{ animationDelay: "180ms" }}>
              {/* Menos brillante: sin resplandor y con el violeta un poco atenuado; se aviva al pasar el mouse. */}
              <a href="#cursos" className="btn-primary group rounded-lg bg-accent/80 px-6 py-3.5 text-white/95 hover:bg-accent">
                Ver cursos y precios
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <button type="button" onClick={() => setShowLogin(true)} className="btn-secondary rounded-lg px-6 py-3.5">
                Ya soy alumno
              </button>
            </div>
          </div>
          <div className="animate-fadeInUp overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-[0_30px_80px_-20px_rgba(91,71,219,0.45)]" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-line-strong" aria-hidden="true" />
              <span className="h-3 w-3 rounded-full bg-line-strong" aria-hidden="true" />
              <span className="h-3 w-3 rounded-full bg-line-strong" aria-hidden="true" />
              <span className="ml-3 inline-flex items-center gap-2 truncate font-mono text-xs text-muted">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-down" aria-hidden="true" />
                ATLAX · Clase en vivo
              </span>
            </div>
            {/* Recorta solo la pantalla de la laptop que viene en la imagen */}
            <div className="relative overflow-hidden" style={{ aspectRatio: "762 / 486" }}>
              <img
                src="https://i.ibb.co/99DmNSw6/Dise-o-sin-t-tulo-7-Photoroom.png"
                alt="Clase de Atlax: análisis de un gráfico con el instructor en cámara"
                width={1280}
                height={720}
                className="absolute max-w-none"
                style={{ width: "168.07%", left: "-33.61%", top: "-23%" }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="w-full border-y border-line bg-white/[0.02] py-1">
        <TradingViewWidget />
      </div>

      {/* QUÉ INCLUYE */}
      <section className="pt-20" aria-labelledby="incluye-titulo">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 id="incluye-titulo" className="sr-only">Qué incluye la formación</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {incluye.map(([etiqueta, titulo, texto], i) => (
              <Reveal key={titulo} delay={i * 80} className="rounded-2xl border border-line bg-surface p-6 hover:border-line-strong">
                <p className="mb-4 font-mono text-xs uppercase tracking-wider text-up">{etiqueta}</p>
                <h3 className="mb-2 text-lg font-bold text-ink">{titulo}</h3>
                <p className="text-sm leading-relaxed text-muted">{texto}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMA */}
      <section id="programa" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <h2 className="mb-10 text-4xl font-bold tracking-tight text-ink">Qué vas a aprender</h2>
          </Reveal>
          <Reveal delay={100} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div role="tablist" aria-label="Áreas del programa" className="flex flex-col gap-2">
              {programa.map((p, i) => {
                const activo = i === tabPrograma;
                return (
                  <button
                    key={p.titulo}
                    role="tab"
                    id={`tab-${i}`}
                    aria-selected={activo}
                    aria-controls="panel-programa"
                    type="button"
                    onClick={() => setTabPrograma(i)}
                    className={`flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${
                      activo ? "border-accent bg-accent/10" : "border-line bg-surface hover:border-line-strong"
                    }`}
                  >
                    <span className={`font-mono text-xs ${activo ? "text-accent-soft" : "text-faint"}`}>0{i + 1}</span>
                    <span>
                      <span className={`block font-semibold ${activo ? "text-ink" : "text-muted"}`}>{p.titulo}</span>
                      <span className="block text-sm text-faint">{p.resumen}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              id="panel-programa"
              role="tabpanel"
              aria-labelledby={`tab-${tabPrograma}`}
              className="rounded-2xl border border-line bg-surface p-7 sm:p-9"
            >
              <div key={tabPrograma} className="animate-fadein">
                <p className="mb-3 font-mono text-xs uppercase tracking-wider text-accent-soft">Módulo 0{tabPrograma + 1}</p>
                <h3 className="mb-2 text-2xl font-bold text-ink">{tab.titulo}</h3>
                <p className="mb-8 text-lg text-muted">{tab.resumen}</p>
                <ul className="space-y-3">
                  {tab.puntos.map((punto) => (
                    <li key={punto} className="flex items-center gap-3 rounded-lg border border-line bg-bg px-4 py-3.5 text-ink">
                      <svg className="h-4 w-4 flex-none text-up" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {punto}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CURSOS */}
      <section id="cursos" className="border-t border-line py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mb-10 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <h2 className="text-4xl font-bold tracking-tight text-ink">Cursos y precios</h2>
            <p className="max-w-sm text-muted">Pago único en dólares y acceso de por vida al material grabado.</p>
          </Reveal>
          {loadingCursos ? (
            <div className="mx-auto grid max-w-xl gap-5 lg:max-w-none lg:grid-cols-3" aria-busy="true" aria-label="Cargando cursos">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-[380px] animate-pulse rounded-2xl border border-line bg-surface p-7">
                  <div className="mb-4 h-5 w-2/3 rounded bg-surface-2" />
                  <div className="mb-2 h-4 rounded bg-surface-2" />
                  <div className="mb-8 h-4 w-1/2 rounded bg-surface-2" />
                  <div className="h-8 w-24 rounded bg-surface-2" />
                </div>
              ))}
            </div>
          ) : cursos.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-7 text-muted">
              No hay cursos abiertos en este momento. Escríbenos a{" "}
              <a className="text-accent-soft underline" href={`mailto:${EMAIL_CONTACTO}`}>{EMAIL_CONTACTO}</a>{" "}
              para conocer la próxima apertura.
            </p>
          ) : (
            <div className="mx-auto grid max-w-xl items-stretch gap-5 lg:max-w-none lg:grid-cols-3">
              {cursos.map((curso, i) => (
                <Reveal
                  as="article"
                  key={curso.id}
                  delay={i * 120}
                  className={`flex flex-col rounded-2xl border p-7 ${
                    curso.destacado
                      ? "border-accent bg-gradient-to-b from-accent/25 to-surface"
                      : "border-line bg-surface hover:border-line-strong"
                  }`}
                >
                  <p className={`mb-4 font-mono text-xs uppercase tracking-wider ${curso.destacado ? "text-accent-soft" : "text-faint"}`}>
                    Nivel {curso.nivel}{curso.destacado && " · Más elegido"}
                  </p>
                  <h3 className="mb-2 text-xl font-bold text-ink">{curso.nombre}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-muted">{curso.descripcion}</p>
                  <ul className="mb-8 space-y-2.5 text-sm text-ink">
                    {curso.beneficios?.map((b, j) => (
                      <li key={j} className="flex gap-2.5">
                        <svg className="mt-0.5 h-4 w-4 flex-none text-up" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <div className="mb-5 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tabular-nums text-ink">${curso.precio}</span>
                      <span className="text-sm text-faint">USD · pago único</span>
                    </div>
                    <button
                      onClick={() => handleComprar(curso)}
                      className={`w-full rounded-lg ${curso.destacado ? "btn-primary" : "btn-secondary"}`}
                    >
                      Inscribirme
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODAL DE COMPRA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="compra-titulo"
            className="panel animate-fadein relative flex max-h-[95vh] w-full max-w-md flex-col shadow-2xl"
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <div className="border-b border-line px-6 pb-5 pt-6">
              <p className="mb-1 text-sm text-muted">Inscripción</p>
              <h2 id="compra-titulo" className="mb-1 pr-8 text-2xl font-semibold text-ink">{cursoSeleccionado.nombre}</h2>
              <p className="text-muted">
                <span className="font-mono tabular-nums text-ink">${cursoSeleccionado.precio} USD</span> · pago único
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="field-label" htmlFor="nombre">Nombre completo</label>
                  <input type="text" id="nombre" name="nombre" required className="field" value={form.nombre} onChange={handleInput} autoComplete="name" />
                </div>
                <div>
                  <label className="field-label" htmlFor="email">Correo electrónico</label>
                  <input type="email" id="email" name="email" required className="field" value={form.email} onChange={handleInput} autoComplete="email" />
                  <p className="mt-1.5 text-xs text-faint">Lo usarás para entrar a la plataforma.</p>
                </div>
                <div>
                  <label className="field-label" htmlFor="password">Contraseña</label>
                  <input type="password" id="password" name="password" required minLength={6} className="field" value={form.password} onChange={handleInput} autoComplete="new-password" />
                  <p className="mt-1.5 text-xs text-faint">Mínimo 6 caracteres. Es la contraseña de tu cuenta de alumno.</p>
                </div>
                <div>
                  <label className="field-label" htmlFor="metodo">Método de pago</label>
                  <select id="metodo" name="metodo" className="field" value={form.metodo} onChange={handleInput}>
                    <option>PayPal</option>
                    <option>Transferencia USDT</option>
                  </select>
                </div>
                {form.metodo === "Transferencia USDT" && (
                  <div className="space-y-4 rounded-md border border-line-strong bg-surface-2 p-4 text-sm">
                    <p className="text-ink">
                      Envía <strong className="font-mono tabular-nums">{cursoSeleccionado.precio} USDT</strong> por la red{" "}
                      <strong>TRON (TRC20)</strong>. Otras redes no son compatibles.
                    </p>
                    <div>
                      <span className="field-label">Dirección de depósito</span>
                      <div className="flex items-stretch gap-2">
                        <code className="flex-1 break-all rounded border border-line bg-bg px-3 py-2 font-mono text-xs text-accent-soft">
                          {DIRECCION_USDT}
                        </code>
                        <button type="button" onClick={copiarDireccion} className="btn-secondary btn-sm">
                          {copiado ? "Copiada" : "Copiar"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="field-label" htmlFor="txid">ID de transacción (TXID)</label>
                      <input type="text" id="txid" name="txid" className="field font-mono text-sm" placeholder="Pega aquí tu TXID" value={form.txid} onChange={handleInput} />
                    </div>
                  </div>
                )}
                <p className="text-xs leading-relaxed text-faint">
                  Verificamos cada pago manualmente. Tu acceso se activa cuando el pago queda confirmado.
                </p>
                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" disabled={enviando} className="btn-primary">{enviando ? "Procesando…" : "Confirmar inscripción"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* INSCRIPCIÓN */}
      <section id="inscripcion" className="border-b border-line py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <h2 className="mb-12 text-4xl font-bold tracking-tight text-ink">Cómo es la inscripción</h2>
          </Reveal>
          <Reveal as="ol" delay={100} className="relative grid gap-10 lg:grid-cols-3 lg:gap-8">
            <span
              className="animate-grow-x absolute left-0 right-[16%] top-7 hidden h-px origin-left bg-line-strong lg:block"
              aria-hidden="true"
            />
            {pasos.map(([titulo, texto], i) => (
              <li key={titulo} className="relative">
                <span className="relative z-10 mb-4 block w-fit bg-bg pr-4 text-6xl font-semibold leading-none text-accent-soft tabular-nums">
                  {i + 1}
                </span>
                <h3 className="mb-2 text-lg font-semibold text-ink">{titulo}</h3>
                <p className="max-w-xs leading-relaxed text-muted">{texto}</p>
              </li>
            ))}
          </Reveal>
          <Reveal delay={200} className="mt-12">
            <a href="#cursos" className="btn-secondary">Elegir mi curso</a>
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIOS (solo si hay reales) */}
      {testimonios.length > 0 && (
        <section id="testimonios" className="border-b border-line py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <h2 className="mb-12 text-4xl font-bold tracking-tight text-ink">Lo que dicen nuestros alumnos</h2>
            </Reveal>
            <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
              {testimonios.map((t, i) => (
                <Reveal as="figure" key={t.nombre} delay={i * 120} className="flex flex-col border-t border-line-strong pt-6">
                  <blockquote className="mb-6 flex-1 text-lg leading-relaxed text-ink">
                    &ldquo;{t.texto}&rdquo;
                  </blockquote>
                  <figcaption>
                    <div className="text-sm font-semibold text-ink">{t.nombre}</div>
                    <div className="text-sm text-faint">{t.detalle}</div>
                  </figcaption>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HERRAMIENTAS (uso libre, en página aparte) */}
      <section id="herramientas" className="border-t border-line py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mb-10">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-up">Herramientas gratuitas</p>
            <h2 className="text-4xl font-bold tracking-tight text-ink">Opera con información, no a ciegas</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                href: "/calculadora",
                titulo: "Calculadora de riesgo",
                texto: "Cuántos lotes operar para perder solo el % que elegiste si toca el stop. Índices, oro, divisas y cripto.",
                accion: "Abrir calculadora",
              },
              {
                href: "/calendario",
                titulo: "Calendario económico",
                texto: "Las noticias del día con impacto, previsión y el dato real apenas se publica, en tu zona horaria.",
                accion: "Abrir calendario",
              },
            ].map((h, i) => (
              <Reveal key={h.href} delay={i * 120}>
                <a
                  href={h.href}
                  className="group flex h-full flex-col justify-between gap-6 rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-accent sm:p-9"
                >
                  <div>
                    <h3 className="mb-2 text-2xl font-bold tracking-tight text-ink">{h.titulo}</h3>
                    <p className="text-muted">{h.texto} Sin registrarte.</p>
                  </div>
                  <span className="btn-primary self-start rounded-lg px-6 py-3.5">
                    {h.accion}
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-line py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_2fr]">
          <Reveal>
            <h2 className="text-4xl font-bold tracking-tight text-ink">Preguntas frecuentes</h2>
          </Reveal>
          <Reveal delay={100} className="border-t border-line">
            {faqs.map((faq, i) => (
              <details key={i} className="group border-b border-line" open={i === 0}>
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium text-ink transition-colors hover:text-accent-soft [&::-webkit-details-marker]:hidden">
                  {faq.pregunta}
                  <svg className="h-5 w-5 flex-none text-muted transition-transform duration-300 group-open:rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="animate-fadein pb-5 pr-10 leading-relaxed text-muted">{faq.respuesta}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      {/* CONTACTO / CTA FINAL */}
      <section id="contacto" className="py-20">
        <Reveal className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_2fr]">
          <h2 className="text-4xl font-bold tracking-tight text-ink">Contacto</h2>
          <div>
            <p className="mb-6 max-w-xl leading-relaxed text-muted">
              ¿Dudas sobre qué curso te conviene, los pagos o el estado de tu inscripción? Escríbenos y te respondemos personalmente.
            </p>
            <a href={`mailto:${EMAIL_CONTACTO}`} className="btn-secondary">
              {EMAIL_CONTACTO}
            </a>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line py-12 pb-28 lg:pb-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="flex items-center gap-2 font-mono text-lg font-medium tracking-[0.2em] text-ink">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-accent" aria-hidden="true" />
              ATLAX
            </span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Trading de CFDs con gestión de capital, pensado para cuentas propias y pruebas de fondeo.
            </p>
            <a href={`mailto:${EMAIL_CONTACTO}`} className="mt-2 inline-block text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
              {EMAIL_CONTACTO}
            </a>
          </div>
          <ul className="grid grid-cols-2 gap-x-10 gap-y-1 text-sm sm:flex sm:gap-2">
            {navLinks
              .flatMap((l) => (l.herramientas ? HERRAMIENTAS.map((h) => ({ href: h.href, label: h.titulo })) : [l]))
              .map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="inline-block py-2.5 text-muted hover:text-ink sm:px-2">{l.label}</a>
                </li>
              ))}
          </ul>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-line px-4 pt-6 sm:px-6">
          <p className="mb-4 max-w-4xl text-xs leading-relaxed text-faint">
            <strong className="font-semibold text-muted">Aviso de riesgo.</strong> Operar CFDs y otros productos con
            apalancamiento implica un alto nivel de riesgo y puede ocasionar la pérdida total del capital invertido. ATLAX
            ofrece contenido exclusivamente educativo; nada de lo publicado constituye asesoría financiera ni una
            recomendación de inversión. Los resultados pasados no garantizan resultados futuros.
          </p>
          <p className="text-xs text-faint">©{new Date().getFullYear()} ATLAX. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* CTA fijo en móvil */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 p-3 backdrop-blur-md transition-transform duration-300 lg:hidden ${
          showStickyCta ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!showStickyCta}
      >
        <a href="#cursos" className="btn-primary w-full" tabIndex={showStickyCta ? 0 : -1}>
          Ver cursos y precios
        </a>
      </div>
    </div>
  );
}
