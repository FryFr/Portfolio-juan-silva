# Automatización segura del portafolio

El workflow `sync-projects.yml` propone únicamente metadatos JSON en
`content/generated/source.json`. No publica proyectos ni ejecuta MDX remoto. Los
consumidores actuales conservan el catálogo editorial; incorporar un proyecto a la
interfaz requiere una revisión editorial separada.

## Ejecución y confianza

- Entradas exclusivas: `schedule` (lunes, 06:23 UTC), `workflow_dispatch` y
  `repository_dispatch` de tipo `portfolio-project-updated`. No hay triggers push,
  pull_request, pull_request_target ni workflow_run en este workflow.
- Solo se ejecuta desde `main`, que también debe ser la rama predeterminada. Ambos
  jobs usan el mismo commit del evento, sin persistir credenciales de checkout.
- La única política es `config/portfolio-allowlist.json` del portafolio. Sigue vacía:
  no hay solicitudes a repositorios fuente, ramas ni PR cuando está vacía. El evento
  no puede suministrar política, ruta, rama de salida ni repositorios adicionales.
- Dispatch manual: dejar ambos campos vacíos para actualizar toda la allowlist, o
  indicar juntos `repository` y `sha`. Repository dispatch exige ambos en
  `client_payload`; el SHA debe tener 40 caracteres hexadecimales minúsculos.
- Para cada entrada se comprueban nombre canónico e ID numérico contra GitHub. La
  rama predeterminada se resuelve una vez a SHA. Un SHA solicitado debe pertenecer
  a su historia. Se confirma el commit exacto y solo se descarga
  `.portfolio/project.yml?ref=<SHA>`, con límite de 16 KiB y UTF-8 estricto.
- El dispatch actualiza el catálogo completo, fijando la revisión solicitada para
  su repositorio; así no elimina otras entradas por recibir un evento parcial.
- `validate.ts` comparte `validateLocalProject` con el runner: contrato YAML estricto,
  ownership, ID, SHA y ausencia de colisiones con slugs MDX manuales. No se genera
  salida si falla una sola entrada. `canonicalCatalog` aplica además el escáner de
  seguridad a todos los campos decodificados. La Action invoca también
  `check-generated.mjs` antes de transferir el artefacto.
- `prepare` solo dispone de lectura. El artefacto contiene datos validados y su
  digest; se conserva un día. `propose` revalida el digest, contrato, política y
  seguridad con el mismo código confiable. El digest detecta corrupción, no es una
  firma: la confianza viene de los jobs del mismo run y el checkout fijado.
- Solo `propose` recibe permisos `contents: write` y `pull-requests: write`. Todas las
  escrituras de contenido apuntan a `automation/content-sync`, nunca a `main`.
  Si `main` cambió desde el checkout, se exige otra ejecución. El diff de la rama
  debe contener únicamente el archivo generado, sin divergencia ni renombrados
  externos; estados ambiguos se rechazan para revisión manual.
- Se crea o reutiliza un PR **draft**, actualizando su digest de procedencia. Un PR
  promovido a ready no se modifica automáticamente. No hay merge ni despliegue.
  Reruns con el mismo catálogo son idempotentes; el contenido en main idéntico no
  genera escrituras. Los SHA de cada fuente están en el catálogo.
- Los GET tienen reintentos limitados. Las mutaciones con resultado de transporte
  incierto no se repiten a ciegas. La concurrencia del workflow es serial. Una
  discrepancia de blob al actualizar provoca conflicto de API, no overwrite.

## Checklist CI reproducible

Usar Node **22.18 o posterior** y pnpm **10.33.0**. Desde la raíz del repositorio:

```sh
pnpm install --frozen-lockfile
pnpm exec content-collections build
pnpm typecheck
pnpm check
pnpm test
node --test scripts/content-sync/core.test.mjs
pnpm test:sync
pnpm build
pnpm test:metadata
pnpm check:generated-diff
```

Ejecutar y registrar cada comprobación, incluso si el build está bloqueado por red.

| Control | Evidencia esperada |
| --- | --- |
| Typecheck | `tsc --noEmit`, código 0; generar Content Collections primero |
| Biome | Código 0, sin errores ni advertencias |
| Unit | Vitest completo, incluido contrato YAML y seguridad |
| Parser/run offline | Node test con fetch prohibido, eventos, SHA, identidad, bounds, artefactos, no-op y PR |
| Build | `next build` completo, incluidas compilación, tipos y prerender |
| Sitemap | `test:metadata` verifica URLs y alternates; excluye proyectos ocultos por idioma |
| Metadata | `test:metadata` verifica título/resumen de cada proyecto visible y ausencia para ocultos |
| Generated diff | Solo JSON canónico autorizado, escáner de seguridad, sin borrados, symlinks ni rutas inesperadas |

En CI, `GENERATED_DIFF_BASE` es el SHA base del PR. Para reproducir la revisión de un
PR de automatización localmente (sustituir BASE_SHA por un commit local verificado):

```sh
GENERATED_DIFF_BASE=BASE_SHA GENERATED_DIFF_ONLY=true pnpm check:generated-diff
```

El modo estricto rechaza también cambios fuera de `content/generated/source.json`.
No debe usarse para esta implementación, cuyo diff incluye scripts y documentación.
Sin modo estricto se inspeccionan las rutas generadas modificadas y las ya versionadas;
con allowlist vacía y sin archivos generados, el resultado válido es un no-op.
El CLI de seguridad independiente recibe un batch JSON por stdin:

```sh
node scripts/security/check-generated.mjs < /ruta/batch.json
```

Formato: `{"version":1,"files":[{"path":"generated/source.json","content":"..."}]}`.
La ruta lógica del batch omite `content/`; no es una ruta de escritura arbitraria.

## Activación y bloqueos

No se han hecho commits, pushes, llamadas de escritura a GitHub ni cambios de settings.
El workflow solo estará operativo después de que una persona revise e integre estos
archivos en main. La allowlist vacía es deliberada, no un fallo de integración.

El único token utilizado es el `GITHUB_TOKEN` efímero de Actions, referenciado mediante
`${{ github.token }}`. No hay credenciales reales en archivos. Debe estar permitido
crear PR desde Actions en la configuración del repositorio. Ese permiso no se puede
verificar offline. El token del portafolio no concede lectura de otros repositorios
privados; esta implementación falla cerrada ante 403/404, sin introducir PAT ni
credenciales adicionales.

Los eventos creados mediante `GITHUB_TOKEN` pueden no disparar CI automáticamente.
La revisión humana debe ejecutar CI con `workflow_dispatch` sobre la rama propuesta,
o pasar el draft a ready (CI incluye `ready_for_review`), y comprobar el checklist
antes de merge. No se añade un token de mayor alcance para eludir esa restricción.

En la ejecución local del 20 de octubre de 2026, `pnpm build` falló porque `next/font`
no pudo conectar a `fonts.googleapis.com` para descargar **Poppins** y **JetBrains
Mono**. No se sustituyeron fuentes, no se mockeó el build y no se declara un build
correcto. Repetirlo en un entorno con acceso a Google Fonts; hasta entonces no se
ha verificado el prerender de producción. Los tests de sitemap y metadata sí pueden
pasar offline y no sustituyen esa comprobación. Content Collections emite además
avisos de deprecación preexistentes; Node puede avisar que los scripts TS no tienen
`type: module`, sin impedir las comprobaciones.
