"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

function transformarContenidoHTML(html) {
  if (typeof window === "undefined" || !html) return "<p>Sin contenido</p>";

  const parser = new DOMParser();
  const docHtml = parser.parseFromString(html, "text/html");

  docHtml.querySelectorAll("oembed[url]").forEach((el) => {
    const url = el.getAttribute("url");
    const iframe = document.createElement("iframe");
    iframe.setAttribute(
      "src",
      url.includes("youtube") ? url.replace("watch?v=", "embed/") : url
    );
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "true");

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.paddingBottom = "56.25%";
    wrapper.style.height = "0";
    wrapper.style.overflow = "hidden";
    wrapper.style.borderRadius = "8px";
    wrapper.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";

    iframe.style.position = "absolute";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";

    wrapper.appendChild(iframe);
    el.parentNode.replaceChild(wrapper, el);
  });

  return docHtml.body.innerHTML;
}

const ContenidoClase = React.memo(({ html }) => (
  <div
    className="leading-relaxed text-gray-900"
    dangerouslySetInnerHTML={{ __html: html }}
  />
));
ContenidoClase.displayName = "ContenidoClase";

function AlumnosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [vista, setVista] = useState("cursos");
  const [cursos, setCursos] = useState([]);
  const [cursoActivo, setCursoActivo] = useState(null);
  const [moduloActivo, setModuloActivo] = useState(null);
  const [claseActiva, setClaseActiva] = useState(null);

  const [loadingCursos, setLoadingCursos] = useState(true);
  const [nota, setNota] = useState("");
  const [editNota, setEditNota] = useState(false);
  const [mensajeNota, setMensajeNota] = useState("");

  const [contenidoClase, setContenidoClase] = useState("<p>Cargando...</p>");

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  // Cargar cursos aprobados del usuario
  useEffect(() => {
    if (!user) return;
    const cargarCursosAprobados = async () => {
      setLoadingCursos(true);
      const usuarioRef = doc(db, "usuarios", user.uid);
      const usuarioSnap = await getDoc(usuarioRef);
      if (!usuarioSnap.exists()) {
        setCursos([]);
        setLoadingCursos(false);
        return;
      }
      const usuarioData = usuarioSnap.data();
      const cursosAprobados = usuarioData.cursos || [];

      const cursosDetallados = await Promise.all(
        cursosAprobados.map(async (c) => {
          const cursoRef = doc(db, "cursos", c.cursoId);
          const cursoSnap = await getDoc(cursoRef);
          if (!cursoSnap.exists()) return null;
          const cursoData = cursoSnap.data();
          return { id: c.cursoId, ...cursoData };
        })
      );
      setCursos(cursosDetallados.filter(Boolean));
      setLoadingCursos(false);
    };
    cargarCursosAprobados();
  }, [user]);

  const getClaseKey = () => {
    if (!cursoActivo || moduloActivo == null || claseActiva == null) return null;
    const moduloId = cursoActivo.modulos[moduloActivo].id;
    const claseId = cursoActivo.modulos[moduloActivo].clases[claseActiva].id;
    return `${cursoActivo.id}_${moduloId}_${claseId}`;
  };

  useEffect(() => {
    const cargarNota = async () => {
      if (!user || !getClaseKey()) return;
      const notaRef = doc(db, "notas", user.uid, "clases", getClaseKey());
      const notaSnap = await getDoc(notaRef);
      if (notaSnap.exists()) {
        setNota(notaSnap.data().contenido);
      } else {
        setNota("");
      }
      setEditNota(false);
    };
    if (vista === "clase") cargarNota();
  }, [vista, claseActiva, user]);

  const guardarNota = async () => {
    if (!user || !getClaseKey()) return;
    await setDoc(doc(db, "notas", user.uid, "clases", getClaseKey()), {
      contenido: nota,
      fechaActualizacion: new Date().toISOString(),
    });
    setEditNota(false);
    setMensajeNota("Nota guardada correctamente");
    setTimeout(() => setMensajeNota(""), 1500);
  };

  const borrarNota = async () => {
    if (!user || !getClaseKey()) return;
    await deleteDoc(doc(db, "notas", user.uid, "clases", getClaseKey()));
    setNota("");
    setEditNota(false);
    setMensajeNota("Nota eliminada");
    setTimeout(() => setMensajeNota(""), 1500);
  };

  useEffect(() => {
    const cargarContenidoClase = async () => {
      if (!cursoActivo || moduloActivo == null || claseActiva == null) return;
      const cursoRef = doc(db, "cursos", cursoActivo.id);
      const cursoSnap = await getDoc(cursoRef);
      if (cursoSnap.exists()) {
        const cursoData = cursoSnap.data();
        const contenidoReal = cursoData.modulos
          .find((m) => m.id === cursoActivo.modulos[moduloActivo].id)
          .clases.find(
            (c) =>
              c.id === cursoActivo.modulos[moduloActivo].clases[claseActiva].id
          ).contenido;

        const nuevosCursos = [...cursos];
        const cursoIndex = nuevosCursos.findIndex((c) => c.id === cursoActivo.id);
        if (cursoIndex !== -1) {
          nuevosCursos[cursoIndex].modulos[moduloActivo].clases[
            claseActiva
          ].contenido = contenidoReal;
          setCursos(nuevosCursos);
        }
      }
    };
    if (vista === "clase") cargarContenidoClase();
  }, [vista, claseActiva, cursoActivo, moduloActivo, cursos]);

  useEffect(() => {
    const html =
      cursoActivo?.modulos?.[moduloActivo]?.clases?.[claseActiva]?.contenido ||
      "<p>Cargando...</p>";
    setContenidoClase(transformarContenidoHTML(html));
  }, [cursoActivo?.id, moduloActivo, claseActiva]);

  const BotonVolver = ({ onClick, texto }) => (
    <button
      onClick={onClick}
      className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
    >
      ← {texto}
    </button>
  );

  if (!user) return null;

  return (
    <main className="p-4 md:p-8 text-gray-900">
      {vista === "cursos" && (
        <h1 className="text-3xl font-bold text-indigo-900 mb-6">
          ¡Hola, <span>Trader</span>!
        </h1>
      )}

      {/* ---- Vista Cursos ---- */}
      {vista === "cursos" && (
        <section>
          {loadingCursos || loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-6 border rounded-lg shadow bg-gray-100 animate-pulse"
                >
                  <div className="h-6 bg-gray-300 rounded w-2/3 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="mt-4 h-8 bg-gray-300 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : cursos.length === 0 ? (
            <div className="col-span-full text-gray-500">
              No tenés cursos aprobados todavía.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cursos.map((curso, idx) => (
                <div
                  key={idx}
                  className="p-6 border rounded-lg shadow hover:shadow-lg transition bg-white cursor-pointer"
                  onClick={() => {
                    setCursoActivo(curso);
                    setVista("modulos");
                  }}
                >
                  <h3 className="font-bold text-lg mb-2 text-indigo-700">
                    {curso.nombre}
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    {curso.descripcion || ""}
                  </p>
                  <span className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
                    Entrar
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---- Vista Modulos ---- */}
      {vista === "modulos" && cursoActivo && (
        <section>
          <BotonVolver texto="Volver a cursos" onClick={() => setVista("cursos")} />
          <h2 className="text-2xl font-semibold mb-6 text-indigo-800">
            {cursoActivo.nombre} - Módulos
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {(cursoActivo.modulos || []).map((modulo, idx) => (
              <div
                key={idx}
                className="p-4 bg-white border rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => {
                  setModuloActivo(idx);
                  setVista("clases");
                }}
              >
                <h3 className="font-bold text-lg text-indigo-700 mb-2">
                  {`Módulo ${idx + 1}: ${modulo.nombre}`}
                </h3>
                <p className="text-gray-600">{modulo.descripcion || ""}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Vista Clases ---- */}
      {vista === "clases" && cursoActivo && moduloActivo != null && (
        <section>
          <BotonVolver texto="Volver a módulos" onClick={() => setVista("modulos")} />
          <h2 className="text-2xl font-semibold mb-6 text-indigo-800">
            {cursoActivo.modulos[moduloActivo].nombre} - Clases
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {(cursoActivo.modulos[moduloActivo].clases || []).map((clase, idx) => (
              <div
                key={idx}
                className="p-4 bg-white border rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => {
                  setClaseActiva(idx);
                  setVista("clase");
                }}
              >
                <h4 className="font-bold text-indigo-700">
                  {clase.titulo || `Clase ${idx + 1}`}
                </h4>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Vista Clase Individual ---- */}
      {vista === "clase" && cursoActivo && moduloActivo != null && claseActiva != null && (
        <section className="max-w-5xl mx-auto space-y-8">
          <BotonVolver texto="Volver a clases" onClick={() => setVista("clases")} />

          {/* Contenido de la clase */}
          <div className="bg-white rounded shadow p-6">
            <ContenidoClase html={contenidoClase} />
          </div>

          {/* Botones de navegación de clases */}
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={claseActiva === 0}
              onClick={() => setClaseActiva((prev) => prev - 1)}
              className={`px-4 py-2 rounded transition ${
                claseActiva === 0
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              ← Clase anterior
            </button>
            <button
              disabled={
                claseActiva === cursoActivo.modulos[moduloActivo].clases.length - 1
              }
              onClick={() => setClaseActiva((prev) => prev + 1)}
              className={`px-4 py-2 rounded transition ${
                claseActiva ===
                cursoActivo.modulos[moduloActivo].clases.length - 1
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              Siguiente clase →
            </button>
          </div>

          {/* Notas personales */}
          <div className="bg-white border rounded shadow p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-indigo-700">Notas personales</h3>
              {!editNota && (
                <div className="flex gap-4">
                  {nota ? (
                    <>
                      <button
                        className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        onClick={() => setEditNota(true)}
                      >
                        Editar
                      </button>
                      <button
                        className="px-4 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                        onClick={borrarNota}
                      >
                        Eliminar
                      </button>
                    </>
                  ) : (
                    <button
                      className="px-4 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                      onClick={() => setEditNota(true)}
                    >
                      Agregar nota
                    </button>
                  )}
                </div>
              )}
            </div>

            {editNota ? (
              <div className="space-y-3">
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  className="w-full h-32 border rounded p-2 focus:ring focus:ring-indigo-300"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={guardarNota}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditNota(false)}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 whitespace-pre-line">
                {nota || "Sin notas aún."}
              </p>
            )}
            {mensajeNota && <p className="text-green-600 text-sm">{mensajeNota}</p>}
          </div>
        </section>
      )}
    </main>
  );
}

export default AlumnosPage;
