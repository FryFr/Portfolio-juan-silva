# Portfolio v2 — Fase 0: Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear la rama `refactor/v2`, nukear el proyecto viejo Next 13, bootstrapear Next 15 + TypeScript strict + Tailwind 4 + Biome, configurar next-intl con rutas `/es` `/en`, cargar fonts (Fraunces, Inter, JetBrains Mono), y dejar una página `/es` renderizando "it works" con el sistema de design tokens base aplicado.

**Architecture:** Feature-based + screaming architecture (`src/features/`, `src/shared/`, `src/app/[locale]/`). Server Components por default. Content en `content/` como Content Collections (configurada en fases posteriores). Biome reemplaza ESLint+Prettier. Vitest + Playwright preparados pero sin tests aún.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.6+ strict, Tailwind CSS 4, next-intl, next-themes, Biome, Vitest, Playwright, pnpm.

---

## User Constraints (IMPORTANTE — leer antes de ejecutar)

Reglas globales del usuario (de `~/.claude/CLAUDE.md`) que afectan cómo ejecutar este plan:

1. **Never commit without explicit request.** Cada paso de commit en este plan debe ser confirmado con el usuario antes de ejecutar. NO auto-commit.
2. **Never build after changes.** Usar `pnpm typecheck` y `pnpm dev` para verificación, NUNCA `pnpm build` a menos que el usuario lo pida explícitamente.
3. **Never use cat/grep/find/sed/ls.** Usar `bat`, `rg`, `fd`, `sd`, `eza`. Instalar con `scoop`/`choco` en Windows si faltan.
4. **Rioplatense Spanish en comentarios/outputs internos**, pero código/config/commit messages en inglés.
5. **Plataforma:** Windows con Git Bash. Usar forward slashes en paths, unix shell syntax.

## File Structure

Files creados o modificados en esta fase:

```
refactor/v2 branch:
├── .gitignore                        (rewrite completo)
├── package.json                      (nuevo, create-next-app)
├── pnpm-lock.yaml                    (nuevo)
├── tsconfig.json                     (modificado, strict + paths)
├── next.config.ts                    (nuevo, config base)
├── biome.json                        (nuevo, reemplaza .eslintrc)
├── postcss.config.mjs                (nuevo, Tailwind 4)
├── middleware.ts                     (nuevo, next-intl)
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx            (nuevo, root layout con fonts)
│   │   │   └── page.tsx              (nuevo, placeholder "it works")
│   │   ├── globals.css               (nuevo, Tailwind 4 @theme + tokens)
│   │   └── favicon.ico               (del public viejo o placeholder)
│   ├── features/                     (carpeta vacía, creada con .gitkeep)
│   ├── shared/
│   │   ├── config/
│   │   │   └── site.ts               (nuevo, metadata del sitio)
│   │   └── i18n/
│   │       ├── config.ts             (nuevo, next-intl config)
│   │       ├── routing.ts            (nuevo, locales + defaultLocale)
│   │       └── request.ts            (nuevo, getRequestConfig)
│   └── messages/
│       ├── es.json                   (nuevo, stub UI strings)
│       └── en.json                   (nuevo, stub UI strings)
├── content/                          (carpeta vacía, creada con .gitkeep)
├── tests/
│   ├── .gitkeep                      (placeholder)
│   └── setup.ts                      (nuevo, vitest setup stub)
├── vitest.config.ts                  (nuevo)
├── playwright.config.ts              (nuevo, configurado pero sin tests)
└── README.md                         (reemplazar con uno mínimo)

Files eliminados del main viejo (en la rama refactor/v2):
- src/app/components/ (12 .jsx files)
- src/app/api/send/route.js
- src/app/layout.js, page.js, globals.css
- src/app/favicon.ico (si lo mantenemos, mover)
- public/images/ (revisar cuáles conservar — de momento, wipe)
- jsconfig.json
- .eslintrc.json (si existe)
- next.config.js
- tailwind.config.js
- postcss.config.js
```

