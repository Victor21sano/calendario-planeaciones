/**
 * scripts/marcarAdminVerificado.js
 *
 * Marca como verificado el email de las cuentas admin en Firebase Auth.
 * Ejecutar UNA SOLA VEZ desde local. No exponer ni subir a producción.
 *
 * Requisitos:
 *   1. Firebase CLI instalado: npm install -g firebase-tools
 *   2. Service Account descargado desde Firebase Console →
 *      Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada
 *   3. Colocar el JSON descargado como serviceAccount.json en la raíz del proyecto
 *      (está en .gitignore por seguridad, nunca subir a git)
 *
 * Ejecución:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/marcarAdminVerificado.js
 *
 * Alternativa (sin Service Account, usando credenciales por defecto de gcloud):
 *   gcloud auth application-default login
 *   node scripts/marcarAdminVerificado.js
 */

const admin = require('firebase-admin')

const ADMIN_EMAILS = ['victor20sano@gmail.com']

admin.initializeApp({ credential: admin.credential.applicationDefault() })

;(async () => {
  let exitCode = 0
  for (const email of ADMIN_EMAILS) {
    try {
      const user = await admin.auth().getUserByEmail(email)
      if (user.emailVerified) {
        console.log(`✓ ${email} ya está verificado (uid: ${user.uid})`)
        continue
      }
      await admin.auth().updateUser(user.uid, { emailVerified: true })
      console.log(`✓ ${email} marcado como verificado (uid: ${user.uid})`)
    } catch (err) {
      console.error(`✗ Error con ${email}:`, err.message)
      exitCode = 1
    }
  }
  process.exit(exitCode)
})()
