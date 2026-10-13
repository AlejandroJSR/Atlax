const { onDocumentUpdated } = require("firebase-functions/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Esta función escucha los cambios en la colección "compras".
 * Cuando el estado cambia de "PENDIENTE" a "APROBADO",
 * agrega automáticamente el curso comprado al array `cursos` del usuario.
 */
exports.onCompraAprobada = onDocumentUpdated("compras/{compraId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.estado !== "APROBADO" && after.estado === "APROBADO") {
    const email = after.email;
    const curso = after.curso;

    try {
      const snapshot = await db.collection("usuarios").where("email", "==", email).get();

      if (!snapshot.empty) {
        const usuarioDoc = snapshot.docs[0];
        await usuarioDoc.ref.update({
          cursos: admin.firestore.FieldValue.arrayUnion(curso)
        });
        console.log(`Curso ${curso} agregado al usuario ${email}`);
      } else {
        console.log(`No se encontró usuario con email ${email}`);
      }
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
    }
  }
});
