# FASE 5 — contrato local de proyectos, versión 1

Esta fase define y valida propuestas de metadatos. No instala una Action, no descarga
repositorios, no ejecuta código remoto y no modifica el catálogo manual.
`content/projects/*.mdx`, Content Collections y sus consumidores siguen independientes.
El plan histórico de contacto/footer no corresponde a esta fase de ingesta.

## Contrato del repositorio fuente

El único archivo admisible es `.portfolio/project.yml`. El ejemplo completo está en
[`tests/fixtures/portfolio/project.yml`](../tests/fixtures/portfolio/project.yml).
No se publica ese ejemplo como un proyecto real del portfolio.

- `schemaVersion`: exactamente `1`; versiones nuevas fallan hasta migración explícita.
- `repository`: `owner/repo` canónico en minúsculas; sin URL, ramas ni comodines.
- `slug`: identidad estable, minúsculas, números y guiones, máximo 80 caracteres.
- `year`: entero entre 2000 y 2100; `stack`: 1–20 nombres únicos de hasta 50 caracteres.
- `locales`: exactamente `es` y `en`, con `title` (100), `summary` (200) y `role` (100).
- `links.live`: opcional, HTTPS sin credenciales. El enlace al repositorio puede derivarse
  de la identidad validada; no se acepta un enlace al repo arbitrario.

Todos los objetos son estrictos. No se aceptan MDX, HTML, `body`, imports, imágenes,
`featured`, `order`, `caseStudy`, rutas de salida ni instrucciones de publicación.
Texto plano, máximo 16 KiB UTF-8 por archivo. Se rechazan claves duplicadas, documentos
múltiples, etiquetas explícitas, anchors y aliases de YAML. No hay interpolación ni fetch.
Los límites de los campos coinciden con los del catálogo manual; no constituyen un
`Project` renderizable: no hay `body`, URL local ni caso de estudio generado.

## Política central y frontera de confianza

[`config/portfolio-allowlist.json`](../config/portfolio-allowlist.json) es la única política
usada por el CLI. Está vacía deliberadamente. Cada autorización revisada debe fijar
`repository`, el ID numérico inmutable de GitHub `repositoryId`, y un `slug` exclusivo.
Ninguno puede repetirse. Renombrados y transferencias requieren actualizar la política.
La API pura acepta una política explícita para tests; un transporte futuro debe cargar
la política del portfolio, nunca del repositorio fuente ni del evento recibido.

`source.json` aporta `repository`, `repositoryId`, `requestedSha`, `resolvedSha` y `path`.
Los SHA deben ser completos (40 caracteres hexadecimales minúsculos) e iguales.
El manifiesto no puede declarar su propia evidencia. El validador local comprueba
consistencia, **no prueba que los bytes pertenezcan a GitHub ni autentica al emisor**.
La futura Action deberá autenticar el evento, obtener identidad/ID desde GitHub,
leer exclusivamente el archivo en el commit exacto y verificar su procedencia antes
 de llamar al validador. No confiar en nombres, ID ni SHA declarados por el payload.
La prueba de pertenencia a una rama autorizada también queda para ese transporte.

El CLI obtiene los slugs manuales directamente de `content/projects` y rechaza cualquier
colisión. Una autorización no transfiere ownership del catálogo manual. No hay borrados.

## Ejecución local

Requiere Node con type stripping (Node >=22.18) y dependencias instaladas.

```sh
pnpm portfolio:validate /ruta/.portfolio/project.yml /ruta/source.json
pnpm portfolio:validate /ruta/.portfolio/project.yml /ruta/source.json /ruta/previous.json
pnpm test -- tests/lib/portfolio-contract.test.ts
```

El ejemplo `source.json` está junto al fixture YAML. Por defecto fallará en el CLI,
porque el repo ficticio no está autorizado. Los tests inyectan una allowlist de fixture;
no es necesario autorizar ejemplos en producción. El CLI devuelve JSON en stdout,
errores en stderr y código 1 en fallo; no escribe archivos. Para guardar estado,
conservar solo `record` del resultado tras revisión, no todo el envoltorio.

`create` propone una entrada nueva. `noop` indica misma identidad, SHA y digest del
manifiesto normalizado, incluso si cambió el orden de claves o los comentarios YAML.
El estado previo se valida con versión, ownership y digest. Un mismo SHA con contenido
diferente falla. Otro SHA devuelve `review`, incluso si los metadatos no cambiaron:
los hashes no establecen cronología y esta fase no aplica actualizaciones automáticamente.
El digest SHA-256 detecta inconsistencias locales; no es una firma de autenticidad.
La serialización no incluye reloj, timestamps ni datos volátiles. Una futura escritura
debe resolver concurrencia de forma atómica y verificar de nuevo el estado revisado.

## Fuera de alcance

Dispatch, credenciales, descarga, políticas de ramas, creación de PR, escritura del
catálogo generado y su integración visual. Tampoco hay importación ni compilación de
MDX remoto. El catálogo manual funciona con la allowlist vacía y sin manifiestos fuente.