**Assets del proyecto viejo a conservar:** ninguno en esta fase. Los proyectos nuevos (Fase 3+) usarán assets nuevos. Si el usuario quiere conservar algún screenshot puntual, los movemos manualmente antes del wipe.

---

## Prerequisites Check

- [ ] **Step 0.1: Verificar herramientas instaladas**

Ejecutar en orden:
```bash
node --version          # Expected: v20.x or v22.x (not 18)
pnpm --version          # Expected: 9.x or 10.x
git --version           # Expected: 2.40+
```

Si `pnpm` no existe: instalar con `npm install -g pnpm@latest` o `corepack enable && corepack prepare pnpm@latest --activate`.

Si `node` < 20: actualizar con `nvm` o `volta`. Next.js 15 requiere Node 18.18+, pero target v20+.

- [ ] **Step 0.2: Verificar que el working tree está limpio**

```bash
git status
```
Expected output: `nothing to commit, working tree clean`.

Si hay cambios sin commitear: **parar y preguntar al usuario** qué hacer con ellos.

- [ ] **Step 0.3: Verificar branch actual es main**

```bash
git branch --show-current
```
Expected: `main`.

Si no está en main: `git checkout main` (confirmar con user primero).

---

## Task 1: Crear rama refactor/v2 y hacer snapshot del estado viejo

**Files:**
- Modify: (ninguno, solo git)

- [ ] **Step 1.1: Crear y checkout a la rama refactor/v2**

```bash
git checkout -b refactor/v2
```
Expected: `Switched to a new branch 'refactor/v2'`.

- [ ] **Step 1.2: Verificar que estamos en refactor/v2**

```bash
git branch --show-current
```
Expected: `refactor/v2`.

- [ ] **Step 1.3: Listar archivos actuales para snapshot mental**

```bash
eza --tree --level 3 --git-ignore src public 2>/dev/null || ls -la src public
```
Ver qué hay para nukear. Confirmar mentalmente que es el codebase Next 13 viejo esperado: 12 `.jsx` en `src/app/components/`, `src/app/api/send/route.js`, etc.

**NO commit todavía.** Esta task es solo setup de rama.

---

## Task 2: Wipe completo del código viejo

**Files:**
- Delete: `src/`, `public/`, `jsconfig.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `package.json`, `package-lock.json`, `node_modules/` (si existe)
- Keep: `.git/`, `.gitignore` (lo reescribimos en Task 7), `docs/` (contiene el spec), `.superpowers/` (contiene mockups brainstorm), `README.md` (lo reescribimos)

- [ ] **Step 2.1: Confirmar con el usuario qué assets conservar**

**Stop y preguntar:** "Voy a borrar `src/`, `public/`, `package.json` y todos los configs del Next 13 viejo. ¿Hay algún asset de `public/images/projects/` que quieras conservar antes del wipe?"

Si el usuario menciona archivos específicos, moverlos a `docs/legacy-assets/` antes de borrar:
```bash
mkdir -p docs/legacy-assets
mv public/images/projects/<archivo> docs/legacy-assets/
```

- [ ] **Step 2.2: Borrar código viejo**

```bash
rm -rf src public node_modules jsconfig.json next.config.js tailwind.config.js postcss.config.js package.json package-lock.json
```

- [ ] **Step 2.3: Verificar el wipe**

```bash
eza --tree --level 1 -a 2>/dev/null || ls -la
```
Expected: deben quedar solo `.git/`, `.gitignore`, `docs/`, `.superpowers/`, `README.md`. Nada más.

---

## Task 3: Scaffold con create-next-app

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `public/` (default assets), `.gitignore` (Next.js default)

- [ ] **Step 3.1: Ejecutar create-next-app en el directorio actual**

```bash
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-pnpm
```

Responder prompts:
- Would you like to use Turbopack? → **Yes**
- (Cualquier otro prompt) → default

Expected output: `Success! Created a new Next.js app in <path>`.

- [ ] **Step 3.2: Verificar la estructura generada**

```bash
eza --tree --level 2 --git-ignore 2>/dev/null || ls -R src
```

Expected:
```
src/
└── app/
    ├── favicon.ico
    ├── globals.css
    ├── layout.tsx
    └── page.tsx
