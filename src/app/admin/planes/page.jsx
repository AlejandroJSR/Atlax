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
    if (confirm("¿Estás seguro de eliminar este plan? Esta acción no se puede deshacer.")) {
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


  if (loading) return <p className="text-muted">Cargando planes…</p>;

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="page-title">Administrar planes</h2>
        <button className="btn-primary btn-sm" onClick={() => abrirModal()}>
          + Crear plan
        </button>
      </div>

      {cursos.length === 0 ? (
        <div className="panel px-6 py-12 text-center">
          <p className="font-medium text-ink">Todavía no hay planes</p>
          <p className="mt-1 text-sm text-muted">Creá el primero para que aparezca en la landing.</p>
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th className="text-right">Precio</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((curso) => (
                <tr key={curso.id}>
                  <td className="font-medium">
                    {curso.nombre}
                    {curso.destacado && <span className="chip ml-2 border-accent/50 text-accent-soft">Destacado</span>}
                  </td>
                  <td className="text-right font-mono tabular-nums">${curso.precio}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 text-sm ${curso.activo ? "text-up" : "text-faint"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${curso.activo ? "bg-up" : "bg-faint"}`} aria-hidden="true" />
                      {curso.activo ? "Publicado" : "Oculto"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary btn-sm" onClick={() => abrirModal(curso)}>
                        Editar
                      </button>
                      <Link href={`/admin/planes/modulos/${curso.id}`} className="btn-secondary btn-sm">
                        Módulos
                      </Link>
                      <button className="btn-danger" onClick={() => eliminarCurso(curso.id)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="curso-modal-titulo" className="panel animate-fadein flex max-h-[95vh] w-full max-w-lg flex-col shadow-2xl">
            <h3 id="curso-modal-titulo" className="border-b border-line px-6 py-5 text-xl font-semibold text-ink">
              {cursoActual ? "Editar plan" : "Crear plan"}
            </h3>
            <div className="space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <label className="field-label" htmlFor="curso-nombre">Nombre</label>
                <input
                  id="curso-nombre"
                  type="text"
                  className="field"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="curso-descripcion">Descripción</label>
                <textarea
                  id="curso-descripcion"
                  rows={3}
                  className="field resize-y"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="curso-nivel">Nivel</label>
                  <input
                    id="curso-nivel"
                    type="text"
                    className="field"
                    value={formData.nivel}
                    onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="curso-precio">Precio (USD)</label>
                  <input
                    id="curso-precio"
                    type="number"
                    className="field font-mono tabular-nums"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--accent)]"
                    checked={formData.destacado}
                    onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
                  />
                  Destacado
                </label>
                <label className="flex items-center gap-2 text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--accent)]"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                  Publicado en la landing
                </label>
              </div>

              <div>
                <span className="field-label">Beneficios</span>
                {formData.beneficios.length > 0 && (
                  <ul className="mb-3 divide-y divide-line rounded-md border border-line">
                    {formData.beneficios.map((b, index) => (
                      <li key={index} className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-ink">
                        <span>{b}</span>
                        <button className="text-sm text-down hover:underline" onClick={() => eliminarBeneficio(index)}>
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <label htmlFor="curso-beneficio" className="sr-only">Nuevo beneficio</label>
                  <input
                    id="curso-beneficio"
                    type="text"
                    className="field flex-1"
                    value={nuevoBeneficio}
                    onChange={(e) => setNuevoBeneficio(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarBeneficio(); } }}
                    placeholder="Ej.: Acceso vitalicio"
                  />
                  <button className="btn-secondary btn-sm" onClick={agregarBeneficio}>
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
              <button className="btn-secondary btn-sm" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn-primary btn-sm" onClick={guardarCurso}>
                Guardar plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
