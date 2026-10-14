"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";

// CKEditor usa window al importarse: solo se puede cargar en el cliente.
const ClaseEditor = dynamic(() => import("@/components/ClaseEditor"), {
  ssr: false,
  loading: () => <p className="text-muted">Cargando editor…</p>,
});

export default function ClasesPage() {
  const { cursoId, moduloId } = useParams();
  const router = useRouter();
  const [curso, setCurso] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const cargarCurso = async () => {
    const cursoRef = doc(db, "cursos", cursoId);
    const cursoSnap = await getDoc(cursoRef);
    if (cursoSnap.exists()) {
      setCurso({ id: cursoSnap.id, ...cursoSnap.data() });
    }
  };

  useEffect(() => {
    cargarCurso();
  }, []);

  const getModuloActual = () => curso?.modulos.find((m) => m.id === moduloId) || null;
  const clases = getModuloActual()?.clases || [];

  const actualizarClases = async (nuevasClases) => {
    const modulosActualizados = curso.modulos.map((m) =>
      m.id === moduloId ? { ...m, clases: nuevasClases } : m
    );
    await updateDoc(doc(db, "cursos", cursoId), { modulos: modulosActualizados });
    cargarCurso();
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar esta clase?")) {
      const nuevasClases = clases.filter((c) => c.id !== id);
      await actualizarClases(nuevasClases);
    }
  };

  const handleNew = () => {
    setEditing({ titulo: "", contenido: "" });
    setIsNew(true);
  };

  const handleSaveNew = async (data) => {
    const nuevasClases = [...clases, { id: uuidv4(), ...data, fechaCreacion: new Date() }];
    await actualizarClases(nuevasClases);
    setEditing(null);
    setIsNew(false);
  };

  const handleUpdate = async (id, data) => {
    const nuevasClases = clases.map((c) =>
      c.id === id ? { ...c, ...data, fechaActualizacion: new Date() } : c
    );
    await actualizarClases(nuevasClases);
    setEditing(null);
    setIsNew(false);
  };

  const handleBack = () => {
    setEditing(null);
    setIsNew(false);
  };

  if (editing) {
    return (
      <ClaseEditor
        cursoId={cursoId}
        moduloId={moduloId}
        claseId={isNew ? null : editing.id}
        initialData={editing}
        onBack={handleBack}
        onSave={(data) =>
          isNew ? handleSaveNew(data) : handleUpdate(editing.id, data)
        }
        onDelete={
          isNew
            ? null
            : async () => {
                await handleDelete(editing.id);
                handleBack();
              }
        }
      />
    );
  }


  const modulo = getModuloActual();

  return (
    <div className="max-w-5xl">
      <nav aria-label="Ubicación" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
        <Link href="/admin/administrar-cursos" className="text-muted underline-offset-4 hover:text-ink hover:underline">
          Administrar cursos
        </Link>
        <span className="text-faint" aria-hidden="true">/</span>
        <Link href={`/admin/administrar-cursos/modulos/${cursoId}`} className="text-muted underline-offset-4 hover:text-ink hover:underline">
          {curso?.nombre || "Curso"}
        </Link>
        <span className="text-faint" aria-hidden="true">/</span>
        <span aria-current="page" className="text-ink">{modulo?.nombre || "Módulo"}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Clases</h2>
          <p className="mt-1 text-sm text-muted">{modulo?.nombre}</p>
        </div>
        <button onClick={handleNew} className="btn-primary btn-sm">
          + Crear clase
        </button>
      </div>

      {!curso ? (
        <p className="text-muted">Cargando clases…</p>
      ) : clases.length === 0 ? (
        <div className="panel px-6 py-12 text-center">
          <p className="font-medium text-ink">Este módulo todavía no tiene clases</p>
          <p className="mt-1 text-sm text-muted">Creá la primera: título, video y material de apoyo.</p>
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Título</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clases.map((clase, idx) => (
                <tr key={clase.id}>
                  <td className="font-mono tabular-nums text-faint">{String(idx + 1).padStart(2, "0")}</td>
                  <td className="font-medium">{clase.titulo || <span className="text-faint">Sin título</span>}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing(clase);
                          setIsNew(false);
                        }}
                        className="btn-secondary btn-sm"
                      >
                        Editar
                      </button>
                      <button onClick={() => handleDelete(clase.id)} className="btn-danger">
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
    </div>
  );
}
