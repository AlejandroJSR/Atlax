"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/services/firebase";
import Link from "next/link";

export default function AdministrarCursosPage() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [cursoActual, setCursoActual] = useState(null);
  const [nuevoBeneficio, setNuevoBeneficio] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    nivel: "Básico",
    precio: 0,
    pagoUnico: true,
    beneficios: [],
    destacado: false,
    activo: true,
  });

  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "cursos"));
    setCursos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const abrirModal = (curso = null) => {
    if (curso) {
      setCursoActual(curso);
      setFormData({
        nombre: curso.nombre || "",
        descripcion: curso.descripcion || "",
        nivel: curso.nivel || "Básico",
        precio: curso.precio || 0,
        pagoUnico: curso.pagoUnico ?? true,
        beneficios: curso.beneficios || [],
        destacado: curso.destacado || false,
        activo: curso.activo ?? true,
      });
    } else {
      setCursoActual(null);
      setFormData({
        nombre: "",
        descripcion: "",
        nivel: "Básico",
        precio: 0,
        pagoUnico: true,
        beneficios: [],
        destacado: false,
        activo: true,
      });
    }
    setModalOpen(true);
  };

  const guardarCurso = async () => {
    if (cursoActual) {
      await updateDoc(doc(db, "cursos", cursoActual.id), formData);
    } else {
      // Nuevo modelo: curso con array vacío de modulos
      const cursoRef = doc(collection(db, "cursos"));
      await setDoc(cursoRef, { ...formData, modulos: [] });
    }
    setModalOpen(false);
    cargarCursos();
  };

  const eliminarCurso = async (cursoId) => {
    if (confirm("¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.")) {
      await deleteDoc(doc(db, "cursos", cursoId));
      cargarCursos();
    }
  };

  const agregarBeneficio = () => {
    if (nuevoBeneficio.trim() !== "") {
      setFormData({
        ...formData,
        beneficios: [...formData.beneficios, nuevoBeneficio.trim()],
      });
      setNuevoBeneficio("");
    }
  };

  const eliminarBeneficio = (index) => {
    const nuevos = [...formData.beneficios];
    nuevos.splice(index, 1);
    setFormData({ ...formData, beneficios: nuevos });
  };

  if (loading) return <p className="text-gray-900">Cargando cursos...</p>;

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-[#2d249c]">Administrar Cursos</h2>
      <button
        className="mb-4 bg-[#2d249c] text-white px-4 py-2 rounded hover:bg-[#241d74]"
        onClick={() => abrirModal()}
      >
        Crear Curso
      </button>

      {cursos.length === 0 ? (
        <p className="text-gray-900">No hay cursos registrados.</p>
      ) : (
        <div className="w-full bg-white rounded-xl shadow-lg mb-4 overflow-x-auto max-w-full">
          <table className="w-full text-xs md:text-sm text-left">
            <thead>
              <tr className="bg-violet-100 text-gray-900">
                <th className="px-2 py-2 font-bold">Nombre</th>
                <th className="px-2 py-2 font-bold">Precio</th>
                <th className="px-2 py-2 font-bold">Activo</th>
                <th className="px-2 py-2 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((curso) => (
                <tr key={curso.id} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-2 text-gray-900">{curso.nombre}</td>
                  <td className="px-2 py-2 text-gray-900">${curso.precio}</td>
                  <td className="px-2 py-2 text-gray-900">{curso.activo ? "Sí" : "No"}</td>
                  <td className="px-2 py-2 flex gap-2 flex-wrap">
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                      onClick={() => abrirModal(curso)}
                    >
                      Editar
                    </button>
                    <Link href={`/admin/administrar-cursos/modulos/${curso.id}`}>
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded">
                        Módulos
                      </button>
                    </Link>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      onClick={() => eliminarCurso(curso.id)}
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
          <div className="bg-white p-6 rounded-lg w-full max-w-lg text-gray-900">
            <h3 className="text-lg font-bold mb-4">
              {cursoActual ? "Editar Curso" : "Crear Curso"}
            </h3>
            <label className="block mb-2">
              Nombre:
              <input
                type="text"
                className="w-full border rounded p-2 text-gray-900"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </label>
            <label className="block mb-2">
              Descripción:
              <textarea
                className="w-full border rounded p-2 text-gray-900"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </label>
            <label className="block mb-2">
              Nivel:
              <input
                type="text"
                className="w-full border rounded p-2 text-gray-900"
                value={formData.nivel}
                onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
              />
            </label>
            <label className="block mb-2">
              Precio:
              <input
                type="number"
                className="w-full border rounded p-2 text-gray-900"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
              />
            </label>
            <div className="flex gap-2 mb-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.destacado}
                  onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
                />
                Destacado
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                />
                Activo
              </label>
            </div>

            <h4 className="font-bold mb-2">Beneficios:</h4>
            <ul className="mb-2">
              {formData.beneficios.map((b, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span>{b}</span>
                  <button
                    className="text-red-500 text-sm"
                    onClick={() => eliminarBeneficio(index)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                className="border rounded p-2 flex-1"
                value={nuevoBeneficio}
                onChange={(e) => setNuevoBeneficio(e.target.value)}
                placeholder="Agregar beneficio"
              />
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={agregarBeneficio}
              >
                +
              </button>
            </div>

            <div className="flex justify-end mt-4">
              <button
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded mr-2"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="bg-[#2d249c] hover:bg-[#241d74] text-white px-4 py-2 rounded"
                onClick={guardarCurso}
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
