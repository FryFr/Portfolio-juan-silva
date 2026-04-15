# Portfolio Juan Silva — v2

Personal portfolio of Juan Silva — Senior Architect, Google Developer Expert, Microsoft MVP.

Built with Next.js 16, React 19, TypeScript (strict), Tailwind CSS 4, and next-intl.

## Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 — will redirect to `/es` by default. Also available at `/en`.

## Scripts

- `pnpm dev` — start dev server
- `pnpm typecheck` — run TypeScript type check
- `pnpm check` — run Biome lint + format check
- `pnpm check:fix` — auto-fix Biome issues
- `pnpm test` — run Vitest unit tests
- `pnpm e2e` — run Playwright E2E tests

## Architecture

Feature-based with screaming architecture. See [docs/superpowers/specs/2026-04-14-portfolio-v2-design.md](docs/superpowers/specs/2026-04-14-portfolio-v2-design.md) for the full design spec.

## License

Personal portfolio. All content © Juan Silva.
