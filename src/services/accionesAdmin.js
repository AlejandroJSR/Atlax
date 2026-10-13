import { doc, updateDoc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const cambiarEstadoCompra = async (compra, nuevoEstado) => {
  // 1. Actualizar estado de la compra
  const compraRef = doc(db, "compras", compra.id);
  await updateDoc(compraRef, { estado: nuevoEstado });

  // 2. Buscar el curso real (por nombre) para obtener su ID
  const cursosRef = collection(db, "cursos");
  const q = query(cursosRef, where("nombre", "==", compra.curso));
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    console.error("Curso no encontrado en la colección cursos");
    return;
  }

  const cursoDoc = querySnap.docs[0];
  const cursoId = cursoDoc.id;

  // 3. Referencia del usuario (por UID, no por email)
  const userRef = doc(db, "usuarios", compra.uid);
  const userSnap = await getDoc(userRef);

  const cursoAprobado = {
    cursoId,
    nombre: cursoDoc.data().nombre,
    fechaAprobacion: new Date().toISOString(),
    metodo: compra.metodo,
    txid: compra.txid
  };

  // --- CASO: APROBAR ---
  if (nuevoEstado === "APROBADO") {
    if (userSnap.exists()) {
      const data = userSnap.data();
      const cursos = data.cursos || [];
      if (!cursos.find(c => c.cursoId === cursoId)) {
        await updateDoc(userRef, { cursos: [...cursos, cursoAprobado], estado: "APROBADO" });
      }
    } else {
      await setDoc(userRef, {
        nombre: compra.nombre,
        email: compra.email,
        rol: "alumno",
        estado: "APROBADO",
        cursos: [cursoAprobado],
        creadoEn: new Date()
      });
    }
  }

  // --- CASO: PENDIENTE ---
  if (nuevoEstado === "PENDIENTE" && userSnap.exists()) {
    const data = userSnap.data();
    const cursos = data.cursos || [];
    const cursosFiltrados = cursos.filter(c => c.cursoId !== cursoId);
    await updateDoc(userRef, { cursos: cursosFiltrados, estado: "PENDIENTE" });
  }
};
