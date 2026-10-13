"use client";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/services/firebase";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [cursoEditando, setCursoEditando] = useState(null);
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [cursosSeleccionados, setCursosSeleccionados] = useState([]);

  // Modal crear usuario
  const [showModal, setShowModal] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "alumno",
  });
  const [cursosNuevoUsuario, setCursosNuevoUsuario] = useState([]);

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        const usuariosData = [];
        querySnapshot.forEach((docu) => {
          usuariosData.push({ id: docu.id, ...docu.data() });
        });
        setUsuarios(usuariosData);
      } catch (error) {
        alert("Error cargando usuarios: " + error.message);
      }
      setLoading(false);
    }
    fetchUsuarios();
  }, []);

  useEffect(() => {
    async function fetchCursos() {
      const querySnapshot = await getDocs(collection(db, "cursos"));
      const cursos = [];
      querySnapshot.forEach((docu) => {
        const data = docu.data();
        cursos.push({ id: docu.id, ...data });
      });
      setCursosDisponibles(cursos);
    }
    fetchCursos();
  }, []);

  const handleCopyFirebaseId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSeleccionCurso = (cursoId) => {
    setCursosSeleccionados((prev) =>
      prev.includes(cursoId)
        ? prev.filter((id) => id !== cursoId)
        : [...prev, cursoId]
    );
  };

  const handleGuardarCurso = async (usuarioId) => {
    try {
      const nuevosCursos = cursosSeleccionados.map((cursoId) => {
        const cursoData = cursosDisponibles.find((c) => c.id === cursoId);
        return { cursoId, nombre: cursoData?.nombre || "" };
      });
      const usuarioRef = doc(db, "usuarios", usuarioId);
      await updateDoc(usuarioRef, { cursos: nuevosCursos });
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioId ? { ...u, cursos: nuevosCursos } : u
        )
      );
      setCursoEditando(null);
      setCursosSeleccionados([]);
    } catch (error) {
      alert("Error actualizando cursos: " + error.message);
    }
  };

  const handleEliminarUsuario = async (usuarioId) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      await deleteDoc(doc(db, "usuarios", usuarioId));
      setUsuarios((prev) => prev.filter((u) => u.id !== usuarioId));
      setCursoEditando(null);
    } catch (error) {
      alert("Error eliminando usuario: " + error.message);
    }
  };

  const handleCambiarRol = async (usuario) => {
    try {
      const nuevoRol =
        usuario.rol === "administrador" ? "alumno" : "administrador";
      const nuevosCursos = nuevoRol === "alumno" ? [] : [];

      await updateDoc(doc(db, "usuarios", usuario.id), {
        rol: nuevoRol,
        cursos: nuevosCursos,
      });

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, rol: nuevoRol, cursos: nuevosCursos } : u
        )
      );

      setCursoEditando(null);
      alert(`Rol cambiado a ${nuevoRol}`);
    } catch (error) {
      alert("Error al cambiar el rol: " + error.message);
    }
  };

  const handleCrearUsuario = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        nuevoUsuario.email,
        nuevoUsuario.password
      );

      const cursosAsignados =
        nuevoUsuario.rol === "alumno"
          ? cursosNuevoUsuario.map((cursoId) => {
              const cursoData = cursosDisponibles.find((c) => c.id === cursoId);
              return { cursoId, nombre: cursoData?.nombre || "" };
            })
          : [];

      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        cursos: cursosAsignados,
        creadoEn: new Date().toISOString(),
      });

      setUsuarios((prev) => [
        ...prev,
        {
          id: cred.user.uid,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          rol: nuevoUsuario.rol,
          cursos: cursosAsignados,
        },
      ]);

      setShowModal(false);
      setNuevoUsuario({ nombre: "", email: "", password: "", rol: "alumno" });
      setCursosNuevoUsuario([]);
    } catch (error) {
      alert("Error creando usuario: " + error.message);
    }
  };

  const filteredUsers = usuarios.filter(
    (usuario) =>
      usuario.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <p className="text-muted">Cargando usuarios…</p>;

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Usuarios</h2>
          <p className="mt-1 text-sm text-muted">
            <span className="font-mono tabular-nums text-ink">{usuarios.length}</span> cuentas registradas
          </p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowModal(true)}>
          + Crear usuario
        </button>
      </div>

      <label htmlFor="buscar-usuario" className="sr-only">Buscar usuario</label>
      <input
        id="buscar-usuario"
        type="search"
        placeholder="Buscar por nombre o email"
        className="field mb-4 max-w-md"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
      />

      <div className="panel overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-20">#</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Cursos asignados</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted">
                  {search ? `Ningún usuario coincide con "${search}".` : "Todavía no hay usuarios. Creá el primero."}
                </td>
              </tr>
            )}
            {currentUsers.map((usuario, index) => (
              <tr key={usuario.id}>
                <td>
                  <span className="flex items-center gap-1 font-mono tabular-nums text-muted">
                    {indexOfFirst + index + 1}
                    <button
                      type="button"
                      className={`icon-btn ${copiedId === usuario.id ? "text-up" : ""}`}
                      onClick={() => handleCopyFirebaseId(usuario.id)}
                      aria-label="Copiar ID de Firebase"
                      title={copiedId === usuario.id ? "¡Copiado!" : "Copiar ID de Firebase"}
                    >
                      {copiedId === usuario.id ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5 9-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></svg>
                      )}
                    </button>
                  </span>
                </td>
                <td className="font-medium">{usuario.nombre}</td>
                <td className="text-muted">{usuario.email}</td>
                <td>
                  {usuario.rol === "administrador" ? (
                    <span className="chip border-accent/50 text-accent-soft">Administrador</span>
                  ) : cursoEditando === usuario.id ? (
                    <fieldset className="flex flex-col gap-2">
                      <legend className="sr-only">Cursos de {usuario.nombre}</legend>
                      {cursosDisponibles.map((curso) => (
                        <label key={curso.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[var(--accent)]"
                            checked={cursosSeleccionados.includes(curso.id)}
                            onChange={() => handleSeleccionCurso(curso.id)}
                          />
                          <span>{curso.nombre}</span>
                        </label>
                      ))}
                    </fieldset>
                  ) : usuario.cursos?.length ? (
                    <span className="flex flex-wrap gap-1.5">
                      {usuario.cursos.map((c, i) => (
                        <span key={i} className="chip">{c.nombre}</span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-faint">Sin cursos</span>
                  )}
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    {cursoEditando === usuario.id ? (
                      usuario.rol === "administrador" ? (
                        <>
                          <button onClick={() => setCursoEditando(null)} className="btn-secondary btn-sm">Cancelar</button>
                          <button onClick={() => handleCambiarRol(usuario)} className="btn-secondary btn-sm">Pasar a alumno</button>
                          <button onClick={() => handleEliminarUsuario(usuario.id)} className="btn-danger">Eliminar</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setCursoEditando(null)} className="btn-secondary btn-sm">Cancelar</button>
                          <button onClick={() => handleGuardarCurso(usuario.id)} className="btn-primary btn-sm">Guardar cursos</button>
                        </>
                      )
                    ) : (
                      <button
                        onClick={() => {
                          setCursoEditando(usuario.id);
                          setCursosSeleccionados(usuario.cursos?.map((c) => c.cursoId) || []);
                        }}
                        className="btn-secondary btn-sm"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-end gap-1" aria-label="Paginación">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => handlePageChange(n)}
              aria-current={n === currentPage ? "page" : undefined}
              className={`h-9 min-w-9 rounded-md px-2 font-mono text-sm tabular-nums transition-colors ${
                n === currentPage ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {n}
            </button>
          ))}
        </nav>
      )}

      {/* Modal crear usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="crear-usuario-titulo" className="panel animate-fadein w-full max-w-md p-6 shadow-2xl">
            <h3 id="crear-usuario-titulo" className="mb-5 text-xl font-semibold text-ink">Crear usuario</h3>
            <div className="space-y-4">
              <div>
                <label className="field-label" htmlFor="nu-nombre">Nombre</label>
                <input
                  id="nu-nombre"
                  className="field"
                  value={nuevoUsuario.nombre}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="nu-email">Correo electrónico</label>
                <input
                  id="nu-email"
                  className="field"
                  type="email"
                  value={nuevoUsuario.email}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="nu-password">Contraseña</label>
                <input
                  id="nu-password"
                  className="field"
                  type="password"
                  autoComplete="new-password"
                  value={nuevoUsuario.password}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="nu-rol">Rol</label>
                <select
                  id="nu-rol"
                  className="field"
                  value={nuevoUsuario.rol}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
                >
                  <option value="alumno">Alumno</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              {nuevoUsuario.rol === "alumno" && (
                <fieldset>
                  <legend className="field-label">Asignar cursos</legend>
                  <div className="flex flex-col gap-2">
                    {cursosDisponibles.length === 0 ? (
                      <p className="text-sm text-faint">No hay cursos disponibles.</p>
                    ) : (
                      cursosDisponibles.map((curso) => (
                        <label key={curso.id} className="flex items-center gap-2 text-ink">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[var(--accent)]"
                            checked={cursosNuevoUsuario.includes(curso.id)}
                            onChange={() =>
                              setCursosNuevoUsuario((prev) =>
                                prev.includes(curso.id)
                                  ? prev.filter((id) => id !== curso.id)
                                  : [...prev, curso.id]
                              )
                            }
                          />
                          <span>{curso.nombre}</span>
                        </label>
                      ))
                    )}
                  </div>
                </fieldset>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary btn-sm" onClick={handleCrearUsuario}>Crear usuario</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
