"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import { cambiarEstadoCompra } from "@/services/accionesAdmin"; // <-- NUEVO

// Recorta el hash: ej. e9cad3...71366a
function recortarHash(hash, inicio = 6, fin = 6) {
  if (!hash || hash.length <= inicio + fin) return hash;
  return hash.slice(0, inicio) + "..." + hash.slice(-fin);
}

// Formato de fecha con año de 2 dígitos
const formatFecha = (fecha) => {
  const d = fecha.toDate();
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear().toString().slice(-2)}`;
};

export default function CursosVendidosPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedFirebaseId, setCopiedFirebaseId] = useState(null);

  useEffect(() => {
    async function fetchVentas() {
      try {
        const querySnapshot = await getDocs(collection(db, "compras"));
        const ventasData = [];
        querySnapshot.forEach((docu) => {
          ventasData.push({ id: docu.id, ...docu.data() });
        });
        setVentas(ventasData);
      } catch (error) {
        alert("Error cargando compras: " + error.message);
      }
      setLoading(false);
    }
    fetchVentas();
  }, [cambiandoEstado]);

  // ---- NUEVO: usa la lógica de accionesAdmin ----
  const cambiarEstado = async (venta, nuevoEstado) => {
    setCambiandoEstado(venta.id + nuevoEstado);
    try {
      await cambiarEstadoCompra(venta, nuevoEstado);
    } catch (err) {
      alert("Error al cambiar estado.");
      console.error(err);
    } finally {
      setCambiandoEstado(null);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyFirebaseId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedFirebaseId(id);
    setTimeout(() => setCopiedFirebaseId(null), 1500);
  };

  if (loading) return <p className="text-muted">Cargando ventas…</p>;

  const pendientes = ventas.filter((v) => v.estado !== "APROBADO").length;

  const CopyIcon = ({ copiado }) =>
    copiado ? (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5 9-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ) : (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></svg>
    );

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h2 className="page-title">Cursos vendidos</h2>
        <p className="mt-1 text-sm text-muted">
          <span className="font-mono tabular-nums text-ink">{ventas.length}</span> ventas ·{" "}
          <span className="font-mono tabular-nums text-warn">{pendientes}</span> pendientes de aprobación
        </p>
      </div>
      {ventas.length === 0 ? (
        <div className="panel px-6 py-12 text-center">
          <p className="font-medium text-ink">Todavía no hay ventas</p>
          <p className="mt-1 text-sm text-muted">Las compras hechas desde la landing aparecen acá para aprobarlas.</p>
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Alumno</th>
                <th>Curso</th>
                <th className="text-right">Precio</th>
                <th>Método</th>
                <th>TxID</th>
                <th>Estado</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta, idx) => {
                const aprobado = venta.estado === "APROBADO";
                return (
                  <tr key={venta.id}>
                    <td>
                      <span className="flex items-center gap-1 font-mono tabular-nums text-muted">
                        {idx + 1}
                        <button
                          type="button"
                          aria-label="Copiar ID de Firebase"
                          title={copiedFirebaseId === venta.id ? "¡Copiado!" : "Copiar ID de Firebase"}
                          className={`icon-btn ${copiedFirebaseId === venta.id ? "text-up" : ""}`}
                          onClick={() => handleCopyFirebaseId(venta.id)}
                        >
                          <CopyIcon copiado={copiedFirebaseId === venta.id} />
                        </button>
                      </span>
                    </td>
                    <td className="whitespace-nowrap font-mono tabular-nums text-muted">
                      {venta.fecha && venta.fecha.toDate
                        ? formatFecha(venta.fecha)
                        : venta.fecha || <span className="text-faint">Sin fecha</span>}
                    </td>
                    <td>
                      <div className="font-medium">{venta.nombre || <span className="text-faint">Sin nombre</span>}</div>
                      <div className="text-muted">{venta.email || <span className="text-faint">Sin email</span>}</div>
                    </td>
                    <td>{venta.curso || <span className="text-faint">Sin curso</span>}</td>
                    <td className="whitespace-nowrap text-right font-mono tabular-nums">
                      {venta.precio !== undefined ? `$${venta.precio}` : <span className="text-faint">—</span>}
                    </td>
                    <td className="text-muted">{venta.metodo || <span className="text-faint">—</span>}</td>
                    <td className="whitespace-nowrap">
                      {venta.txid ? (
                        <span className="flex items-center gap-1">
                          <span title={venta.txid} className="chip font-mono">{recortarHash(venta.txid)}</span>
                          <button
                            type="button"
                            aria-label="Copiar TxID"
                            title={copiedId === venta.id ? "¡Copiado!" : "Copiar TxID"}
                            className={`icon-btn ${copiedId === venta.id ? "text-up" : ""}`}
                            onClick={() => handleCopy(venta.id, venta.txid)}
                          >
                            <CopyIcon copiado={copiedId === venta.id} />
                          </button>
                        </span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider ${aprobado ? "text-up" : "text-warn"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${aprobado ? "bg-up" : "bg-warn"}`} aria-hidden="true" />
                        {aprobado ? "Aprobado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="text-right">
                      {aprobado ? (
                        <button
                          className="btn-secondary btn-sm whitespace-nowrap"
                          disabled={!!cambiandoEstado}
                          onClick={() => cambiarEstado(venta, "PENDIENTE")}
                        >
                          {cambiandoEstado === venta.id + "PENDIENTE" ? "Guardando…" : "Revertir"}
                        </button>
                      ) : (
                        <button
                          className="btn-primary btn-sm whitespace-nowrap"
                          disabled={!!cambiandoEstado}
                          onClick={() => cambiarEstado(venta, "APROBADO")}
                        >
                          {cambiandoEstado === venta.id + "APROBADO" ? "Aprobando…" : "Aprobar"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