```

- [ ] **Step 3.3: Verificar que `pnpm dev` arranca**

```bash
pnpm dev
```
Esperar hasta ver `✓ Ready in Xms`. Abrir http://localhost:3000 en browser, confirmar que carga la página default de Next.js.

**Parar el dev server con `Ctrl+C` antes de continuar.**

---

## Task 4: Configurar TypeScript strict

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 4.1: Reescribir tsconfig.json con strict flags completos**

Leer el `tsconfig.json` generado primero para ver el baseline, luego reemplazar el contenido con:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/content/*": ["./content/*"]
    },
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4.2: Agregar script de typecheck a package.json**

Leer `package.json` y agregar dentro de `"scripts"`:
```json
"typecheck": "tsc --noEmit"
```

El scripts block final debe tener al menos: `dev`, `start`, `typecheck`. Remover `build` y `lint` de scripts si el usuario los quiere omitir por sus reglas — mantenerlos pero documentar que no se corren auto.

- [ ] **Step 4.3: Verificar typecheck pasa**

```bash
pnpm typecheck
```
Expected: exit code 0, sin output (o solo warnings si los hay — no errors).

Si falla en el archivo `src/app/page.tsx` del default template por `noUnusedLocals` u otro flag estricto, ajustar el archivo default removiendo lo no usado. Lo vamos a reescribir igual en Task 9, así que un fix mínimo está ok.

---

## Task 5: Instalar Biome y reemplazar ESLint/Prettier

**Files:**
- Create: `biome.json`
- Modify: `package.json` (scripts)
- Delete: `eslint.config.mjs` o `.eslintrc.json` si existen

- [ ] **Step 5.1: Instalar Biome**

```bash
pnpm add -D --save-exact @biomejs/biome@latest
```
Expected: `+ @biomejs/biome X.Y.Z` en la salida.

- [ ] **Step 5.2: Inicializar Biome config**

```bash
pnpm biome init
```
Expected: crea `biome.json` con defaults.

- [ ] **Step 5.3: Reemplazar biome.json con config del proyecto**

Sobrescribir `biome.json` completo:
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": [".next", "node_modules", "public", "content/**/*.mdx", ".superpowers"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "a11y": {
        "recommended": true,
        "useButtonType": "error",
        "useKeyWithClickEvents": "warn"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error",
        "useImportType": "error"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all",
      "arrowParentheses": "always"
    }
  }
}
```

- [ ] **Step 5.4: Agregar scripts Biome a package.json**

Agregar a `"scripts"` de `package.json`:
```json
"check": "biome check",
"check:fix": "biome check --write",
"format": "biome format --write"
```

- [ ] **Step 5.5: Eliminar configs de ESLint si create-next-app dejó alguno**

```bash
fd -t f "eslint" --max-depth 1 2>/dev/null || ls -la | grep -i eslint
```
Si aparece `eslint.config.mjs`, `.eslintrc.json` o similar, borrarlos:
```bash
rm -f eslint.config.mjs .eslintrc.json .eslintignore
```

Además, desinstalar deps de eslint si create-next-app las instaló:
```bash
pnpm remove eslint eslint-config-next 2>/dev/null || true
```

- [ ] **Step 5.6: Ejecutar biome check**

```bash
pnpm check
```
Expected: reporte de issues en los archivos default de create-next-app (probablemente quotes, formatting). Aceptable.

- [ ] **Step 5.7: Auto-fix los issues de formatting**

```bash
pnpm check:fix
```
Expected: files changed count. Re-ejecutar `pnpm check` para confirmar 0 issues (o solo los que requieren intervención manual).

---

## Task 6: Crear estructura de carpetas feature-based

