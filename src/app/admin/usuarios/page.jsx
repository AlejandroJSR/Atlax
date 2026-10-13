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

  if (loading) return <p className="text-gray-700">Cargando usuarios...</p>;

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold text-[#2d249c]">Usuarios</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => setShowModal(true)}
        >
          Crear Usuario
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o email"
        className="border rounded px-4 py-2 mb-4 w-full max-w-md text-gray-900 placeholder-gray-500 bg-white"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
      />

      <div className="w-full bg-white rounded-xl shadow-lg mb-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-violet-100 text-[#2d249c]">
            <tr>
              <th className="px-4 py-2 font-bold text-left">ID</th>
              <th className="px-4 py-2 font-bold text-left">Nombre</th>
              <th className="px-4 py-2 font-bold text-left">Email</th>
              <th className="px-4 py-2 font-bold text-left">Cursos asignados</th>
              <th className="px-4 py-2 font-bold text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((usuario, index) => (
              <tr
                key={usuario.id}
                className={`${
                  index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                } text-gray-900`}
              >
                <td className="px-4 py-2 flex items-center gap-2">
                  <span>{indexOfFirst + index + 1}</span>
                  <button
                    type="button"
                    className={`text-xs rounded px-2 py-1 transition ${
                      copiedId === usuario.id
                        ? "bg-green-200 text-green-700"
                        : "hover:bg-violet-200 text-violet-700"
                    }`}
                    onClick={() => handleCopyFirebaseId(usuario.id)}
                  >
                    {copiedId === usuario.id ? "✓" : "📋"}
                  </button>
                </td>
                <td className="px-4 py-2">{usuario.nombre}</td>
                <td className="px-4 py-2">{usuario.email}</td>
                <td className="px-4 py-2">
                  {usuario.rol === "administrador" ? (
                    <span className="text-indigo-700 font-semibold">
                      Administrador
                    </span>
                  ) : cursoEditando === usuario.id ? (
                    <div className="flex flex-col gap-2">
                      {cursosDisponibles.map((curso) => (
                        <label key={curso.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={cursosSeleccionados.includes(curso.id)}
                            onChange={() => handleSeleccionCurso(curso.id)}
                          />
                          <span className="text-gray-900 font-medium">
                            {curso.nombre}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : usuario.cursos?.length ? (
                    usuario.cursos.map((c, i) => (
                      <span
                        key={i}
                        className="mr-2 inline-block bg-indigo-100 text-indigo-700 px-2 py-1 rounded"
                      >
                        {c.nombre}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">Sin cursos</span>
                  )}
                </td>
                <td className="px-4 py-2 flex gap-2">
                  {cursoEditando === usuario.id ? (
                    usuario.rol === "administrador" ? (
                      <>
                        <button
                          onClick={() => handleCambiarRol(usuario)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded"
                        >
                          Cambiar Rol
                        </button>
                        <button
                          onClick={() => handleEliminarUsuario(usuario.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Eliminar Usuario
                        </button>
                        <button
                          onClick={() => setCursoEditando(null)}
                          className="bg-gray-400 text-white px-3 py-1 rounded"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleGuardarCurso(usuario.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setCursoEditando(null)}
                          className="bg-gray-400 text-white px-3 py-1 rounded"
                        >
                          Cancelar
                        </button>
                      </>
                    )
                  ) : (
                    <button
                      onClick={() => {
                        setCursoEditando(usuario.id);
                        setCursosSeleccionados(
                          usuario.cursos?.map((c) => c.cursoId) || []
                        );
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Crear Usuario</h3>
            <input
              className="border p-2 w-full mb-3 text-gray-900"
              placeholder="Nombre"
              value={nuevoUsuario.nombre}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
              }
            />
            <input
              className="border p-2 w-full mb-3 text-gray-900"
              placeholder="Correo electrónico"
              type="email"
              value={nuevoUsuario.email}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })
              }
            />
            <input
              className="border p-2 w-full mb-3 text-gray-900"
              placeholder="Contraseña"
              type="password"
              value={nuevoUsuario.password}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
              }
            />
            <select
              className="border p-2 w-full mb-3 text-gray-900"
              value={nuevoUsuario.rol}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })
              }
            >
              <option value="alumno">Alumno</option>
              <option value="administrador">Administrador</option>
            </select>

            {nuevoUsuario.rol === "alumno" && (
              <div className="mb-4">
                <p className="font-semibold mb-2 text-gray-900">
                  Asignar cursos:
                </p>
                <div className="flex flex-col gap-2">
                  {cursosDisponibles.length === 0 ? (
                    <p className="text-gray-500">No hay cursos disponibles</p>
                  ) : (
                    cursosDisponibles.map((curso) => (
                      <label
                        key={curso.id}
                        className="flex items-center gap-2 text-gray-900"
                      >
                        <input
                          type="checkbox"
                          className="accent-indigo-600"
                          checked={cursosNuevoUsuario.includes(curso.id)}
                          onChange={() =>
                            setCursosNuevoUsuario((prev) =>
                              prev.includes(curso.id)
                                ? prev.filter((id) => id !== curso.id)
                                : [...prev, curso.id]
                            )
                          }
                        />
                        <span className="font-medium">{curso.nombre}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={handleCrearUsuario}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
