# CLAUDE.md

Guidance for Claude Code working in this repo.

## Stack

- Monorepo, npm workspaces (`packages/frontend`, `packages/backend`, `packages/shared`).
- Frontend: React 18, Vite, TypeScript, Tailwind, Firebase client SDK, Socket.IO client, react-router-dom.
- Backend: Express, TypeScript, Socket.IO, Firebase Admin, Anthropic SDK (theme generation).
- Shared: plain TS types/interfaces consumed by both (`@games/shared`, path-aliased to `../shared/src`).
- Firestore for persistence, Firebase Auth for auth, Firebase Hosting config in `firebase.json`/`.firebaserc`.

## Commands

- `npm run dev:fe` / `npm run dev:be` / `npm run dev` — start frontend/backend/both.
- `npm run build:fe` / `npm run build:be` — build.
- `npm run migrate` — run `scripts/migrate.ts` via ts-node against Firestore.

## Conventions

- Games are plugins under `packages/backend/src/games/plugins/*Plugin.ts`, registered in `gameRegistry.ts`.
- Socket events live in `packages/backend/src/socket/` (`events.ts`, `roomManager.ts`).
- Routes under `packages/backend/src/routes/` are thin; Firestore access goes through `firebase-admin.ts`.
- Frontend pages under `src/pages`, room/lobby flow under `src/pages/lobby`.

## Notes

- Backend `tsconfig.json` has no `rootDir`; tsc infers the common root as `packages/` (since `@games/shared` lives outside `src`). Build output lands at `dist/backend/src/index.js`, hence `start`: `node dist/backend/src/index.js`.

## Working here

- This directory is not currently a git repo — check before assuming `git` commands work.
- `.env` holds real secrets (Firebase service account JSON, Anthropic key) — never print or commit its contents.