**Files:**
- Create: `src/features/.gitkeep`, `src/shared/ui/.gitkeep`, `src/shared/lib/.gitkeep`, `src/shared/config/`, `src/shared/i18n/`, `src/messages/`, `content/.gitkeep`, `tests/.gitkeep`

- [ ] **Step 6.1: Crear carpetas con .gitkeep**

```bash
mkdir -p src/features src/shared/ui src/shared/lib src/shared/config src/shared/i18n src/messages content tests
touch src/features/.gitkeep src/shared/ui/.gitkeep src/shared/lib/.gitkeep content/.gitkeep tests/.gitkeep
```

- [ ] **Step 6.2: Verificar estructura**

```bash
eza --tree --level 3 src content tests 2>/dev/null || find src content tests -type d
```

Expected:
```
src/
├── app/
│   └── [archivos default]
├── features/
│   └── .gitkeep
├── shared/
│   ├── config/
│   ├── i18n/
│   ├── lib/
│   │   └── .gitkeep
│   └── ui/
│       └── .gitkeep
└── messages/

content/
└── .gitkeep

tests/
└── .gitkeep
```

---

## Task 7: Reescribir .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 7.1: Leer el .gitignore actual para preservar el hook `.superpowers/`**

```bash
bat .gitignore 2>/dev/null || cat .gitignore
```
Confirmar que existe la línea `.superpowers/` (la agregamos en sesión previa). Si no, agregarla.

- [ ] **Step 7.2: Reemplazar .gitignore completo**

Sobrescribir `.gitignore`:
```
# Dependencies
node_modules
.pnpm-store

# Next.js
.next
out
next-env.d.ts

# Production
build
dist

# Environment files
.env
.env*.local
.env.development
.env.production

# Testing
coverage
playwright-report
test-results
.vitest-cache

# IDE and OS
.idea
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.DS_Store
*.swp
*.swo
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# TypeScript
*.tsbuildinfo

# Superpowers brainstorm session artifacts
.superpowers/

# Content collections generated
.content-collections
```

- [ ] **Step 7.3: Verificar git status respeta el nuevo ignore**

```bash
git status
```
Confirmar que `.superpowers/`, `.next/`, `node_modules/` NO aparecen en "Untracked files".

---

## Task 8: Configurar next-intl (i18n base)

**Files:**
- Create: `src/shared/i18n/routing.ts`, `src/shared/i18n/request.ts`, `src/shared/i18n/navigation.ts`, `src/messages/es.json`, `src/messages/en.json`, `middleware.ts`
- Modify: `next.config.ts`

- [ ] **Step 8.1: Instalar next-intl**

```bash
pnpm add next-intl
```
Expected: `+ next-intl X.Y.Z`.

- [ ] **Step 8.2: Crear configuración de routing**

Create `src/shared/i18n/routing.ts`:
```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
```

- [ ] **Step 8.3: Crear navigation wrappers tipados**

Create `src/shared/i18n/navigation.ts`:
```typescript
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

- [ ] **Step 8.4: Crear request config**

Create `src/shared/i18n/request.ts`:
```typescript
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 8.5: Crear middleware.ts en la raíz**

Create `middleware.ts` (raíz del proyecto, fuera de src):
```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/shared/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

- [ ] **Step 8.6: Actualizar next.config.ts para cargar el plugin de next-intl**

Reemplazar el contenido de `next.config.ts` (create-next-app lo crea vacío):
```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 8.7: Crear messages stub**

Create `src/messages/es.json`:
```json
{
  "common": {
    "siteName": "Juan Silva",
    "siteTagline": "Senior Architect",
    "nav": {
      "work": "Trabajos",
      "writing": "Escritos",
      "talks": "Charlas",
      "about": "Sobre mí"
    }
  },
  "home": {
    "hero": {
      "prompt": "whoami — portfolio · 2026",
      "title": "Juan Silva.",
      "subtitle": "Construyendo software, enseñando gente, diseñando sistemas que perduran."
    }
  },
  "placeholder": {
    "itWorks": "Funciona. Esta es la base del portfolio v2."
  }
}
```

