# Planificador de Planeación Docente

Aplicación web para distribuir las horas de un programa educativo a lo largo de las semanas hábiles de un semestre.

## Instalación y uso

```bash
npm install
npm run dev
```

Luego abre http://localhost:5173 en tu navegador.

## Cómo usar

1. **Configuración del Semestre**: Ingresa las fechas de inicio y fin del semestre, las horas semanales de la materia y los períodos vacacionales.
2. **Estructura del Programa**: Agrega las unidades con sus subunidades y el número de horas de cada una.
3. **Planeación Calculada**: La tabla se genera automáticamente indicando en qué semana hábil inicia y termina cada subunidad.

## Reglas de cálculo

- Solo cuentan semanas de lunes a viernes.
- Los períodos vacacionales se omiten (no consumen horas de planeación).
- Los días festivos sí cuentan como hábiles.
- Una subunidad puede empezar en medio de una semana si la anterior no la agotó.
- La distribución es por semana, no por sesión con fecha exacta.

## Funcionalidades

- Guardar/cargar automáticamente en `localStorage`
- Exportar a CSV
- Validaciones con mensajes claros
- Cargar datos de ejemplo para probar

## Panel de administración (venta en efectivo)

Accesible en `/admin` solo para la cuenta admin. Permite acreditar créditos manualmente sin pasar por Mercado Pago.

**Flujo de venta en persona:**
1. El docente se registra con su email en la app.
2. Tú abres `/admin` en tu navegador.
3. El docente te paga en efectivo o te muestra el comprobante de transferencia.
4. Ingresas su email, cantidad de créditos, método y monto. Confirmas.
5. El docente ve su saldo actualizado **al instante** (gracias al `onSnapshot` en tiempo real).

**Desplegar las Cloud Functions de acreditación:**
```bash
firebase deploy --only functions,firestore:rules
```

**Colecciones de Firestore generadas:**
- `acreditacionesManual/{id}` — registro global de todas las operaciones manuales (auditoría)
- `users/{uid}/compras/{id}` — también se registra en el historial del docente

---

## Configuración de Mercado Pago

### Orden de pasos para activar Mercado Pago

1. Crear cuenta en https://www.mercadopago.com.mx → Developers → nueva app "PLANEA-PRO" (Checkout Pro)
2. En la app → **Credenciales de prueba** → copiar Access Token (`TEST-...`) y Public Key
3. En la app → **Webhooks** → copiar la Clave secreta (para `MP_WEBHOOK_SECRET`)
4. Crear dos cuentas de prueba (comprador y vendedor) para el sandbox

### Secretos del servidor (configurar una sola vez)

```bash
firebase functions:secrets:set MP_ACCESS_TOKEN    # Access Token de tu cuenta MP (TEST-... para sandbox)
firebase functions:secrets:set MP_WEBHOOK_SECRET  # Clave secreta del webhook (panel MP → Webhooks)
```

Verificar que se guardaron:
```bash
firebase functions:secrets:access MP_ACCESS_TOKEN
firebase functions:secrets:access MP_WEBHOOK_SECRET
```

### Variables de URL

Copia `functions/.env.example` → `functions/.env` y rellena con tus URLs reales:

```bash
cp functions/.env.example functions/.env
# Editar functions/.env con APP_URL y WEBHOOK_URL reales
```

> `functions/.env` está en `.gitignore` — nunca lo subas a git.

### Configurar el webhook en Mercado Pago

1. Panel MP → Tus integraciones → tu app → **Webhooks** → Agregar URL.
2. URL: `https://us-central1-TU_PROYECTO_ID.cloudfunctions.net/webhookMercadoPago`
3. Evento: **Pagos** (`payment`). Guardar.
4. La Clave secreta generada es el `MP_WEBHOOK_SECRET` (ya configurado en el paso anterior).

### Despliegue completo

```bash
cd functions && npm install   # instalar mercadopago SDK
firebase deploy --only functions,firestore:rules,hosting
```

