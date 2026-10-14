"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  if (loading) return <p className="text-muted">Cargando módulos…</p>;
  const modulos = curso?.modulos || [];

  return (
    <div className="max-w-5xl">
      <nav aria-label="Ubicación" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
        <Link href="/admin/administrar-cursos" className="text-muted underline-offset-4 hover:text-ink hover:underline">
          Administrar cursos
        </Link>
        <span className="text-faint" aria-hidden="true">/</span>
        <span aria-current="page" className="text-ink">{curso?.nombre || "Curso"}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Módulos</h2>
          <p className="mt-1 text-sm text-muted">{curso?.nombre}</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => abrirModal()}>
          + Crear módulo
        </button>
      </div>

      {modulos.length === 0 ? (
        <div className="panel px-6 py-12 text-center">
          <p className="font-medium text-ink">Este curso todavía no tiene módulos</p>
          <p className="mt-1 text-sm text-muted">Creá el primero y después agregale clases.</p>
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th className="text-right">Clases</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {modulos.map((modulo, idx) => (
                <tr key={modulo.id}>
                  <td className="font-mono tabular-nums text-faint">{String(idx + 1).padStart(2, "0")}</td>
                  <td className="font-medium">{modulo.nombre}</td>
                  <td className="text-muted">{modulo.descripcion}</td>
                  <td className="text-right font-mono tabular-nums text-muted">{(modulo.clases || []).length}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => abrirModal(modulo)} className="btn-secondary btn-sm">
                        Editar
                      </button>
                      <Link
                        href={`/admin/administrar-cursos/modulos/${cursoId}/clases/${modulo.id}`}
                        className="btn-secondary btn-sm"
                      >
                        Clases
                      </Link>
                      <button onClick={() => eliminarModulo(modulo.id)} className="btn-danger">
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
          <div role="dialog" aria-modal="true" aria-labelledby="modulo-modal-titulo" className="panel animate-fadein w-full max-w-md p-6 shadow-2xl">
            <h3 id="modulo-modal-titulo" className="mb-5 text-xl font-semibold text-ink">
              {moduloActual ? "Editar módulo" : "Crear módulo"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="field-label" htmlFor="modulo-nombre">Nombre</label>
                <input
                  id="modulo-nombre"
                  type="text"
                  className="field"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="modulo-descripcion">Descripción</label>
                <textarea
                  id="modulo-descripcion"
                  rows={3}
                  className="field resize-y"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary btn-sm" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn-primary btn-sm" onClick={guardarModulo}>
                Guardar módulo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