Create `src/messages/en.json`:
```json
{
  "common": {
    "siteName": "Juan Silva",
    "siteTagline": "Senior Architect",
    "nav": {
      "work": "Work",
      "writing": "Writing",
      "talks": "Talks",
      "about": "About"
    }
  },
  "home": {
    "hero": {
      "prompt": "whoami — portfolio · 2026",
      "title": "Juan Silva.",
      "subtitle": "Building software, teaching people, designing systems that last."
    }
  },
  "placeholder": {
    "itWorks": "It works. This is the base of portfolio v2."
  }
}
```

---

## Task 9: Mover app router a [locale] y cargar fonts

**Files:**
- Delete: `src/app/layout.tsx`, `src/app/page.tsx` (los viejos del template)
- Create: `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 9.1: Borrar layout.tsx y page.tsx del template raíz**

```bash
rm src/app/layout.tsx src/app/page.tsx
```

- [ ] **Step 9.2: Crear la carpeta [locale]**

```bash
mkdir -p "src/app/[locale]"
```

- [ ] **Step 9.3: Crear src/app/[locale]/layout.tsx con fonts**

Este es el root layout REAL del app. Usa `next/font/google` para Fraunces + Inter + JetBrains Mono (los 3 del design spec §2.2), los expone como CSS variables, y wraps el html con NextIntlClientProvider.

Create `src/app/[locale]/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { routing } from '@/shared/i18n/routing';
import { siteConfig } from '@/shared/config/site';
import '../globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[--bg-primary] text-[--fg-primary] font-sans antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 9.4: Crear src/app/[locale]/page.tsx con placeholder**

Create `src/app/[locale]/page.tsx`:
```typescript
import { setRequestLocale, getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home.hero');
  const tPlaceholder = await getTranslations('placeholder');

  return (
    <main className="mx-auto max-w-5xl px-8 py-24">
      <div className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-[--fg-muted]">
        <span className="text-[--accent]">$</span> {t('prompt')}
      </div>
      <h1 className="font-serif text-7xl font-normal leading-[0.88] tracking-[-0.03em] text-[--fg-primary] md:text-9xl">
        {t('title')}
      </h1>
      <p className="mt-6 max-w-2xl font-serif text-xl italic text-[--fg-tertiary] md:text-2xl">
        {t('subtitle')}
      </p>
      <div className="mt-16 rounded border border-[--bg-tertiary] bg-white/40 p-6 font-mono text-sm text-[--fg-tertiary]">
        {tPlaceholder('itWorks')}
      </div>
    </main>
  );
}
```

- [ ] **Step 9.5: Reescribir src/app/globals.css con Tailwind 4 + design tokens**

Reemplazar el contenido completo de `src/app/globals.css` con:
```css
@import "tailwindcss";

@theme {
  --color-bg-primary: #f5f1ea;
  --color-bg-secondary: #ece3d2;
  --color-bg-tertiary: #e8dfcf;
  --color-bg-invert: #1a1208;

  --color-fg-primary: #1a1208;
  --color-fg-secondary: #3d2e1a;
  --color-fg-tertiary: #6b5943;
  --color-fg-muted: #9a8567;
  --color-fg-subtle: #b8a589;

  --color-accent: #c4a574;
  --color-accent-success: #7a9960;
  --color-accent-warn: #e07856;

  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-serif), Georgia, serif;
  --font-mono: var(--font-mono), ui-monospace, monospace;
}

:root {
  --bg-primary: #f5f1ea;
  --bg-secondary: #ece3d2;
  --bg-tertiary: #e8dfcf;
  --bg-invert: #1a1208;
  --fg-primary: #1a1208;
  --fg-secondary: #3d2e1a;
  --fg-tertiary: #6b5943;
  --fg-muted: #9a8567;
  --fg-subtle: #b8a589;
  --accent: #c4a574;
  --accent-success: #7a9960;
  --accent-warn: #e07856;
}

html {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

body {
  font-feature-settings: "ss01", "ss02", "cv11";
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Task 10: Crear site.config.ts

**Files:**
- Create: `src/shared/config/site.ts`

- [ ] **Step 10.1: Crear archivo de configuración del sitio**

Create `src/shared/config/site.ts`:
```typescript
export const siteConfig = {
  name: 'Juan Silva',
  title: 'Juan Silva — Senior Architect',
  description:
    'Portfolio personal de Juan Silva. Senior Architect, Google Developer Expert, Microsoft MVP. Construyendo software, enseñando gente, diseñando sistemas que perduran.',
  url: 'https://juan-silva.dev',
  author: {
    name: 'Juan Silva',
    handle: 'juansilva',
    email: 'hello@juan-silva.dev',
  },
  social: {
    github: 'https://github.com/juansilva',
    linkedin: 'https://linkedin.com/in/juansilva',
    twitter: 'https://twitter.com/juansilva',
  },
  locales: ['es', 'en'] as const,
  defaultLocale: 'es' as const,
} as const;

