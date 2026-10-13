"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

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

const testimonios = [
  {
    nombre: "Carlos Mendoza",
    rol: "Trader Independiente",
    texto:
      "Con Atlax aprendí a controlar el riesgo y ahora opero con mucha más confianza.",
    img: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    nombre: "Lucía Fernández",
    rol: "Inversionista",
    texto:
      "Me encantó la metodología. Las clases grabadas y el grupo privado son clave.",
    img: "https://randomuser.me/api/portraits/women/26.jpg",
  },
  {
    nombre: "Javier Rojas",
    rol: "Emprendedor",
    texto:
      "Las mentorías personalizadas me ayudaron a profesionalizar mi trading.",
    img: "https://randomuser.me/api/portraits/men/73.jpg",
  },
];

const faqs = [
  {
    pregunta: "¿Necesito experiencia previa para tomar los cursos?",
    respuesta: "No, puedes empezar desde cero y avanzar a tu ritmo.",
  },
  {
    pregunta: "¿Los cursos incluyen acceso vitalicio?",
    respuesta: "¡Sí! Podrás verlos las veces que necesites.",
  },
  {
    pregunta: "¿Puedo pagar desde cualquier país?",
    respuesta: "Sí, aceptamos PayPal, transferencia y otras opciones internacionales.",
  },
  {
    pregunta: "¿Recibo certificado al finalizar?",
    respuesta: "Sí, al completar los cursos recibirás tu certificado digital.",
  },
];

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

  const handleComprar = (curso) => {
    setCursoSeleccionado(curso);
    setShowModal(true);
  };

  const handleInput = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleLoginInput = (e) =>
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

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
        `¡Gracias, ${form.nombre}! Tu compra fue registrada, pendiente de aprobación.`
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
      alert("Error al crear usuario o registrar compra.");
    } finally {
      setEnviando(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

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
      setLoginError("Usuario o contraseña incorrectos.");
    } finally {
      setLoginLoading(false);
      setShowLogin(false);
    }
  };

  const navLinks = [
    { href: "#cursos", label: "Cursos" },
    { href: "#metodo", label: "Método" },
    { href: "#testimonios", label: "Alumnos" },
    { href: "#faq", label: "Preguntas" },
    { href: "#contacto", label: "Contacto" },
  ];

  return (
    <>
      {/* NAVBAR */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <a href="#inicio" className="flex items-center gap-2 font-mono text-lg font-medium tracking-[0.2em] text-ink">
            <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-accent" aria-hidden="true" />
            ATLAX
          </a>
          <ul className="ml-auto hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a className="rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:text-ink" href={l.href}>
                  {l.label}
                </a>
              </li>
            ))}
            <li className="ml-3">
              <button className="btn-secondary btn-sm" onClick={() => setShowLogin(true)} type="button">
                Acceso alumnos
              </button>
            </li>
          </ul>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-md text-ink md:hidden"
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
          <div className="flex flex-col border-t border-line bg-bg px-4 pb-5 pt-2 md:hidden">
            {navLinks.map((l) => (
              <a key={l.href} className="border-b border-line py-3.5 text-ink" href={l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
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
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
          <div className="relative bg-white/70 backdrop-blur-xl rounded-xl shadow-xl w-full max-w-xs p-7 z-10">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-red-600" onClick={() => setShowLogin(false)}>
              <span className="text-xl">&times;</span>
            </button>
            <h2 className="text-xl font-bold text-indigo-900 mb-4 text-center">Acceso alumnos</h2>
            <form className="flex flex-col gap-3" onSubmit={handleLogin}>
              <input type="email" name="email" required className="border rounded px-3 py-2 text-gray-900"
                placeholder="Correo electrónico" value={loginForm.email} onChange={handleLoginInput} />
              <input type="password" name="password" required className="border rounded px-3 py-2 text-gray-900"
                placeholder="Contraseña" value={loginForm.password} onChange={handleLoginInput} />
              <button type="submit" className="bg-indigo-700 hover:bg-indigo-900 text-white font-bold py-2 rounded mt-2"
                disabled={loginLoading}>
                {loginLoading ? "Ingresando..." : "Ingresar"}
              </button>
              {loginError && <div className="text-red-600 text-xs mt-1 text-center">{loginError}</div>}
            </form>
            <div className="text-gray-700 text-xs text-center mt-3">
              El acceso solo está habilitado para cuentas aprobadas.
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section
        id="inicio"
        className="relative overflow-hidden border-b border-line pt-16"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 75% 40%, rgba(198,244,50,0.08), transparent 70%), linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "auto, 48px 48px, 48px 48px",
        }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-28">
          <div className="animate-fadeInUp">
            <p className="eyebrow mb-5">Escuela de trading Forex</p>
            <h1 className="mb-6 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Domina el mercado Forex con Atlax
            </h1>
            <p className="mb-9 max-w-md text-lg leading-relaxed text-muted">
              Estrategias, gestión de riesgo y psicología del trading, de la mano de traders que operan todos los días.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#cursos" className="btn-primary">
                Ver cursos
                <span aria-hidden="true">→</span>
              </a>
              <button type="button" onClick={() => setShowLogin(true)} className="btn-secondary">
                Ya soy alumno
              </button>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              src="https://i.ibb.co/99DmNSw6/Dise-o-sin-t-tulo-7-Photoroom.png"
              alt="Plataforma de trading con gráficos de velas"
              width={580}
              height={420}
              className="h-auto w-full max-w-[560px]"
            />
          </div>
        </div>
      </section>

      <div className="w-full border-b border-line bg-bg py-1">
        <TradingViewWidget />
      </div>

      {/* MÉTODO */}
      <section id="metodo" className="border-b border-line py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="eyebrow mb-3">Método</p>
          <h2 className="mb-12 max-w-xl text-3xl font-semibold tracking-tight text-ink">
            Aprendés operando, no mirando teoría
          </h2>
          <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              ["Traders rentables", "Te enseñan personas con años de experiencia real en el mercado, no presentadores."],
              ["Consultas personalizadas", "Respondemos tus dudas y revisamos tus operaciones durante todo el proceso."],
              ["Comunidad activa", "Un grupo privado de traders para seguir las novedades del mercado día a día."],
            ].map(([titulo, texto], i) => (
              <li key={titulo} className="border-t border-line-strong pt-5">
                <span className="mb-3 block font-mono text-sm text-accent">0{i + 1}</span>
                <h3 className="mb-2 text-lg font-semibold text-ink">{titulo}</h3>
                <p className="leading-relaxed text-muted">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CURSOS */}
      <section id="cursos" className="border-b border-line py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-3">Cursos</p>
              <h2 className="text-3xl font-semibold tracking-tight text-ink">Elegí tu programa</h2>
            </div>
            <p className="max-w-sm text-muted">Pago único, acceso de por vida y certificado al terminar.</p>
          </div>
          {loadingCursos ? (
            <div className="grid gap-6 md:grid-cols-3" aria-busy="true" aria-label="Cargando cursos">
              {[1, 2, 3].map((n) => (
                <div key={n} className="panel h-[380px] animate-pulse p-7">
                  <div className="mb-4 h-5 w-2/3 rounded bg-surface-2" />
                  <div className="mb-2 h-4 rounded bg-surface-2" />
                  <div className="mb-8 h-4 w-1/2 rounded bg-surface-2" />
                  <div className="h-8 w-24 rounded bg-surface-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {cursos.map((curso) => (
                <article
                  key={curso.id}
                  className={`relative flex flex-col rounded-lg border bg-surface p-7 transition-colors ${
                    curso.destacado ? "border-accent" : "border-line hover:border-line-strong"
                  }`}
                >
                  {curso.destacado && (
                    <span className="absolute -top-3 left-6 rounded-sm bg-accent px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-accent-ink">
                      Más elegido
                    </span>
                  )}
                  <p className="mb-3 font-mono text-xs uppercase tracking-wider text-faint">Nivel {curso.nivel}</p>
                  <h3 className="mb-2 text-xl font-semibold text-ink">{curso.nombre}</h3>
                  <p className="mb-6 leading-relaxed text-muted">{curso.descripcion}</p>
                  <ul className="mb-8 space-y-2.5 text-sm text-ink">
                    {curso.beneficios?.map((b, i) => (
                      <li key={i} className="flex gap-2.5">
                        <svg className="mt-0.5 h-4 w-4 flex-none text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <div className="mb-5 flex items-baseline gap-2">
                      <span className="font-mono text-3xl font-medium tabular-nums text-ink">${curso.precio}</span>
                      <span className="text-sm text-faint">pago único</span>
                    </div>
                    <button
                      onClick={() => handleComprar(curso)}
                      className={`w-full ${curso.destacado ? "btn-primary" : "btn-secondary"}`}
                    >
                      Comprar curso
                    </button>
                  </div>
                </article>
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
              <p className="eyebrow mb-2">Completa tu compra</p>
              <h2 id="compra-titulo" className="mb-1 pr-8 text-2xl font-semibold text-ink">{cursoSeleccionado.nombre}</h2>
              <p className="text-muted">
                <span className="font-mono tabular-nums text-ink">${cursoSeleccionado.precio}</span> · pago único
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
                  <input type="password" id="password" name="password" required className="field" value={form.password} onChange={handleInput} autoComplete="new-password" />
                  <p className="mt-1.5 text-xs text-faint">La contraseña de tu cuenta de alumno.</p>
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
                    <p className="font-medium text-ink">
                      USDT · red <span className="font-mono">TRON (TRC20)</span>
                    </p>
                    <div>
                      <span className="field-label">Dirección de depósito</span>
                      <a href="https://tronscan.org/" target="_blank" rel="noopener noreferrer"
                        className="block break-all rounded border border-line bg-bg px-3 py-2 font-mono text-xs text-accent hover:border-accent">
                        TBJzaDGosSyhtUPC7BkH9TMgGQDMAC3U6K
                      </a>
                    </div>
                    <div>
                      <label className="field-label" htmlFor="txid">ID de transacción (TXID)</label>
                      <input type="text" id="txid" name="txid" className="field font-mono text-sm" placeholder="Pega tu TXID aquí" value={form.txid} onChange={handleInput} />
                    </div>
                  </div>
                )}
                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" disabled={enviando} className="btn-primary">{enviando ? "Procesando…" : "Confirmar compra"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TESTIMONIOS */}
      <section id="testimonios" className="border-b border-line py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="eyebrow mb-3">Alumnos</p>
          <h2 className="mb-12 text-3xl font-semibold tracking-tight text-ink">Lo que dicen quienes ya operan</h2>
          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {testimonios.map((t) => (
              <figure key={t.nombre} className="flex flex-col border-t border-line-strong pt-6">
                <blockquote className="mb-6 flex-1 text-lg leading-relaxed text-ink">
                  &ldquo;{t.texto}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <img src={t.img} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 rounded-full grayscale" />
                  <div>
                    <div className="text-sm font-semibold text-ink">{t.nombre}</div>
                    <div className="text-sm text-faint">{t.rol}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-line py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow mb-3">Preguntas</p>
            <h2 className="text-3xl font-semibold tracking-tight text-ink">Preguntas frecuentes</h2>
          </div>
          <div className="border-t border-line">
            {faqs.map((faq, i) => (
              <details key={i} className="group border-b border-line" open={i === 0}>
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {faq.pregunta}
                  <svg className="h-5 w-5 flex-none text-muted transition-transform group-open:rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="pb-5 pr-10 leading-relaxed text-muted">{faq.respuesta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Contacto</p>
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-ink">¿Listo para transformar tu trading?</h2>
            <p className="max-w-md leading-relaxed text-muted">
              Dejanos tus datos y te ayudamos a elegir el programa que encaja con tu nivel.
            </p>
          </div>
          <form className="panel space-y-5 p-6 sm:p-8">
            <div>
              <label className="field-label" htmlFor="contacto-nombre">Nombre completo</label>
              <input id="contacto-nombre" type="text" autoComplete="name" className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="contacto-email">Correo electrónico</label>
              <input id="contacto-email" type="email" autoComplete="email" className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="contacto-objetivo">¿Cuál es tu objetivo?</label>
              <textarea id="contacto-objetivo" rows={4} className="field resize-y" />
            </div>
            <button type="submit" className="btn-primary w-full">Enviar mensaje</button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="flex items-center gap-2 font-mono text-lg font-medium tracking-[0.2em] text-ink">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-accent" aria-hidden="true" />
              ATLAX
            </span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Cursos de trading para que operes con método y gestión de riesgo.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-x-10 gap-y-1 text-sm sm:flex sm:gap-2">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-block py-2.5 text-muted hover:text-ink sm:px-2">{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto mt-8 max-w-6xl px-4 font-mono text-xs text-faint sm:px-6">
          © {new Date().getFullYear()} ATLAX. Todos los derechos reservados.
        </div>
      </footer>
    </>
  );
}
