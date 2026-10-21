# ProjectPublication — Fase 1

El frontmatter de proyectos admite `publication` de forma opcional. Los MDX
existentes conservan sus campos, valores por defecto y consumidores. No se
completan secciones ausentes ni se generan métricas o evidencia.

El contrato y su tipo inferido están en `src/shared/content/project-publication.ts`.
Todos los objetos de la publicación son estrictos: las claves desconocidas fallan.

- `metrics`: ID, etiqueta, valor numérico finito, unidad y al menos una referencia
  a evidencia existente. Las referencias no pueden repetirse.
- `architecture`: resumen, nodos con ID único, conexiones entre nodos existentes
  y diagrama opcional con texto alternativo obligatorio.
- `timeline`: hitos con ID, título, fecha inicial y fecha final opcional.
  Las fechas son fechas reales `YYYY-MM-DD`; el final no puede preceder al inicio.
  Se permiten hitos simultáneos y solapados, sin inferir relaciones temporales.
- `evidence`: ID, título, tipo (`link`, `image`, `video`, `document`, `benchmark`),
  recurso y fecha de captura opcional.
- `gallery`: ID, recurso `src`, texto alternativo y pie opcional.
- `privacy`: visibilidad `public` o `anonymized`. La segunda exige un aviso.
  Describe material ya revisado: no anonimiza datos ni implementa acceso privado.

Los IDs son únicos dentro de cada sección. Los recursos admiten HTTPS sin
credenciales, espacios ni barras invertidas, o rutas canónicas absolutas respecto
a `public`, con extensión y sin segmentos de navegación ni codificación porcentual.
El build verifica que los archivos locales existan y permanezcan dentro de `public`,
incluso al resolver enlaces simbólicos. No consulta recursos remotos.

Los tests comprueban integridad bilingüe de los hechos estructurados, permitiendo
traducir textos editoriales. La existencia de una referencia no demuestra por sí
misma la veracidad de una métrica: el contenido debe revisarse antes de escribirlo.
Los datos de ejemplo de los tests no se incorporan al catálogo.

No se añade renderer visual, ingesta remota, Actions ni drafts.
