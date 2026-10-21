# Case studies — Fase 2

La ruta `/[locale]/projects/[slug]` compone `CaseStudyRenderer` con el
`CaseStudyHeader`, `MdxBody` y `CaseStudyNav` existentes. El contenido MDX y
el contrato `ProjectPublication` no cambian.

- Hero: encabezado existente y portada solo cuando el proyecto tiene `cover`.
- Summary flow: índice navegable de las secciones aportadas. El contrato no
  contiene pasos narrativos; no se deducen procesos ni resultados del MDX.
- Métricas: valores localizados, incluyendo cero, con enlaces internos a la
  evidencia declarada. No se calculan mejoras, tendencias ni comparaciones.
- Arquitectura: adaptación a `ProvenanceGraph`, con resumen, nodos, conexiones
  y diagrama opcional. Las etiquetas ausentes no se completan con datos supuestos.
- Cronología: adaptación a `OperationalTimeline`, conservando orden e intervalos
  declarados. Fechas localizadas en UTC para evitar desplazamientos por zona horaria.
- Evidencia: `EvidencePanel` con un límite cliente explícito para sus controles
  de teclado. Los recursos se abren mediante enlaces, sin ingesta ni sincronización.
- Galería: imágenes con texto alternativo y pies únicamente si están declarados.
  Los recursos HTTPS usan `unoptimized` para admitir el contrato sin ampliar
  permisos del optimizador de imágenes ni consultar recursos durante el build.
- Privacidad: aviso editorial existente, cuando lo hay; no implica control de acceso.
- Relacionados: hasta tres proyectos visibles del mismo idioma que comparten
  tecnologías, ordenados por coincidencias y luego por el orden del catálogo.
  Se excluye el proyecto actual y se omite el bloque si no hay coincidencias.

`publication: undefined`, `{}`, arrays vacíos y secciones opcionales ausentes
mantienen el MDX y no generan secciones ni enlaces vacíos. Una publicación parcial
significa una instancia válida del contrato con algunas secciones omitidas; la
validación de frontmatter sigue siendo responsabilidad de Content Collections.

Las nuevas superficies usan los tokens claro/oscuro existentes, rejillas que
colapsan en móvil, imágenes fluidas, anclas enfocables y foco visible. No se añaden
animaciones. Los módulos visuales ya desactivan movimiento con reduced motion.

Los tests de composición ejecutan la ruta con MDX compilado real en ES y EN,
publicación legacy/completa/parcial, módulos visuales reales, enlaces de métricas,
fechas, IDs y teclado del panel de evidencia. El encabezado y la navegación
adyacente asíncronos se sustituyen por sus slots semánticos en el entorno unitario.
No equivalen a una auditoría visual de navegador.
