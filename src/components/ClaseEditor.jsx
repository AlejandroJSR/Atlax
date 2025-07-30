"use client";
import React, { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export default function ClaseEditor({ initialData, onSave, onDelete, onBack }) {
  const [titulo, setTitulo] = useState(initialData?.titulo || "");
  const [contenido, setContenido] = useState(initialData?.contenido || "");
  const [guardando, setGuardando] = useState(false);

  const handleSave = async () => {
    setGuardando(true);
    await onSave({ titulo, contenido });
    setGuardando(false);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {initialData?.id ? "Editar Clase" : "Crear Clase"}
      </h2>

      <input
        type="text"
        className="w-full p-3 border rounded-lg mb-4 text-gray-900"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título de la clase"
      />

      <div className="border rounded-lg mb-4">
        <CKEditor
          editor={ClassicEditor}
          data={contenido}
          onChange={(_, editor) => setContenido(editor.getData())}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={guardando}
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg"
          >
            Eliminar
          </button>
        )}
        <button
          onClick={onBack}
          className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
