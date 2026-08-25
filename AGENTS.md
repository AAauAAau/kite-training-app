# Repository Guidelines

## Project Structure & Module Organization

The app is a Vite-powered React/TypeScript PWA. Application code lives in `src/`:

- `components/`: screens and reusable UI components.
- `logic/`: pure training, scheduling, load, and date calculations. Keep domain rules here rather than inside components.
- `data/seed.ts`: exercise and workout-template seed data.
- `db.ts`: Dexie/IndexedDB schema, seeding, and JSON backup handling.
- `store.ts`: Zustand state and persistence actions.
- `types.ts`: shared domain types.
- `styles.css`: global touch-first responsive styling.

Static assets are in `public/`. Unit tests are colocated with their subject, for example `src/logic/training.test.ts`. GitHub Pages deployment is configured in `.github/workflows/deploy.yml`.

## Build, Test, and Development Commands

Use the npm version declared in `package.json`:

```powershell
npm.cmd install          # Install dependencies on Windows PowerShell
npm.cmd run dev          # Start Vite with PWA development support
npm.cmd test             # Run the Vitest suite once
npm.cmd run test:watch   # Run tests interactively
npm.cmd run build        # Type-check and create dist/
npm.cmd run preview      # Serve the production build locally
```

Use `npm` instead of `npm.cmd` on shells that do not block PowerShell scripts.

## Coding Style & Naming Conventions

Use strict TypeScript and two-space indentation. Prefer functional React components and pure domain functions. Components and component files use `PascalCase`; functions, hooks, and variables use `camelCase`; persisted exercise IDs use kebab-case. Keep shared types explicit and avoid `any`. There is no configured formatter or linter, so match nearby formatting and ensure `npm.cmd run build` passes.

## Testing Guidelines

Vitest is the test framework. Name tests `*.test.ts` and keep them beside pure logic modules. Add tests for changes to load calculation, scheduling, progression, deload, or date boundaries. Tests must be deterministic and must not depend on IndexedDB, network access, or the current clock unless explicitly controlled.

## Commit & Pull Request Guidelines

History currently uses short imperative summaries such as `Update tracker`. Prefer a specific equivalent, for example `Add weekly load points`. Keep commits focused. Pull requests should explain user-visible behavior, note persistence/schema implications, list test and build results, and include mobile screenshots for UI changes.

## Offline Data & Security

Do not add analytics or runtime network requests. User data belongs in IndexedDB and must remain exportable/importable as JSON. Preserve backward compatibility for existing local data and verify that the production service worker still supports offline startup.
