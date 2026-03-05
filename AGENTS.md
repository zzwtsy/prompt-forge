# Repository Guidelines

## Project Structure & Module Organization

This repository is a Bun workspace monorepo:

- `apps/frontend`: React 19 + Vite UI (`src/routes`, `src/page`, `src/components`, `src/store`, `src/lib`).
- `apps/backend`: Hono API, Better Auth, Drizzle ORM (`src/lib`, `src/middlewares`, `src/db`).
- `docs`: product requirements and prompt-related docs.
- Root config: `eslint.config.mjs`, `bunfig.toml`, workspace `package.json`.

Treat generated files as build artifacts:

- `apps/frontend/src/routeTree.gen.ts`
- `apps/backend/src/db/migrations/*`
- `apps/frontend/src/api`

## Backend Task Entry Rule

- For any task touching `apps/backend/**` (routes, OpenAPI definitions, transaction logic, `AppError`/`codes.ts`, backend comments), use the local skill `.agents/skills/backend-conventions/SKILL.md` as the primary execution guide.
- If backend convention text conflicts with repository-level instructions, `AGENTS.md` takes precedence.

## Build, Test, and Development Commands

- `bun install`: install all workspace dependencies.
- `bun run dev:frontend`: start frontend dev server (Vite, default `:5173`).
- `bun run dev:backend`: start backend dev server (Bun, default `:3001`).
- `bun run build:frontend`: type-check and build frontend bundle.
- `bun run build:backend`: build backend output.
- `bun run preview:frontend`: preview frontend production build.
- `bun run lint` / `bun run lint:fix`: run/fix ESLint checks.
- `bun run --filter backend test`: run backend Vitest tests.
- `bun run gen:api`: generate frontend API client/types via Alova from backend OpenAPI docs (`/doc`) into `apps/frontend/src/api` (start backend first).
- `bun run db:migrate` (and `db:generate`, `db:check`, `db:push`, `db:studio`): manage Drizzle schema/migrations.

## Coding Style & Naming Conventions

Use TypeScript with strict settings enabled in both apps. ESLint (Antfu config) is the formatter/linter source of truth:

- 2-space indentation
- semicolons required
- double quotes

Use `@/*` path aliases inside each app. Prefer kebab-case file names (for example, `app-not-found.ts`), and PascalCase for React component exports.

## Testing Guidelines

Backend tests use Vitest with files named `*.test.ts` under `apps/backend/src/` (example: `src/db/sqlite-path.test.ts`). Keep tests deterministic; backend tests run serially by default due to shared DB state. No frontend test runner is configured yet.

## Commit & Pull Request Guidelines

Follow Conventional Commits with scope, as used in history:

- `feat(auth): ...`
- `docs(requirements): ...`
- `chore(vscode): ...`

PRs should include: concise summary, affected app(s), manual verification steps, and screenshots for UI changes. If schema or env behavior changes, include migration notes and `.env.example` updates.

## Security & Configuration Tips

Use `apps/backend/.env.example` as the template for local secrets. Never commit real credentials, API keys, or local database files.
