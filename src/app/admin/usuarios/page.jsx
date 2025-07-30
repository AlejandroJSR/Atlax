"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const querySnapshot = await getDocs(collection(db, "compras"));
        const usuariosData = [];
        querySnapshot.forEach((docu) => {
          const data = docu.data();
          if (data.estado === "APROBADO") {
            usuariosData.push({ id: docu.id, ...data });
          }
        });
        setUsuarios(usuariosData);
      } catch (error) {
        alert("Error cargando usuarios: " + error.message);
      }
      setLoading(false);
    }
    fetchUsuarios();
  }, []);

  const handleCopyFirebaseId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredUsers = usuarios.filter(
    (usuario) =>
      usuario.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <p className="text-gray-700">Cargando usuarios...</p>;

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-[#2d249c]">Usuarios</h2>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar por nombre o email"
        className="border rounded px-4 py-2 mb-4 w-full max-w-md text-gray-900 placeholder-gray-500 bg-white"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
      />

      {filteredUsers.length === 0 ? (
        <p className="text-gray-500">
          No hay usuarios aprobados que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="w-full bg-white rounded-xl shadow-lg mb-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-violet-100 text-[#2d249c]">
              <tr>
                <th className="px-4 py-2 font-bold text-left">ID</th>
                <th className="px-4 py-2 font-bold text-left">Nombre</th>
                <th className="px-4 py-2 font-bold text-left">Email</th>
                <th className="px-4 py-2 font-bold text-left">Contraseña</th>
                <th className="px-4 py-2 font-bold text-left">Curso</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((usuario, index) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 flex items-center gap-2 text-gray-700">
                    <span>{indexOfFirst + index + 1}</span>
                    <button
                      type="button"
                      className={`text-xs rounded px-2 py-1 transition ${
                        copiedId === usuario.id
                          ? "bg-green-200 text-green-700"
                          : "hover:bg-violet-200 text-violet-700"
                      }`}
                      onClick={() => handleCopyFirebaseId(usuario.id)}
                      title={
                        copiedId === usuario.id ? "¡Copiado!" : "Copiar ID"
                      }
                    >
                      {copiedId === usuario.id ? "✓" : "📋"}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {usuario.nombre || <span className="text-gray-400">Sin nombre</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {usuario.email || <span className="text-gray-400">Sin email</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {usuario.password || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {usuario.curso || <span className="text-gray-400">Sin curso</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-[#2d249c] text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
