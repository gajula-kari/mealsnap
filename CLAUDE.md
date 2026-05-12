# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

Aaharya is a mobile-first meal tracking PWA (in progress). Users photograph meals, tag them as CLEAN or INDULGENT, and track monthly indulgence against a self-set limit. Auth is device-based via a `x-user-id` header — no login flow.

## Monorepo structure

```
client/   React + Vite + TypeScript SPA
server/   Express + TypeScript + MongoDB REST API
```

The client proxies API calls to `localhost:3000` in dev (configured in `vite.config.ts`).

## Dev commands

```bash
# Client
cd client
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # tsc + vite build
npm run typecheck    # type check only
npm run lint         # ESLint
npm test             # Vitest watch
npm test -- --run    # Vitest single run
npx vitest run --coverage          # tests + coverage (threshold: 90% branches)
npx vitest run src/pages/Home.test.tsx  # run a single test file

# Server
cd server
npm run dev          # tsx watch → http://localhost:3000
npm run build        # tsc → dist/
npm run lint         # ESLint
npm test             # Jest watch
npm test -- --run    # Jest single run
npm test -- controllers/mealsController.test.ts  # run a single test file
```

## Environment

Server needs `server/.env`:
```
PORT=3000
MONGODB_URI=<MongoDB Atlas connection string>
```

## Architecture

### Client

- **Router**: `BrowserRouter` in `App.tsx`. Routes: `/`, `/tag`, `/day/:date`, `/settings`
- `/tag` and `/settings` are transient — navigated to with `{ replace: true }` so they never accumulate in browser history. Both have a `<Navigate to="/" replace />` guard for direct URL access.
- **State**: `MealProvider` (React Context) fetches meals on mount, caches to localStorage (images excluded). All pages consume via `useMealContext()`.
- **Services**: `mealApi.ts` and `settingsApi.ts` — thin wrappers over `fetch` that attach the `x-user-id` device header.
- **Image flow**: captured via `<input type="file" capture="environment">`, passed as a `File` object via React Router location state to `/tag`, converted to base64 for storage.

### Server

- **Entry**: `server.ts` connects MongoDB then starts Express (`app.ts`)
- **Routes**: `GET/POST /meals`, `PATCH/DELETE /meals/:id`, `GET/PATCH /settings`, `GET /health`
- **User isolation**: every request reads `x-user-id` header — no session or token auth
- **Models**: `Meal` (userId, imageUrl, tag, amountSpent, note, occurredAt) and `UserSettings` (userId unique, monthlyIndulgentLimit, previousGoal, goalUpdatedAt)

## Husky hooks (automated — do not replicate manually)

| Hook | What it does |
|---|---|
| `pre-commit` | prettier auto-formats staged `.ts/.tsx` files |
| `commit-msg` | commitlint rejects invalid commit types |
| `pre-push` | lint + prettier check + tests + coverage on client and server |

## Commit and push rules

**Before every commit** — explain what changed and why, propose the commit message, wait for approval.

**Commit format:**
```
<type>: <short description>

(optional body as bullet points)
```
Types only: `feat` · `fix` · `refactor` · `style` · `chore` · `docs`. One concern per commit.

**Before every push:**
1. `git pull origin main`
2. If the work added or changed routes, models, services, or dev commands — review and update this file
3. Check if the branch name still reflects the work. **Never rename an existing branch** — it has commits tied to its original purpose. If the name no longer fits, create a new branch from current HEAD:
```bash
git checkout -b <new-name>
git push origin -u <new-name>
```