export type SiteConfig = typeof siteConfig;
```

**Nota:** los handles y URLs son placeholders. El usuario confirmará los reales antes de Fase 7 (deploy).

---

## Task 11: Configurar Vitest y Playwright (sin tests aún)

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`, `playwright.config.ts`, `e2e/.gitkeep`
- Modify: `package.json` (scripts)

- [ ] **Step 11.1: Instalar Vitest y dependencies de testing**

```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

- [ ] **Step 11.2: Crear vitest.config.ts**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 11.3: Instalar el plugin React de Vite**

```bash
pnpm add -D @vitejs/plugin-react
```

- [ ] **Step 11.4: Crear tests/setup.ts**

Create `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 11.5: Instalar y configurar Playwright**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

- [ ] **Step 11.6: Crear playwright.config.ts**

Create `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
```

- [ ] **Step 11.7: Crear carpeta e2e**

```bash
mkdir -p e2e
touch e2e/.gitkeep
```

- [ ] **Step 11.8: Agregar scripts de testing a package.json**

Agregar al bloque `"scripts"` de `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui",
"e2e": "playwright test",
"e2e:ui": "playwright test --ui"
```

El scripts block final del `package.json` debe incluir: `dev`, `start`, `typecheck`, `check`, `check:fix`, `format`, `test`, `test:watch`, `test:ui`, `e2e`, `e2e:ui`. (No `build`, no `lint` — por reglas del usuario.)

---

## Task 12: Verificación end-to-end

**Files:**
- (Ninguno — solo verificación)

- [ ] **Step 12.1: Typecheck**

```bash
pnpm typecheck
```
Expected: exit code 0, sin errors.

Si falla:
- Error común: `Cannot find module '@/shared/config/site'` → verificar que el archivo existe en `src/shared/config/site.ts`
- Error común: `Type error in [locale]/layout.tsx` → verificar que `params` es `Promise` (Next 15 change)

- [ ] **Step 12.2: Biome check**

```bash
pnpm check
```
Expected: 0 issues. Si hay formatting issues, correr `pnpm check:fix` y re-verificar.

- [ ] **Step 12.3: Dev server arranca**

```bash
pnpm dev
```
Expected: `✓ Ready in Xms` y el server escuchando en http://localhost:3000.

- [ ] **Step 12.4: Navegar a /es en el browser**

Abrir http://localhost:3000 → debe redirigir automáticamente a http://localhost:3000/es (por el middleware de next-intl).

Verificar visualmente que la página muestra:
1. Prompt `$ whoami — portfolio · 2026` en mono sepia
2. Título "Juan Silva." en Fraunces grande
3. Subtítulo italic en serif "Construyendo software, enseñando gente..."
4. Card con "Funciona. Esta es la base del portfolio v2."
5. Background cream `#f5f1ea`

**Verificar fonts cargaron:** inspeccionar elemento, ver que computed font-family incluye `Fraunces` (para el h1) e `Inter` (para el body).

- [ ] **Step 12.5: Navegar a /en**

