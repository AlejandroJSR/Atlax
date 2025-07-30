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

  if (loading) return <p className="text-gray-700">Cargando ventas...</p>;

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-[#2d249c]">Cursos Vendidos</h2>
      {ventas.length === 0 ? (
        <p className="text-gray-500">No hay ventas registradas.</p>
      ) : (
        <div className="w-full bg-white rounded-xl shadow-lg mb-4 overflow-x-auto max-w-full">
          <table className="w-full text-xs md:text-sm text-left">
            <thead>
              <tr className="bg-violet-100">
                <th className="px-2 py-2 font-bold text-[#2d249c] whitespace-nowrap">ID</th>
                <th className="px-2 py-2 font-bold text-[#2d249c] whitespace-nowrap">Fecha</th>
                <th className="px-2 py-2 font-bold text-[#2d249c] whitespace-nowrap">Nombre</th>
                <th className="px-2 py-2 font-bold text-[#2d249c] whitespace-nowrap">Mail</th>
                <th className="px-2 py-2 font-bold text-[#2d249c] whitespace-nowrap">Contraseña</th>
                <th className="px-2 py-2 font-bold text-[#2d249c] whitespace-nowrap">Curso</th>
                <th className="px-2 py-2 font-bold text-[#2d249c] whitespace-nowrap">Precio</th>
                <th className="px-2 py-2 font-bold text-[#2d249c] whitespace-nowrap">Método</th>
                <th className="px-2 py-2 font-bold text-[#2d249c] whitespace-nowrap">TxID</th>
                <th className="px-2 py-2 font-bold text-[#2d249c] whitespace-nowrap">Estado</th>
                <th className="px-2 py-2 font-bold text-[#2d249c] whitespace-nowrap">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta, idx) => (
                <tr
                  key={venta.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {/* Columna ID: número + botón copiar */}
                  <td className="px-2 py-2 text-gray-800 text-center whitespace-nowrap">
                    <span className="flex items-center justify-center gap-2">
                      <span>{idx + 1}</span>
                      <button
                        type="button"
                        aria-label="Copiar ID Firebase"
                        role="button"
                        className={`ml-1 transition rounded-full px-1 py-0.5 ${
                          copiedFirebaseId === venta.id
                            ? "bg-green-200 text-green-700"
                            : "hover:bg-violet-200 text-violet-700"
                        }`}
                        title={
                          copiedFirebaseId === venta.id
                            ? "¡Copiado!"
                            : "Copiar ID Firebase"
                        }
                        onClick={() => handleCopyFirebaseId(venta.id)}
                      >
                        {copiedFirebaseId === venta.id ? "✓" : "📋"}
                      </button>
                    </span>
                  </td>

                  <td className="px-2 py-2 text-gray-800 text-center whitespace-nowrap">
                    {venta.fecha && venta.fecha.toDate
                      ? formatFecha(venta.fecha)
                      : venta.fecha || (
                          <span className="text-gray-400">Sin fecha</span>
                        )}
                  </td>
                  <td className="px-2 py-2 text-gray-900 whitespace-normal break-words">
                    {venta.nombre || (
                      <span className="text-gray-400">Sin nombre</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-gray-900 whitespace-normal break-words">
                    {venta.email || (
                      <span className="text-gray-400">Sin email</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-gray-900 text-center whitespace-nowrap">
                    {venta.password || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-2 py-2 text-gray-900 whitespace-normal break-words">
                    {venta.curso || (
                      <span className="text-gray-400">Sin curso</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-gray-900 text-center whitespace-nowrap">
                    {venta.precio !== undefined ? (
                      `$${venta.precio}`
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-gray-900 whitespace-normal break-words">
                    {venta.metodo || <span className="text-gray-400">-</span>}
                  </td>
                  {/* TxID CHIP + COPY */}
                  <td className="px-2 py-2 text-gray-900 text-xs whitespace-nowrap">
                    {venta.txid ? (
                      <span className="flex items-center gap-2">
                        <span
                          title={venta.txid}
                          className="inline-block bg-violet-100 text-[#2d249c] px-2 py-0.5 rounded-full text-xs max-w-[100px] truncate"
                        >
                          {recortarHash(venta.txid)}
                        </span>
                        <button
                          type="button"
                          aria-label="Copiar TxID"
                          role="button"
                          className={`ml-1 transition rounded-full px-1 py-0.5 ${
                            copiedId === venta.id
                              ? "bg-green-200 text-green-700"
                              : "hover:bg-violet-200 text-violet-700"
                          }`}
                          title={
                            copiedId === venta.id
                              ? "¡Copiado!"
                              : "Copiar TxID"
                          }
                          onClick={() => handleCopy(venta.id, venta.txid)}
                        >
                          {copiedId === venta.id ? "✓" : "📋"}
                        </button>
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td
                    className={`px-2 py-2 font-bold text-center text-[11px] md:text-xs whitespace-nowrap ${
                      venta.estado === "APROBADO"
                        ? "text-green-600"
                        : "text-yellow-700"
                    }`}
                  >
                    {venta.estado || "PENDIENTE"}
                  </td>
                  {/* Botón de acción con ✓ / ✗ */}
                  <td className="px-2 py-2 text-center whitespace-nowrap">
                    {venta.estado !== "APROBADO" ? (
                      <button
                        className="bg-[#2d249c] hover:bg-[#241d74] text-white px-3 py-1 rounded font-semibold text-xs md:text-sm transition disabled:opacity-60"
                        disabled={!!cambiandoEstado}
                        onClick={() => cambiarEstado(venta, "APROBADO")}
                      >
                        {cambiandoEstado === venta.id + "APROBADO" ? "..." : "✓"}
                      </button>
                    ) : (
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded font-semibold text-xs md:text-sm transition disabled:opacity-60"
                        disabled={!!cambiandoEstado}
                        onClick={() => cambiarEstado(venta, "PENDIENTE")}
                      >
                        {cambiandoEstado === venta.id + "PENDIENTE" ? "..." : "✗"}
                      </button>
                    )}
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
