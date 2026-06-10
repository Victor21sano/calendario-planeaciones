# SEO — Planea Pro (planea-pro.com.mx)

## Estado a 2026-06-09

### Posición actual en Google
- "planea pro" → posición #2 (Meta Search Console)
- Sin Knowledge Panel ni logo aún (favicon recién desplegado)

### Cambios aplicados

#### index.html
- `<title>` → "Planea Pro — Planificador Docente con IA para CONALEP"
- `<meta description>` → empieza con "Planea Pro:" (keyword match)
- `<meta keywords>` → planea pro, planificador docente CONALEP, planeación IA
- JSON-LD: SoftwareApplication + Organization con alternateName "Planea-Pro"
- Favicons: favicon.ico (16+32+48), favicon.svg, favicon-48.png, favicon-192.png, apple-touch-icon.png
- site.webmanifest: name "Planea Pro", theme_color #0F766E

#### LoginPage.jsx (de facto homepage — ProtectedRoute redirige crawlers aquí)
- H1 desktop: añadido eyebrow "Planea Pro" sobre la proposición principal
- Párrafo: "Planea-Pro" → "Planea Pro" (consistencia de marca)
- Botón submit: "Entrar a Planea-Pro" → "Entrar a Planea Pro"

#### Páginas SEO (nuevas rutas públicas)
- `/planeaciones-conalep` → PlaneacionesConalep.jsx
- `/generador-planeaciones-ia` → GeneradorPlaneacionesIA.jsx
- `/horario-docente-conalep` → HorarioDocenteConalep.jsx

#### sitemap.xml
- Eliminada `/comprar-creditos` (ruta protegida, no rastreable)
- Añadida `/login` (priority 1.0, la página real que Google indexa)
- Añadida `/register` (priority 0.6)
- Añadidas 3 páginas SEO (priority 0.8–0.9)

#### robots.txt (sin cambios — ya era correcto)
```
User-agent: *
Allow: /
Disallow: /materia/
Disallow: /perfil
Sitemap: https://planea-pro.com.mx/sitemap.xml
```

## Monitoreo

### Google Search Console
- URL: https://search.google.com/search-console/
- Propiedad verificada: planea-pro.com.mx
- Acción post-deploy: Inspección de URL → Solicitar indexación para:
  - https://planea-pro.com.mx/login
  - https://planea-pro.com.mx/planeaciones-conalep
  - https://planea-pro.com.mx/generador-planeaciones-ia
  - https://planea-pro.com.mx/horario-docente-conalep
- Acción: Mapas del sitio → Enviar https://planea-pro.com.mx/sitemap.xml

### Señales de progreso esperadas (4–12 semanas)
- Favicon visible en resultados de búsqueda (2–4 sem)
- Nuevas páginas SEO indexadas (2–6 sem)
- Mejora de posición para keywords de cola larga (4–12 sem)

## Qué NO fue tocado (regla del proyecto)
- `services/`, `modelos/`, `hooks/`, `contexts/`, `functions/`, `exportar2023/`
- Prompts de IA
- Lógica de auth (Firebase)
- Componentes de lógica del planificador