### Pruebas en sandbox

Tarjetas de prueba (titular = estado deseado):
| Titular    | Resultado  |
|------------|------------|
| `APRO`     | Aprobado   |
| `OTHE`     | Rechazado  |
| `CONT`     | Pendiente  |

Número de tarjeta: `5031 7557 3453 0604` · CVV `123` · Vencimiento `11/30`

**Pruebas críticas a validar:**
- Compra aprobada → crédito acreditado en `users/{uid}.creditos`
- Webhook duplicado → saldo NO duplicado (idempotencia por `pagos/{paymentId}`)
- Generación que falla → crédito reembolsado automáticamente
- Pago pendiente (OXXO) → créditos llegan cuando MP confirma

> Cambia a credenciales de producción solo cuando el sandbox esté completamente validado.

```bash
firebase functions:secrets:set MP_ACCESS_TOKEN     # Token de producción (sin TEST-)
firebase functions:secrets:set MP_WEBHOOK_SECRET   # Nueva clave secreta de producción
firebase deploy --only functions
```

### Despliegue

```bash
# Instalar SDK de Mercado Pago en functions
cd functions && npm install

# Desplegar funciones y reglas
firebase deploy --only functions,firestore:rules
```

### Modelo de créditos

| Paquete | Créditos | Precio | Por módulo |
|---------|----------|--------|------------|
| Básico  | 1        | $100 MXN | $100 MXN |
| Estándar | 3       | $270 MXN | $90 MXN  |
| Pro     | 5        | $400 MXN | $80 MXN  |

Para cambiar precios: editar `PAQUETES` en `functions/index.js` **y** en `src/pages/ComprarCreditos.jsx`.

### Política de reembolsos

- Si la generación de un módulo falla por completo (ninguna RA generada), el crédito se reembolsa automáticamente en el servidor.
- Si algunas RAs fallan pero otras no, no hay reembolso (el usuario puede reintentar las fallidas sin cobro adicional).
- Pagos con OXXO/SPEI se acreditan cuando Mercado Pago confirma el pago (hasta 48 horas). El saldo se actualiza en tiempo real en la app.

### Aviso de privacidad

Los PDFs subidos para generación se envían a las APIs de IA (Gemini o Claude) únicamente para producir el contenido de las planeaciones. No se almacenan en los servidores de esta app más allá del tiempo necesario para completar la generación.

---

## Cuenta administrador (saldo ilimitado)

La app soporta una cuenta admin que pasa por todo el flujo de créditos pero cuyo saldo nunca baja. Esto permite probar la generación con IA sin gastar créditos reales.

### Configuración

1. **Servidor** — edita `functions/index.js`:
   ```js
   const ADMIN_EMAILS = ['tu-email@dominio.com']
   ```

2. **Cliente** — edita `src/contexts/AuthContext.jsx`:
   ```js
   const ADMIN_EMAILS = ['tu-email@dominio.com']
   ```

   Mantén los dos valores sincronizados. El servidor es quien toma las decisiones de seguridad; el cliente solo usa el valor para mostrar indicadores en la UI.

3. **Requisito**: el email debe tener `emailVerified: true` en Firebase Auth. Si acabas de registrarte, verifica tu correo o márcalo como verificado en la consola de Firebase → Authentication.

4. **Redesplegar** tras el cambio:
   ```bash
   firebase deploy --only functions
   ```

### Comportamiento admin

- El saldo nunca baja (`delta = 0` en cada transacción de descuento).
- La lógica de verificación/descuento/reembolso corre igual que para cualquier usuario.
- Los consumos se registran en `users/{uid}/consumos` con `admin: true`.
- La UI muestra "∞ Admin" en lugar del número de créditos.
- El generador muestra un badge "MODO ADMIN".
- La vista previa no muestra marca de agua.

## Stack

- Vite + React 18
- Tailwind CSS 3
- date-fns 3
