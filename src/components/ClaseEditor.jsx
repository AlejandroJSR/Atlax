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
    <div className="max-w-4xl">
      <button onClick={onBack} className="mb-6 text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
        ← Volver a las clases
      </button>
      <h2 className="page-title mb-6">
        {initialData?.id ? "Editar clase" : "Crear clase"}
      </h2>

      <div className="space-y-5">
        <div>
          <label className="field-label" htmlFor="clase-titulo">Título de la clase</label>
          <input
            id="clase-titulo"
            type="text"
            className="field"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div>
          <span className="field-label">Contenido</span>
          <p className="mb-2 text-xs text-faint">Pegá un link de YouTube para insertar el video.</p>
          <div className="overflow-hidden rounded-md border border-line">
            <CKEditor
              editor={ClassicEditor}
              data={contenido}
              onChange={(_, editor) => setContenido(editor.getData())}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        {onDelete ? (
          <button onClick={onDelete} className="btn-danger">
            Eliminar clase
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button onClick={onBack} className="btn-secondary btn-sm">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={guardando} className="btn-primary btn-sm">
            {guardando ? "Guardando…" : "Guardar clase"}
          </button>
        </div>
      </div>
    </div>
  );
}
