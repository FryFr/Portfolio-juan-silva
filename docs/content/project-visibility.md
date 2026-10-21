# Contrato de visibilidad de proyectos (FASE 0)

El frontmatter MDX admite `visibility` con estos valores:

| Valor | Publicación |
| --- | --- |
| `public` | Proyecto público. Valor por defecto si se omite. |
| `private-teaser` | Ficha editorial pública sobre un proyecto privado. El MDX debe contener únicamente información publicable. |
| `manual-only` | Proyecto publicado y mantenido manualmente mediante MDX. |
| `hidden` | Excluido del catálogo, destacados, navegación anterior/siguiente, parámetros de rutas estáticas, acceso al detalle, metadata del proyecto y sitemap (incluidos alternates). |

Los tres primeros estados publican el MDX curado y sus enlaces tal como están escritos; no hay redacción automática ni control de acceso a repositorios. `hidden` devuelve 404 al acceder al detalle y no produce metadata del proyecto. La visibilidad se evalúa por documento e idioma.

Los MDX existentes no necesitan migración: conservan contenido, orden y destacados. La política se comparte en `src/shared/content/project-visibility.ts` y los consumidores públicos pasan por los helpers de `src/shared/content/index.ts`.

Esta fase no incorpora sincronización, gráficos ni GitHub Actions. Los nombres reservan la intención editorial para futuras fases; no activan procesos externos. El contenido oculto sigue siendo material del repositorio y de la colección generada localmente: este contrato controla su publicación en el sitio, no sirve para almacenar secretos.
