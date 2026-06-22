import LegalLayout from '../components/legal/LegalLayout'

const CONTACTO = 'victor20sano@gmail.com'
const DOMINIO = 'https://planea-pro.com.mx'

export default function AvisoPrivacidadPage() {
  return (
    <LegalLayout titulo="Aviso de Privacidad" actualizado="22 de junio de 2026">
      <h2>1. Identidad y domicilio del responsable</h2>
      <p>
        <strong>PLANEA-PRO</strong> ("PLANEA-PRO", "nosotros"), con domicilio en México y
        correo electrónico de contacto <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>, es responsable
        del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos
        Personales en Posesión de los Particulares (LFPDPPP), su Reglamento y la normativa aplicable.
      </p>
      <p>
        PLANEA-PRO es una plataforma web (disponible en <a href={DOMINIO}>planea-pro.com.mx</a>) que
        ayuda a personal docente a elaborar planeaciones didácticas, registrar calificaciones y
        convertir formatos académicos (incluido el formato SWRE de CONALEP), apoyándose en
        inteligencia artificial.
      </p>

      <h2>2. Datos personales que recabamos</h2>
      <h3>a) Datos de tu cuenta (docente)</h3>
      <ul>
        <li>Nombre y correo electrónico (a través del proveedor de autenticación).</li>
        <li>Datos profesionales que ingreses voluntariamente: número de empleado y plantel/centro de trabajo.</li>
      </ul>
      <h3>b) Contenido que subes o capturas</h3>
      <ul>
        <li>Documentos PDF de Programas de Estudio (PE) y Guías Pedagógicas (GPE).</li>
        <li>Capturas de pantalla de la sábana de evaluación (SWRE).</li>
        <li>Información que registres en las herramientas (nombres de grupos, materias y, en su caso, nombres de alumnos y sus calificaciones).</li>
      </ul>
      <h3>c) Datos de pago</h3>
      <p>
        Procesamos pagos a través de <strong>Stripe</strong>. PLANEA-PRO <strong>no almacena</strong>
        números de tarjeta; esos datos los trata directamente Stripe conforme a su propia política de privacidad.
      </p>
      <h3>d) Datos técnicos</h3>
      <p>Identificadores de sesión, registros de uso, dirección IP y datos del dispositivo/navegador, con fines de seguridad y operación.</p>
      <p>
        <strong>Importante sobre los datos de alumnos:</strong> las calificaciones que capturas en la
        herramienta "Registro de calificaciones" se almacenan localmente en tu navegador y
        <strong> no se transmiten a nuestros servidores</strong>. Las capturas SWRE y los PDF que subes
        sí se envían a nuestros proveedores de inteligencia artificial para su procesamiento (ver
        sección 4), de forma transitoria. <strong>No recabamos datos personales sensibles</strong> de
        forma intencional; te pedimos no incluir datos sensibles innecesarios en el contenido que subas.
      </p>

      <h2>3. Finalidades del tratamiento</h2>
      <h3>Finalidades primarias (necesarias para prestarte el servicio)</h3>
      <ul>
        <li>Crear y administrar tu cuenta y autenticarte.</li>
        <li>Generar planeaciones didácticas y procesar los documentos/capturas que subas mediante inteligencia artificial.</li>
        <li>Operar las herramientas de registro de calificaciones y conversión a formato SWRE.</li>
        <li>Gestionar tu saldo de créditos y procesar tus pagos.</li>
        <li>Brindar soporte, garantizar la seguridad y prevenir fraudes o usos indebidos.</li>
        <li>Cumplir obligaciones legales y fiscales.</li>
      </ul>
      <h3>Finalidades secundarias (puedes oponerte sin afectar el servicio)</h3>
      <ul>
        <li>Enviarte comunicaciones sobre novedades, mejoras o promociones de PLANEA-PRO.</li>
        <li>Realizar estadísticas y mejoras del producto de forma agregada.</li>
      </ul>
      <p>
        Si no deseas que tus datos se traten para las finalidades secundarias, escríbenos a
        <a href={`mailto:${CONTACTO}`}> {CONTACTO}</a> indicando tu negativa.
      </p>

      <h2>4. Transferencias y encargados (subprocesadores)</h2>
      <p>
        Para operar, compartimos datos con proveedores tecnológicos que actúan como encargados y que
        pueden almacenar o procesar la información en Estados Unidos u otros países:
      </p>
      <table>
        <thead>
          <tr><th>Proveedor</th><th>Finalidad</th><th>Datos involucrados</th></tr>
        </thead>
        <tbody>
          <tr><td>Google (Firebase, Google Cloud, Gemini)</td><td>Autenticación, base de datos, hosting y generación con IA</td><td>Cuenta, planeaciones, PDF y capturas enviadas a IA</td></tr>
          <tr><td>OpenAI</td><td>Generación de contenido con IA</td><td>PDF y prompts enviados para la generación</td></tr>
          <tr><td>Stripe</td><td>Procesamiento de pagos</td><td>Datos de pago (tratados directamente por Stripe)</td></tr>
        </tbody>
      </table>
      <p>
        Estas transferencias son necesarias para la prestación del servicio que solicitas, en términos
        del artículo 37 de la LFPDPPP. No realizamos otras transferencias que requieran tu
        consentimiento sin recabarlo previamente, salvo las excepciones legales.
      </p>

      <h2>5. Uso de inteligencia artificial</h2>
      <p>
        PLANEA-PRO utiliza modelos de inteligencia artificial de terceros (Google Gemini y OpenAI)
        para generar planeaciones y procesar las capturas/documentos que subes. El contenido generado
        por IA <strong>puede contener errores o imprecisiones</strong> y debe ser <strong>revisado y
        validado por ti</strong> antes de su uso oficial. PLANEA-PRO no garantiza que el contenido
        generado cumpla automáticamente con requisitos institucionales.
      </p>

      <h2>6. Medios para ejercer tus derechos ARCO</h2>
      <p>
        Tienes derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte</strong> (derechos ARCO) al
        tratamiento de tus datos, así como a revocar tu consentimiento. Para ejercerlos, envía una
        solicitud a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> indicando: tu nombre y correo de
        contacto, la descripción clara del derecho que deseas ejercer y un documento que acredite tu
        identidad. Responderemos en los plazos que marca la LFPDPPP. También puedes eliminar
        directamente los datos almacenados localmente (Registro de calificaciones) borrando los datos
        del sitio en tu navegador.
      </p>

      <h2>7. Revocación del consentimiento</h2>
      <p>
        Puedes revocar tu consentimiento en cualquier momento escribiendo a
        <a href={`mailto:${CONTACTO}`}> {CONTACTO}</a>. La revocación puede implicar que ya no podamos
        prestarte algunos o todos los servicios.
      </p>

      <h2>8. Cookies y tecnologías de rastreo</h2>
      <p>
        Utilizamos almacenamiento local del navegador y cookies o tecnologías similares para mantener
        tu sesión, recordar preferencias y operar las herramientas. Puedes deshabilitarlas desde tu
        navegador, aunque esto puede afectar el funcionamiento.
      </p>

      <h2>9. Conservación y seguridad</h2>
      <p>
        Conservamos los datos durante el tiempo necesario para cumplir las finalidades y las
        obligaciones legales. Aplicamos medidas de seguridad administrativas, técnicas y físicas
        razonables para proteger tus datos contra pérdida, acceso no autorizado o alteración.
      </p>

      <h2>10. Cambios al Aviso de Privacidad</h2>
      <p>
        Podemos actualizar este Aviso. Publicaremos la versión vigente en
        <a href={DOMINIO}> planea-pro.com.mx</a> e indicaremos la fecha de última actualización. Los
        cambios sustanciales se te comunicarán por los medios disponibles.
      </p>

      <h2>11. Autoridad</h2>
      <p>
        Si consideras que tu derecho a la protección de datos ha sido vulnerado, puedes acudir a la
        autoridad competente en México en materia de protección de datos personales.
      </p>
    </LegalLayout>
  )
}
