import { Link } from 'react-router-dom'
import LegalLayout from '../components/legal/LegalLayout'

const CONTACTO = 'victor20sano@gmail.com'
const DOMINIO = 'https://planea-pro.com.mx'

export default function TerminosPage() {
  return (
    <LegalLayout titulo="Términos y Condiciones de Servicio" actualizado="22 de junio de 2026">
      <p>
        Estos Términos y Condiciones (los "Términos") regulan el uso de la plataforma PLANEA-PRO (el
        "Servicio"), operada por <strong>PLANEA-PRO</strong> ("nosotros"), disponible en
        <a href={DOMINIO}> planea-pro.com.mx</a>. Al crear una cuenta o usar el Servicio, aceptas estos
        Términos. Si no estás de acuerdo, no uses el Servicio.
      </p>

      <h2>1. Descripción del Servicio</h2>
      <p>
        PLANEA-PRO es una herramienta web que ayuda a personal docente a elaborar planeaciones
        didácticas, registrar calificaciones y convertir formatos académicos (incluido el formato
        SWRE), apoyándose en inteligencia artificial de terceros. El Servicio es una herramienta de
        apoyo y <strong>no sustituye el criterio profesional del docente</strong> ni garantiza la
        aceptación de los documentos por ninguna institución.
      </p>

      <h2>2. Cuentas</h2>
      <ul>
        <li>Para usar funciones que lo requieran, debes crear una cuenta con información veraz y mantener la confidencialidad de tus credenciales.</li>
        <li>Eres responsable de toda actividad realizada desde tu cuenta.</li>
        <li>Debes ser mayor de edad y contar con capacidad legal para aceptar estos Términos.</li>
      </ul>

      <h2>3. Créditos y pagos</h2>
      <ul>
        <li>Algunas funciones consumen <strong>créditos</strong>. Puedes adquirirlos mediante el procesador de pagos <strong>Stripe</strong>. PLANEA-PRO no almacena los datos de tu tarjeta.</li>
        <li>Los créditos se descuentan al iniciar una operación de pago (por ejemplo, generación de planeación, generación de horario o conversión de un parcial a formato SWRE). El costo en créditos se muestra en la interfaz antes de confirmar.</li>
        <li>Los créditos <strong>no son reembolsables</strong>, salvo (i) error de cobro imputable a PLANEA-PRO, o (ii) cuando una operación falle por causa atribuible a nosotros y no se haya entregado resultado, en cuyo caso se reintegran los créditos correspondientes.</li>
        <li>Los créditos no tienen valor monetario fuera del Servicio, no son transferibles y no constituyen propiedad del usuario.</li>
      </ul>

      <h2>4. Uso de inteligencia artificial y contenido generado</h2>
      <ul>
        <li>El Servicio genera contenido mediante modelos de IA de terceros. Dicho contenido <strong>puede contener errores, omisiones o imprecisiones</strong>.</li>
        <li>Es tu responsabilidad <strong>revisar, editar y validar</strong> todo el contenido generado antes de usarlo de forma oficial. PLANEA-PRO no garantiza exactitud, idoneidad ni cumplimiento de requisitos institucionales o normativos del contenido generado.</li>
      </ul>

      <h2>5. Contenido del usuario</h2>
      <ul>
        <li>Al subir documentos (PDF), capturas u otra información ("Contenido del Usuario"), <strong>declaras y garantizas</strong> que cuentas con los derechos y autorizaciones necesarios y que dicho contenido no infringe derechos de terceros ni la ley.</li>
        <li>Nos otorgas una licencia limitada, no exclusiva y revocable para procesar el Contenido del Usuario con el único fin de prestarte el Servicio (incluido su envío a los proveedores de IA). No reclamamos propiedad sobre tu Contenido del Usuario.</li>
        <li>El Contenido del Usuario se procesa de forma transitoria para generar resultados y no se publica ni se comparte con otros usuarios.</li>
      </ul>

      <h2>6. Datos personales de terceros (alumnos)</h2>
      <ul>
        <li>Si capturas o subes datos de terceros (por ejemplo, nombres o calificaciones de alumnos, que pueden ser menores de edad), declaras que cuentas con la <strong>base legal o el consentimiento</strong> necesarios y que estás autorizado por tu institución para tratarlos.</li>
        <li>Respecto de esos datos, <strong>tú actúas como responsable</strong> de su tratamiento; PLANEA-PRO actúa únicamente como herramienta para procesarlos según tus instrucciones.</li>
        <li>Las calificaciones capturadas en el "Registro de calificaciones" se almacenan en el almacenamiento local de tu navegador y no se transmiten a nuestros servidores.</li>
      </ul>

      <h2>7. Propiedad intelectual</h2>
      <p>
        El Servicio, su software, marca, diseño y contenidos (excluyendo el Contenido del Usuario) son
        propiedad de PLANEA-PRO o de sus licenciantes y están protegidos por la legislación aplicable.
        No se concede ningún derecho salvo el uso del Servicio conforme a estos Términos.
      </p>

      <h2>8. Conducta prohibida</h2>
      <p>Te comprometes a no: (i) usar el Servicio para fines ilícitos; (ii) subir contenido que infrinja derechos de terceros o contenga malware; (iii) intentar vulnerar la seguridad, revertir ingeniería o eludir los controles de créditos; (iv) revender o explotar el Servicio sin autorización; (v) sobrecargar la infraestructura de forma abusiva.</p>

      <h2>9. Suspensión y terminación</h2>
      <p>
        Podemos suspender o cancelar tu acceso si incumples estos Términos o si es necesario por
        razones de seguridad o legales. Puedes dejar de usar el Servicio en cualquier momento.
      </p>

      <h2>10. Limitación de responsabilidad</h2>
      <ul>
        <li>El Servicio se proporciona <strong>"tal cual" y "según disponibilidad"</strong>, sin garantías de ningún tipo, en la máxima medida permitida por la ley.</li>
        <li>En la medida permitida por la ley, PLANEA-PRO no será responsable por daños indirectos, incidentales o consecuentes, ni por decisiones tomadas con base en el contenido generado. Nuestra responsabilidad total se limita al monto que hayas pagado en los tres meses previos al hecho que origine la reclamación.</li>
      </ul>

      <h2>11. Indemnización</h2>
      <p>
        Aceptas mantener en paz y a salvo a PLANEA-PRO frente a reclamaciones de terceros derivadas de
        tu Contenido del Usuario, de tu incumplimiento de estos Términos o del tratamiento indebido de
        datos de terceros por tu parte.
      </p>

      <h2>12. Modificaciones</h2>
      <p>
        Podemos modificar estos Términos. Publicaremos la versión vigente con su fecha de actualización.
        El uso continuado del Servicio implica la aceptación de los cambios.
      </p>

      <h2>13. Ley aplicable y solución de controversias</h2>
      <ul>
        <li>Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos.</li>
        <li>Para cualquier controversia, las partes procurarán una solución de buena fe. De no lograrse, se someterán a los tribunales competentes de México, renunciando a cualquier otro fuero que pudiera corresponderles.</li>
      </ul>

      <h2>14. Privacidad</h2>
      <p>
        El tratamiento de tus datos personales se rige por nuestro <Link to="/aviso-de-privacidad">Aviso de Privacidad</Link>.
      </p>

      <h2>15. Contacto</h2>
      <p>Para cualquier asunto relacionado con estos Términos: <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.</p>
    </LegalLayout>
  )
}
