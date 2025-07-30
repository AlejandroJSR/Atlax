"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { v4 as uuidv4 } from "uuid";

export default function ModulosPage() {
  const { cursoId } = useParams();
  const router = useRouter();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [moduloActual, setModuloActual] = useState(null);
  const [formData, setFormData] = useState({ nombre: "", descripcion: "" });

  useEffect(() => {
    cargarCurso();
  }, [cursoId]);

  const cargarCurso = async () => {
    setLoading(true);
    const cursoRef = doc(db, "cursos", cursoId);
    const cursoSnap = await getDoc(cursoRef);
    if (cursoSnap.exists()) {
      setCurso({ id: cursoSnap.id, ...cursoSnap.data() });
    }
    setLoading(false);
  };

  const abrirModal = (modulo = null) => {
    if (modulo) {
      setModuloActual(modulo);
      setFormData({ nombre: modulo.nombre, descripcion: modulo.descripcion });
    } else {
      setModuloActual(null);
      setFormData({ nombre: "", descripcion: "" });
    }
    setModalOpen(true);
  };

  const guardarModulo = async () => {
    const cursoRef = doc(db, "cursos", cursoId);
    const modulosActualizados = moduloActual
      ? curso.modulos.map((m) =>
          m.id === moduloActual.id ? { ...m, ...formData } : m
        )
      : [...(curso.modulos || []), { id: uuidv4(), ...formData, clases: [] }];

    await updateDoc(cursoRef, { modulos: modulosActualizados });
    setModalOpen(false);
    cargarCurso();
  };

  const eliminarModulo = async (id) => {
    if (confirm("¿Eliminar este módulo?")) {
      const cursoRef = doc(db, "cursos", cursoId);
      const modulosFiltrados = curso.modulos.filter((m) => m.id !== id);
      await updateDoc(cursoRef, { modulos: modulosFiltrados });
      cargarCurso();
    }
  };

  if (loading) return <p className="text-gray-900">Cargando módulos...</p>;
  const modulos = curso?.modulos || [];

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-[#2d249c]">Módulos del curso</h2>
      <button
        onClick={() => router.back()}
        className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        ← Volver
      </button>
      <button
        className="mb-4 ml-2 bg-[#2d249c] text-white px-4 py-2 rounded hover:bg-[#241d74]"
        onClick={() => abrirModal()}
      >
        Crear Módulo
      </button>

      {modulos.length === 0 ? (
        <p className="text-gray-900">No hay módulos registrados.</p>
      ) : (
        <div className="w-full bg-white rounded-xl shadow-lg mb-4 overflow-x-auto max-w-full">
          <table className="w-full text-xs md:text-sm text-left">
            <thead>
              <tr className="bg-violet-100 text-gray-900">
                <th className="px-2 py-2 font-bold">Nombre</th>
                <th className="px-2 py-2 font-bold">Descripción</th>
                <th className="px-2 py-2 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {modulos.map((modulo) => (
                <tr key={modulo.id} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-2 text-gray-900">{modulo.nombre}</td>
                  <td className="px-2 py-2 text-gray-900">{modulo.descripcion}</td>
                  <td className="px-2 py-2 flex gap-2">
                    <button
                      onClick={() => abrirModal(modulo)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/admin/administrar-cursos/modulos/${cursoId}/clases/${modulo.id}`
                        )
                      }
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Clases
                    </button>
                    <button
                      onClick={() => eliminarModulo(modulo.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md text-gray-900">
            <h3 className="text-lg font-bold mb-4">
              {moduloActual ? "Editar Módulo" : "Crear Módulo"}
            </h3>
            <label className="block mb-2">
              Nombre:
              <input
                type="text"
                className="w-full border rounded p-2 text-gray-900"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </label>
            <label className="block mb-2">
              Descripción:
              <textarea
                className="w-full border rounded p-2 text-gray-900"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
              />
            </label>
            <div className="flex justify-end mt-4">
              <button
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded mr-2"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="bg-[#2d249c] hover:bg-[#241d74] text-white px-4 py-2 rounded"
                onClick={guardarModulo}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

