# Games Platform

Multiplayer party-game platform. React frontend + Express/Socket.IO backend, Firebase (Firestore/Auth) for data, Anthropic API for theme generation.

## Structure

Monorepo, npm workspaces:

- `packages/frontend` — React 18 + Vite + Tailwind + Firebase client + Socket.IO client
- `packages/backend` — Express + Socket.IO server + Firebase Admin + Anthropic SDK
- `packages/shared` — shared TS types used by both

## Setup

```powershell
npm install
copy .env.example .env   # fill in Firebase + Anthropic keys
```

## Run

Frontend and backend separately:

```powershell
npm run dev:fe   # Vite dev server, http://localhost:5173
npm run dev:be   # Express + Socket.IO, http://localhost:3001
```

Both together:

```powershell
npm run dev
```

## Build

```powershell
npm run build:fe
npm run build:be
```

## Other scripts

```powershell
npm run migrate   # run scripts/migrate.ts against Firestore
```

## Env vars

See `.env.example`. Frontend vars must be prefixed `VITE_`. Backend needs `FIREBASE_SERVICE_ACCOUNT_JSON`, `ANTHROPIC_API_KEY`, `CORS_ORIGINS`, `PORT`.

