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
    className="prose-clase"
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


  // Migas de pan: reemplazan los botones "Volver" y muestran dónde está el alumno.
  const Migas = () => {
    const pasos = [{ label: "Mi programa", vista: "cursos" }];
    if (cursoActivo && vista !== "cursos") pasos.push({ label: cursoActivo.nombre, vista: "modulos" });
    if (moduloActivo != null && (vista === "clases" || vista === "clase"))
      pasos.push({ label: `Módulo ${moduloActivo + 1}`, vista: "clases" });
    if (vista === "clase" && claseActiva != null)
      pasos.push({
        label: cursoActivo.modulos[moduloActivo].clases[claseActiva]?.titulo || `Clase ${claseActiva + 1}`,
        vista: "clase",
      });
    return (
      <nav aria-label="Ubicación" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
        {pasos.map((p, i) => {
          const ultimo = i === pasos.length - 1;
          return (
            <span key={p.vista} className="flex items-center gap-1.5">
              {ultimo ? (
                <span aria-current="page" className="text-ink">{p.label}</span>
              ) : (
                <button onClick={() => setVista(p.vista)} className="text-muted underline-offset-4 hover:text-ink hover:underline">
                  {p.label}
                </button>
              )}
              {!ultimo && <span className="text-faint" aria-hidden="true">/</span>}
            </span>
          );
        })}
      </nav>
    );
  };

  const Flecha = () => (
    <span className="text-faint transition-colors group-hover:text-accent-soft" aria-hidden="true">→</span>
  );

  if (!user) return null;

  const clasesModulo = cursoActivo?.modulos?.[moduloActivo]?.clases || [];
  const esPrimera = claseActiva === 0;
  const esUltima = claseActiva === clasesModulo.length - 1;

  return (
    <div className="max-w-5xl">
      {/* ---- Vista Cursos ---- */}
      {vista === "cursos" && (
        <section>
          <h1 className="page-title mb-1">Hola, trader</h1>
          <p className="mb-8 text-muted">Retomá donde lo dejaste.</p>
          {loadingCursos || loading ? (
            <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Cargando tu programa">
              {[1, 2].map((n) => (
                <div key={n} className="panel animate-pulse p-6">
                  <div className="mb-3 h-5 w-2/3 rounded bg-surface-2" />
                  <div className="mb-2 h-4 rounded bg-surface-2" />
                  <div className="h-4 w-1/2 rounded bg-surface-2" />
                </div>
              ))}
            </div>
          ) : cursos.length === 0 ? (
            <div className="panel px-6 py-12 text-center">
              <p className="font-medium text-ink">Todavía no tenés un plan activo</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Si ya pagaste, tu compra está en revisión. Te avisamos apenas se apruebe.
              </p>
              <a href="/#planes" className="btn-secondary btn-sm mt-5">Ver planes disponibles</a>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {cursos.map((curso, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="panel group flex flex-col p-6 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
                  onClick={() => {
                    setCursoActivo(curso);
                    setVista("modulos");
                  }}
                >
                  <span className="mb-3 font-mono text-xs uppercase tracking-wider text-faint">
                    {(curso.modulos || []).length} módulos
                  </span>
                  <span className="mb-2 text-lg font-semibold text-ink">{curso.nombre}</span>
                  <span className="mb-5 text-sm leading-relaxed text-muted">{curso.descripcion || ""}</span>
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-accent-soft">
                    Entrar <span aria-hidden="true">→</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---- Vista Modulos ---- */}
      {vista === "modulos" && cursoActivo && (
        <section>
          <Migas />
          <h2 className="page-title mb-6">{cursoActivo.nombre}</h2>
          {(cursoActivo.modulos || []).length === 0 ? (
            <p className="text-muted">Este plan todavía no tiene módulos publicados.</p>
          ) : (
            <ol className="panel divide-y divide-line overflow-hidden">
              {(cursoActivo.modulos || []).map((modulo, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    className="group flex w-full items-start gap-5 p-5 text-left transition-colors hover:bg-surface-2"
                    onClick={() => {
                      setModuloActivo(idx);
                      setVista("clases");
                    }}
                  >
                    <span className="pt-0.5 font-mono text-sm tabular-nums text-accent-soft">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="flex-1">
                      <span className="block font-semibold text-ink">{modulo.nombre}</span>
                      {modulo.descripcion && <span className="mt-1 block text-sm text-muted">{modulo.descripcion}</span>}
                      <span className="mt-2 block font-mono text-xs text-faint">{(modulo.clases || []).length} clases</span>
                    </span>
                    <Flecha />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* ---- Vista Clases ---- */}
      {vista === "clases" && cursoActivo && moduloActivo != null && (
        <section>
          <Migas />
          <p className="eyebrow mb-2">Módulo {moduloActivo + 1}</p>
          <h2 className="page-title mb-6">{cursoActivo.modulos[moduloActivo].nombre}</h2>
          {clasesModulo.length === 0 ? (
            <p className="text-muted">Este módulo todavía no tiene clases.</p>
          ) : (
            <ol className="panel divide-y divide-line overflow-hidden">
              {clasesModulo.map((clase, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    className="group flex w-full items-center gap-5 px-5 py-4 text-left transition-colors hover:bg-surface-2"
                    onClick={() => {
                      setClaseActiva(idx);
                      setVista("clase");
                    }}
                  >
                    <span className="font-mono text-sm tabular-nums text-faint">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="flex-1 font-medium text-ink">{clase.titulo || `Clase ${idx + 1}`}</span>
                    <Flecha />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* ---- Vista Clase Individual ---- */}
      {vista === "clase" && cursoActivo && moduloActivo != null && claseActiva != null && (
        <section className="space-y-6">
          <Migas />
          <h2 className="page-title">
            {clasesModulo[claseActiva]?.titulo || `Clase ${claseActiva + 1}`}
          </h2>

          {/* Contenido de la clase */}
          <article className="panel p-6 md:p-8">
            <ContenidoClase html={contenidoClase} />
          </article>

          {/* Navegación entre clases */}
          <div className="flex items-center justify-between gap-3">
            <button
              disabled={esPrimera}
              onClick={() => setClaseActiva((prev) => prev - 1)}
              className="btn-secondary btn-sm"
            >
              ← Clase anterior
            </button>
            <span className="font-mono text-xs tabular-nums text-faint">
              {claseActiva + 1} / {clasesModulo.length}
            </span>
            <button
              disabled={esUltima}
              onClick={() => setClaseActiva((prev) => prev + 1)}
              className="btn-primary btn-sm"
            >
              Siguiente clase →
            </button>
          </div>

          {/* Notas personales */}
          <div className="panel space-y-4 p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-ink">Mis notas</h3>
              {!editNota && (
                <div className="flex gap-2">
                  {nota ? (
                    <>
                      <button className="btn-secondary btn-sm" onClick={() => setEditNota(true)}>Editar</button>
                      <button
                        className="btn-danger"
                        onClick={() => { if (confirm("¿Eliminar esta nota?")) borrarNota(); }}
                      >
                        Eliminar
                      </button>
                    </>
                  ) : (
                    <button className="btn-secondary btn-sm" onClick={() => setEditNota(true)}>+ Agregar nota</button>
                  )}
                </div>
              )}
            </div>

            {editNota ? (
              <div className="space-y-3">
                <label htmlFor="nota-clase" className="sr-only">Nota de la clase</label>
                <textarea
                  id="nota-clase"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={5}
                  className="field resize-y"
                  placeholder="Ideas clave, dudas, setups para practicar…"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditNota(false)} className="btn-secondary btn-sm">Cancelar</button>
                  <button onClick={guardarNota} className="btn-primary btn-sm">Guardar nota</button>
                </div>
              </div>
            ) : (
              <p className={`whitespace-pre-line ${nota ? "text-ink" : "text-faint"}`}>
                {nota || "Todavía no escribiste notas para esta clase."}
              </p>
            )}
            {mensajeNota && (
              <p role="status" className="text-sm text-up">{mensajeNota}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default AlumnosPage;
