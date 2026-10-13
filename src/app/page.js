"use client";
import "@/styles/index.css";
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

  return (
    <>
      {/* NAVBAR */}
      <nav className="bg-black/70 backdrop-blur-md fixed w-full z-50 top-0 left-0 shadow-md h-16 flex items-center">
        <span className="text-2xl font-extrabold text-[#5b47db] pl-7 tracking-widest">
          ATLAX
        </span>
        <ul className="hidden md:flex items-center gap-10 ml-auto pr-7">
          <li><a className="font-extrabold text-white hover:text-indigo-300 transition" href="#inicio">Inicio</a></li>
          <li><a className="font-extrabold text-white hover:text-indigo-300 transition" href="#cursos">Cursos</a></li>
          <li><a className="font-extrabold text-white hover:text-indigo-300 transition" href="#testimonios">Testimonios</a></li>
          <li><a className="font-extrabold text-white hover:text-indigo-300 transition" href="#contacto">Contacto</a></li>
          <li>
            <button
              className="bg-indigo-700 font-extrabold text-white rounded-lg px-5 py-1.5 ml-2 transition hover:bg-indigo-900 shadow"
              onClick={() => setShowLogin(true)} type="button">
              ACCESO
            </button>
          </li>
        </ul>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white text-3xl pr-7 ml-auto focus:outline-none">
          ☰
        </button>
        {menuOpen && (
          <div className="absolute top-16 left-0 w-full bg-black/90 backdrop-blur-md flex flex-col gap-4 p-5 md:hidden">
            <a className="font-bold text-white" href="#inicio" onClick={() => setMenuOpen(false)}>Inicio</a>
            <a className="font-bold text-white" href="#cursos" onClick={() => setMenuOpen(false)}>Cursos</a>
            <a className="font-bold text-white" href="#testimonios" onClick={() => setMenuOpen(false)}>Testimonios</a>
            <a className="font-bold text-white" href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
            <button
              className="bg-indigo-700 font-bold text-white rounded px-4 py-2 mt-2"
              onClick={() => { setShowLogin(true); setMenuOpen(false); }}>
              ACCESO
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
  className="relative gradient-bg pt-32 pb-24 text-white min-h-[420px] overflow-hidden"
>
  <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center px-7 z-10">
    {/* Texto con animación */}
    <div className="md:w-1/2 text-center md:text-left animate-fadeInUp">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-7 leading-tight">
        Domina el Mercado Forex con Atlax
      </h1>
      <p className="text-lg sm:text-xl mb-8 text-indigo-100 font-medium max-w-md mx-auto md:mx-0">
        Aprende estrategias efectivas de la mano de expertos con años de experiencia en los mercados financieros.
      </p>

      {/* Botón igual al de las cards */}
      <a
        href="#cursos"
        className="btn-gradient font-bold py-3 px-8 rounded text-lg shadow-lg transition-transform duration-300 transform hover:scale-110"
      >
        Empieza Ahora
      </a>
    </div>

    {/* Imagen con animación de flotación */}
    <div className="md:w-1/2 flex justify-center mt-10 md:mt-0 animate-fadeInUp">
      <img
        src="https://i.ibb.co/99DmNSw6/Dise-o-sin-t-tulo-7-Photoroom.png"
        alt="Trading"
        className="w-[340px] md:w-[520px] lg:w-[580px] rounded-xl drop-shadow-xl 
                   transition-transform duration-500 ease-in-out hover:-translate-y-3 animate-float"
      />
    </div>
  </div>
</section>


      <div className="w-full bg-black flex justify-center py-2">
        <TradingViewWidget />
      </div>

      {/* FEATURES */}
<section className="bg-black py-14">
  <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 px-7">
    <div className="flex flex-col items-center text-center">
      <div className="bg-white/20 rounded-full p-3 mb-4">
        <img src="https://img.icons8.com/fluency/96/monitor.png" alt="" className="w-12 h-12" />
      </div>
      <p className="text-lg font-medium leading-relaxed text-gray-200">
        Aprendé de <span className="font-bold text-indigo-300">traders rentables</span> con años de experiencia real en el mercado.
      </p>
    </div>
    <div className="flex flex-col items-center text-center">
      <div className="bg-white/20 rounded-full p-3 mb-4">
        <img src="https://img.icons8.com/fluency/96/ask-question.png" alt="" className="w-12 h-12" />
      </div>
      <p className="text-lg font-medium leading-relaxed text-gray-200">
        Respondemos <span className="font-bold text-indigo-300">consultas personalizadas</span> y te acompañamos en todo tu proceso.
      </p>
    </div>
    <div className="flex flex-col items-center text-center">
      <div className="bg-white/20 rounded-full p-3 mb-4">
        <img src="https://img.icons8.com/fluency/96/conference-call.png" alt="" className="w-12 h-12" />
      </div>
      <p className="text-lg font-medium leading-relaxed text-gray-200">
        Accedé a una <span className="font-bold text-indigo-300">red activa de traders</span> para estar al día con las novedades del mercado.
      </p>
    </div>
  </div>
</section>


      {/* CURSOS */}
      <section id="cursos" className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4 text-white">Nuestros Cursos</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">Elige el programa que mejor se adapte a tus necesidades y objetivos.</p>
          </div>
          {loadingCursos ? (
            <p className="text-white text-center">Cargando cursos...</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {cursos.map((curso) => (
                <div
                  key={curso.id}
                  className={`curso-card p-7 relative card-hover transition-all duration-300 ${curso.destacado ? "border-2 border-indigo-700 shadow-xl z-10" : ""}`}
                >
                  {curso.destacado && (
                    <span className="absolute -top-5 left-4 badge-popular text-xs py-1 px-4 rounded-full font-bold shadow-lg">
                      Destacado
                    </span>
                  )}
                  <h3 className="font-bold text-xl mb-2 text-indigo-900">{curso.nombre}</h3>
                  <p className="mb-4 text-gray-700">{curso.descripcion}</p>
                  <span className="inline-block badge-basic font-bold px-4 py-1 rounded-lg text-sm mb-2">
                    Nivel: {curso.nivel}
                  </span>
                  <ul className="mb-4 mt-2 text-sm text-gray-800 list-disc pl-4">
                    {curso.beneficios?.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                  <div className="flex items-center mb-4">
                    <span className="text-2xl font-bold text-indigo-700 mr-1">${curso.precio}</span>
                    <span className="text-gray-400 text-md font-semibold">/pago único</span>
                  </div>
                  <button onClick={() => handleComprar(curso)} className="w-full btn-gradient font-bold py-2 px-4 rounded">
                    Comprar Ahora
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODAL DE COMPRA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[3px]">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl animate-fadein flex flex-col max-h-[95vh] min-h-[400px] my-6">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-5 text-2xl text-gray-400 hover:text-indigo-700">×</button>
            <div className="pt-6 pb-2 px-4 sm:px-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Completa tu compra</h2>
              <div className="font-bold text-lg text-gray-900 mb-1">
                Curso Seleccionado:{" "}
                <span className="text-indigo-700 underline">{cursoSeleccionado.nombre}</span>
              </div>
              <div className="text-gray-700 text-base">
                Precio: <span className="font-bold">${cursoSeleccionado.precio}</span> (pago único)
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-bold mb-1 text-gray-900" htmlFor="nombre">Nombre completo</label>
                  <input type="text" id="nombre" name="nombre" required className="w-full border rounded px-4 py-2 text-gray-900 font-medium focus:outline-indigo-700" value={form.nombre} onChange={handleInput} autoComplete="name" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-gray-900" htmlFor="email">Correo electrónico</label>
                  <input type="email" id="email" name="email" required className="w-full border rounded px-4 py-2 text-gray-900 font-medium focus:outline-indigo-700" value={form.email} onChange={handleInput} autoComplete="email" />
                  <div className="text-xs text-gray-500 pl-1 mt-1">Este email se usará para acceder a la plataforma de estudio.</div>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-gray-900" htmlFor="password">Contraseña</label>
                  <input type="password" id="password" name="password" required className="w-full border rounded px-4 py-2 text-gray-900 font-medium focus:outline-indigo-700" value={form.password} onChange={handleInput} autoComplete="new-password" />
                  <div className="text-xs text-gray-500 pl-1 mt-1">Esta contraseña te servirá para iniciar sesión en tu cuenta de estudiante.</div>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-gray-900">Método de pago</label>
                  <select name="metodo" className="w-full border rounded px-4 py-2 text-gray-900 font-medium focus:outline-indigo-700" value={form.metodo} onChange={handleInput}>
                    <option>PayPal</option>
                    <option>Transferencia USDT</option>
                  </select>
                </div>
                {form.metodo === "Transferencia USDT" && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-5 text-sm mb-2 shadow flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-indigo-900 text-base">
                        Transferencia en USDT • <span className="font-medium">TRON (TRC20)</span>
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-indigo-900">Dirección de depósito:</span>
                      <a href="https://tronscan.org/" target="_blank" rel="noopener noreferrer"
                        className="ml-2 px-2 py-1 bg-indigo-50 text-indigo-900 rounded-lg font-mono text-xs underline hover:bg-indigo-100 break-all transition">
                        TBJzaDGosSyhtUPC7BkH9TMgGQDMAC3U6K
                      </a>
                    </div>
                    <div>
                      <span className="font-bold text-indigo-900">ID de Transacción / TXID:</span>
                      <input type="text" name="txid" className="w-full mt-1 border border-indigo-200 rounded px-3 py-1 text-gray-900 font-mono font-medium bg-white focus:border-indigo-500" placeholder="Pega tu TXID aquí" value={form.txid} onChange={handleInput} />
                    </div>
                  </div>
                )}
                <div className="w-full flex gap-4 mt-2 flex-col md:flex-row">
                  <button type="button" className="bg-gray-200 text-gray-900 rounded px-6 py-2 font-bold hover:bg-gray-300 transition" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" disabled={enviando} className="bg-indigo-900 text-white rounded px-6 py-2 font-bold hover:bg-indigo-700 transition">{enviando ? "Procesando..." : "Confirmar Compra"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

{/* TESTIMONIOS */}
<section id="testimonios" className="py-20 bg-gray-50">
  <div className="max-w-6xl mx-auto px-4">
    <div className="text-center mb-16">
      <h2 className="text-3xl font-extrabold mb-4 text-gray-800">
        Historias de Éxito
      </h2>
      <p className="text-gray-600 max-w-2xl mx-auto">
        Lo que nuestros estudiantes dicen sobre Atlax
      </p>
    </div>
    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
      {testimonios.map((t, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center transition-transform hover:scale-105"
        >
          <img
            src={t.img}
            alt={t.nombre}
            className="rounded-full w-20 h-20 mb-4 ring-4 ring-indigo-100 shadow-md"
          />
          <h3 className="font-bold text-xl mb-1 text-gray-900">{t.nombre}</h3>
          <p className="text-gray-500 text-sm mb-4 font-medium">{t.rol}</p>
          {/* Texto con comillas normales al inicio y final (sin absolute) */}
          <p className="text-gray-700 italic relative">
            <span className="text-indigo-400 text-2xl mr-1">&ldquo;</span>
            {t.texto}
            <span className="text-indigo-400 text-2xl ml-1">&rdquo;</span>
          </p>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* CONTACTO */}
      <section id="contacto" className="py-20 gradient-bg text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">¿Listo para Transformar tu Trading?</h2>
            <p className="opacity-90 max-w-2xl mx-auto">Déjanos tus datos y nos pondremos en contacto contigo para resolver todas tus dudas.</p>
          </div>
          <div className="max-w-xl mx-auto bg-[#181d2a] bg-opacity-95 rounded-lg shadow-lg p-8">
            <form className="space-y-6">
              <input type="text" placeholder="Tu nombre completo" className="w-full border rounded px-4 py-2 bg-white text-black" />
              <input type="email" placeholder="Tu correo electrónico" className="w-full border rounded px-4 py-2 bg-white text-black" />
              <textarea placeholder="Cuéntanos tu objetivo" className="w-full border rounded px-4 py-2 bg-white text-black" />
              <button type="submit" className="btn-gradient font-bold w-full py-2 rounded mt-2">Enviar mensaje</button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-6">Empieza Tu Viaje en el Trading Hoy</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Únete a miles de traders que han transformado sus resultados con nuestros cursos.</p>
          <a href="#cursos" className="btn-gradient font-bold py-3 px-8 rounded-lg shadow-lg inline-block">¡Quiero Empezar!</a>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4 text-gray-700">Preguntas Frecuentes</h2>
            <p className="text-gray-600">Resolvemos tus dudas más comunes sobre nuestros cursos.</p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <details key={i} className="p-4 rounded-lg shadow bg-white group" open={i === 0}>
                <summary className="font-bold text-indigo-900 cursor-pointer text-lg group-open:mb-2">
                  {faq.pregunta}
                </summary>
                <div className="text-gray-700">{faq.respuesta}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-2xl font-extrabold text-[#5b47db] mb-2">ATLAX</span>
            <p className="text-gray-400 max-w-xs">Cursos de trading diseñados para transformar tu educación financiera y potenciar tus resultados en los mercados.</p>
          </div>
          <ul className="flex gap-8 font-bold">
            <li><a href="#inicio" className="hover:text-indigo-300">Inicio</a></li>
            <li><a href="#cursos" className="hover:text-indigo-300">Cursos</a></li>
            <li><a href="#testimonios" className="hover:text-indigo-300">Testimonios</a></li>
            <li><a href="#contacto" className="hover:text-indigo-300">Contacto</a></li>
          </ul>
          <div className="text-gray-400 text-xs mt-4 md:mt-0">© {new Date().getFullYear()} ATLAX. Todos los derechos reservados.</div>
        </div>
      </footer>
    </>
  );
}
