"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { v4 as uuidv4 } from "uuid";
import ClaseEditor from "@/components/ClaseEditor";

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

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-[#2d249c]">Clases del módulo</h2>
      <button
        onClick={() => router.back()}
        className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        ← Volver
      </button>
      <button
        onClick={handleNew}
        className="mb-4 ml-2 bg-[#2d249c] text-white px-4 py-2 rounded hover:bg-[#241d74]"
      >
        Crear Clase
      </button>

      {clases.length === 0 ? (
        <p className="text-gray-900">No hay clases creadas</p>
      ) : (
        <div className="w-full bg-white rounded-xl shadow-lg mb-4 overflow-x-auto max-w-full">
          <table className="w-full text-xs md:text-sm text-left">
            <thead>
              <tr className="bg-violet-100 text-gray-900">
                <th className="px-2 py-2 font-bold">Título</th>
                <th className="px-2 py-2 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clases.map((clase) => (
                <tr key={clase.id} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-2 text-gray-900">{clase.titulo}</td>
                  <td className="px-2 py-2 flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(clase);
                        setIsNew(false);
                      }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(clase.id)}
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
    </div>
  );
}