Abrir http://localhost:3000/en → debe mostrar el MISMO layout pero con textos en inglés:
1. Título igual: "Juan Silva."
2. Subtítulo: "Building software, teaching people, designing systems that last."
3. Placeholder: "It works. This is the base of portfolio v2."

- [ ] **Step 12.6: Verificar hot reload funciona**

Con el dev server corriendo, abrir `src/messages/es.json` y cambiar el valor de `placeholder.itWorks` a "Funciona — test hot reload". Guardar.

Expected: el browser recarga automáticamente y muestra el texto nuevo en http://localhost:3000/es.

Revertir el cambio después de verificar.

- [ ] **Step 12.7: Parar el dev server**

`Ctrl+C` en la terminal del dev server.

---

## Task 13: README + commit (con confirmación del usuario)

**Files:**
- Modify: `README.md`

- [ ] **Step 13.1: Reescribir README.md**

Sobrescribir `README.md`:
```markdown
# Portfolio Juan Silva — v2

Personal portfolio of Juan Silva — Senior Architect, Google Developer Expert, Microsoft MVP.

Built with Next.js 15, TypeScript, Tailwind CSS 4, and next-intl.

## Development

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Open http://localhost:3000 — will redirect to \`/es\` by default. Also available at \`/en\`.

## Scripts

- \`pnpm dev\` — start dev server
- \`pnpm typecheck\` — run TypeScript type check
- \`pnpm check\` — run Biome lint + format check
- \`pnpm check:fix\` — auto-fix Biome issues
- \`pnpm test\` — run Vitest unit tests
- \`pnpm e2e\` — run Playwright E2E tests

## Architecture

Feature-based with screaming architecture. See \`docs/superpowers/specs/2026-04-14-portfolio-v2-design.md\` for the full design spec.

## License

Personal portfolio. All content © Juan Silva.
```

(Usar backticks normales, no escapadas, al escribir el archivo — los escape arriba son solo para este plan.)

- [ ] **Step 13.2: Pedir confirmación al usuario para commit**

**STOP y preguntar al usuario:** "Fase 0 terminada. Todo verifica: typecheck OK, biome check OK, dev server arranca, /es y /en renderean con fonts correctos. ¿Hago commit de todo a `refactor/v2`?"

**NO commit sin confirmación explícita.** Esta es una regla inviolable del CLAUDE.md del usuario.

- [ ] **Step 13.3: Si el usuario confirma, revisar status**

```bash
git status
```
Revisar la lista de archivos. Debería incluir TODO lo creado en esta fase. NO debe incluir `node_modules/`, `.next/`, `.superpowers/`.

- [ ] **Step 13.4: Agregar archivos al stage (explicit, sin -A)**

```bash
git add .gitignore README.md package.json pnpm-lock.yaml tsconfig.json next.config.ts biome.json postcss.config.mjs middleware.ts vitest.config.ts playwright.config.ts tests/ e2e/ src/ content/ public/
```

- [ ] **Step 13.5: Crear commit con mensaje conventional**

```bash
git commit -m "feat: bootstrap portfolio v2 with Next 15 + i18n + Biome

Wipe old Next 13 codebase. Scaffold new app with:
- Next.js 15 + React 19 + TypeScript strict
- Tailwind CSS 4 with design tokens (warm editorial palette)
- next-intl with /es and /en routes
- next/font loading Fraunces (variable), Inter, JetBrains Mono
- Biome replacing ESLint+Prettier
- Vitest and Playwright configured
- Feature-based folder structure (features/, shared/, content/)

Placeholder home page renders design tokens in both locales.
Spec: docs/superpowers/specs/2026-04-14-portfolio-v2-design.md"
```

- [ ] **Step 13.6: Verificar el commit**

```bash
git log --oneline -1
```
Expected: una línea con el hash nuevo y el subject line.

```bash
git status
```
Expected: `nothing to commit, working tree clean`.

---

## Success Criteria (end of Fase 0)

Todo lo siguiente debe ser cierto antes de cerrar esta fase:

