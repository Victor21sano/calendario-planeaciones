# Documentos legales — PLANEA-PRO (BORRADORES)

> ⚠️ **Estos son borradores generados como punto de partida. NO son asesoría legal.**
> Antes de publicarlos, deben ser **revisados por un abogado** (de preferencia
> especialista en protección de datos y derecho digital en México; y en EE.UU.
> si vas a tener usuarios allá). Rellena todos los campos marcados con `[[ ]]`.

## Archivos
- `AVISO-DE-PRIVACIDAD.md` — Aviso de privacidad integral (LFPDPPP). **Obligatorio en México** porque tratas datos personales (incluidos datos de alumnos, posiblemente menores).
- `TERMINOS-DE-SERVICIO.md` — Términos y condiciones de uso.

## YA EN VIVO en la app (provisional, sin marca de borrador)
Las páginas reales están en `src/pages/AvisoPrivacidadPage.jsx` y `src/pages/TerminosPage.jsx`
(rutas `/aviso-de-privacidad` y `/terminos`), enlazadas en el footer y con casilla de aceptación
en el registro. Valores **provisionales** que el abogado debe revisar/cambiar mañana:
- Responsable: **"PLANEA-PRO"** (falta razón social / nombre legal de persona física o moral).
- Domicilio: **"México"** (falta domicilio fiscal exacto).
- Jurisdicción: **"tribunales competentes de México"** (definir ciudad/estado o arbitraje).
- Contacto/ARCO: **victor20sano@gmail.com** · Dominio: **planea-pro.com.mx** · Fecha: **22 de junio de 2026**.
Edita esos dos archivos `.jsx` (constantes `CONTACTO`/`DOMINIO` y el texto) para los cambios.

## Datos que DEBES rellenar antes de usarlos (`[[ ]]`)
- `[[RAZÓN SOCIAL / NOMBRE DEL RESPONSABLE]]` — tu nombre completo (persona física) o la razón social (persona moral).
- `[[RFC]]` — opcional pero recomendable.
- `[[DOMICILIO]]` — domicilio fiscal o para oír notificaciones.
- `[[CORREO DE CONTACTO / PRIVACIDAD]]` — correo donde recibirás solicitudes ARCO y avisos (p. ej. `privacidad@tu-dominio` o un correo de soporte).
- `[[SITIO WEB / DOMINIO]]` — la URL de la app.
- `[[FECHA DE ÚLTIMA ACTUALIZACIÓN]]`.
- `[[CIUDAD/ESTADO PARA JURISDICCIÓN]]` — para la cláusula de ley aplicable.

## Decisiones de negocio que conviene confirmar con tu abogado
1. **Persona física vs. moral.** Hoy operas como persona física; si creces, una S. de R.L. o S.A.P.I. limita tu responsabilidad personal.
2. **Reembolsos de créditos.** Define la política (los borradores asumen "créditos no reembolsables salvo error de cobro"). En México, la LFPC da derechos al consumidor; consúltalo.
3. **Arbitraje / jurisdicción.** Incluido en Términos, pero su exigibilidad frente a consumidores en México es limitada — el abogado debe ajustarlo.
4. **Datos de menores.** Las calificaciones pueden ser de alumnos menores de edad. El borrador traslada al docente la responsabilidad de tener base legal/consentimiento, pero confírmalo.
5. **Encargados/subprocesadores.** Hoy: Google (Firebase + Gemini), OpenAI y Stripe — todos con servidores en EE.UU. (transferencia internacional). Mantén esta lista actualizada.

## Notas técnicas que sustentan los textos (verificar si cambian)
- Las **calificaciones del Registro** se guardan en `localStorage` del navegador del docente (no se suben a tus servidores).
- Las **capturas SWRE** y los **PDF (PE/GPE)** se envían a las APIs de IA (Google/OpenAI) para procesarse; se tratan de forma transitoria, no se publican ni se comparten con otros usuarios.
- Las **planeaciones generadas** y el **perfil del docente** sí se almacenan en Firestore (Google).
- **Pagos** vía Stripe; PLANEA-PRO no almacena datos de tarjetas.
