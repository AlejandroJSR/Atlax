const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Esta función escucha los cambios en la colección "compras".
 * Cuando el estado cambia de "PENDIENTE" a "APROBADO",
 * agrega automáticamente el curso comprado al array `cursos` del usuario.
 */
exports.onCompraAprobada = functions.firestore
  .document("compras/{compraId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Solo continuar si el estado pasó de PENDIENTE a APROBADO
    if (before.estado !== "APROBADO" && after.estado === "APROBADO") {
      const email = after.email;
      const curso = after.curso; // Asegúrate de que el documento de compra tenga un campo "curso"

      try {
        // Buscar usuario por email
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