- [ ] Rama `refactor/v2` creada y checked out
- [ ] Código Next 13 viejo eliminado completamente
- [ ] `package.json` incluye: next 15+, react 19+, typescript, tailwindcss 4, next-intl, @biomejs/biome, vitest, @playwright/test
- [ ] `pnpm typecheck` pasa con 0 errors
- [ ] `pnpm check` pasa con 0 issues
- [ ] `pnpm dev` arranca sin errors
- [ ] http://localhost:3000 redirige a /es
- [ ] /es muestra título "Juan Silva." en Fraunces, subtítulo italic, prompt mono sepia, fondo cream
- [ ] /en muestra el equivalente en inglés
- [ ] Fonts Fraunces + Inter + JetBrains Mono cargan correctamente (verificado en inspector)
- [ ] Hot reload funciona al editar `src/messages/*.json`
- [ ] `.gitignore` ignora `node_modules/`, `.next/`, `.superpowers/`
- [ ] Commit creado en `refactor/v2` con mensaje conventional
- [ ] Estructura de carpetas matches file structure section de este plan

## What's NOT in this plan (deferred to later phases)

- Componentes del hero real (morph + particles) → **Fase 3** cuando armemos `features/hero/`
- Content Collections schemas → **Fase 2**
- Theme toggle (dark/light) → **Fase 1**
- Layout completo (Navbar, Footer) → **Fase 1**
- SEO metadata avanzada (JSON-LD, OG) → **Fase 1-2**
- Tests reales → **Fase 6**
- CI pipeline → **Fase 6**
- Deploy → **Fase 7**

Fase 0 es SOLO bootstrap. Si alguna task empuja hacia features concretas, hay que pararse y diferirlas.

## Engram save at end of phase

Al completar Fase 0, guardar en Engram:

```
mem_save({
  title: "Portfolio v2 — Fase 0 Bootstrap completed",
  type: "pattern",
  topic_key: "portfolio-v2/fase-0-bootstrap",
  content: "Bootstrap Next 15 + TS strict + Tailwind 4 + next-intl + Biome completed on refactor/v2 branch. All deps installed, placeholder home renders in /es and /en with design tokens. Next: Fase 1 (i18n theming + layout base con ThemeToggle, LocaleSwitcher, Navbar, Footer)."
})
```

Y llamar `mem_session_summary` con Goal / Accomplished / Next Steps / Relevant Files.

---

## Self-Review Notes

Este plan fue self-reviewed contra el design spec:

**Spec coverage (Fase 0 scope):**
- ✅ §2.1 Mood tokens (palette in globals.css)
- ✅ §2.2 Typography (next/font cargando Fraunces+Inter+JetBrains Mono)
- ✅ §2.3 Palette (design tokens en @theme y :root)
- ✅ §4.2 i18n (next-intl con /es /en, messages stub)
- ✅ Architecture §5 (estructura de carpetas feature-based)
- ⏳ §2.7 Hero animation → DIFERIDO A FASE 3 (correcto, es fase dedicada)
- ⏳ §3.1-3.7 Layouts → DIFERIDOS a Fases 1-5 (correcto)
- ⏳ §6 Accessibility → base (reduced-motion) presente, full en Fases 6
- ⏳ §7 SEO → metadata básica presente, full JSON-LD en Fases 2
- ⏳ §8 Testing → setup presente, tests en Fase 6
- ⏳ §9 Error handling → diferido

**Placeholder scan:** no placeholders detectados. Todo paso tiene código completo o comando exacto.

**Type consistency:** `routing` exportado desde `routing.ts`, consumido en `request.ts`, `navigation.ts`, `layout.tsx`, `middleware.ts` — match. `siteConfig` exportado desde `site.ts`, consumido en `layout.tsx` metadata — match.

**Ambiguity:**
- Step 2.1 requiere confirmación del usuario antes de borrar — explícito
- Step 13.2 requiere confirmación del usuario antes de commit — explícito
- Todo lo demás es determinístico.
