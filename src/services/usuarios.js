import { auth, db } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc 
} from "firebase/firestore";

/**
 * Crear usuario manualmente desde el panel de administración
 * - Crea en Firebase Auth
 * - Guarda datos adicionales en Firestore
 */
export async function crearUsuarioManual(nombre, email, password, rol) {
  // 1. Crear usuario en Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Actualizar el displayName (opcional)
  await updateProfile(user, { displayName: nombre });

  // 3. Crear documento en Firestore
  await setDoc(doc(db, "usuarios", user.uid), {
    nombre,
    email,
    rol,
    estado: rol === "administrador" ? "APROBADO" : "PENDIENTE",
    cursos: [],
    creadoEn: new Date()
  });

  return user;
}

/**
 * Obtener todos los usuarios desde la colección 'usuarios'
 */
export async function obtenerUsuarios() {
  const querySnapshot = await getDocs(collection(db, "usuarios"));
  const usuarios = [];
  querySnapshot.forEach((docu) => {
    usuarios.push({ id: docu.id, ...docu.data() });
  });
  return usuarios;
}
