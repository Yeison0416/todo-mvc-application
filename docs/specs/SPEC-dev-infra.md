# Spec: dev-infra (Foundation Layer)

> Module of [`CAPABILITY-MAP-foundation-layer.md`](./CAPABILITY-MAP-foundation-layer.md). Depends on: none.
> Approved Oct 6, 2026.

## Objective
Stand up a reproducible local Docker Compose environment where nginx reverse-proxies both a Fastify server and the webpack-dev-server under one origin, so the frontend can make same-origin HTTP requests to a real backend during development. This module covers only the infra wiring — it delivers a bare Fastify skeleton (one health-check route); the actual failure-simulation logic is the next module (`failure-simulation-api`), built on top without touching this one.

## Tech Stack
- Docker + Docker Compose v2 (`docker compose` CLI)
- nginx (`nginx:alpine`), custom `default.conf`
- Fastify on the latest Node release (pinned to a specific tag, not a floating alias — see Open Questions resolution below), TypeScript, `ts-node-dev` for hot reload
- Existing webpack-dev-server, containerized to run `npm start` from the existing root

## Commands
```
Start everything:            docker compose up --build
Stop everything:             docker compose down
Rebuild one service:         docker compose up --build fastify
Fastify logs:                docker compose logs -f fastify
Fastify local install:       cd server && npm install
Fastify dev (outside compose, fast iteration): cd server && npm run dev
```

## Project Structure
```
docker-compose.yml        → orchestrates nginx, fastify, webpack-dev-server
docker/
  nginx/default.conf       → "/" → webpack-dev-server, "/api" → fastify; Upgrade/Connection headers proxied for HMR websocket
  fastify/Dockerfile        → latest-Node image, installs server/ deps, runs dev reloader
  webpack/Dockerfile        → Node image, installs root deps, runs `npm start`
server/
  src/index.ts              → Fastify bootstrap: app instance, one placeholder route, listen
  package.json              → Fastify + TypeScript + dev-reload tooling — separate dependency tree from root
  tsconfig.json
```

## Code Style
```typescript
import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
```
TypeScript strict mode (mirrors root `tsconfig.json`); one responsibility per file; TSDoc on exported functions per `DESIGN_GUIDE.md`.

## Testing Strategy
Infra wiring, not business logic — no Jest unit tests here. Verification is manual:
- `docker compose up --build` succeeds, all three containers running
- `http://localhost:8080/` serves the frontend; editing a source file triggers HMR in the browser
- `http://localhost:8080/api/health` returns `{"status":"ok"}` from Fastify
- No CORS errors in the browser console
- Only port 8080 (nginx) is published on the host — confirmed via `docker compose ps`

## Boundaries
- **Always:** pin image tags explicitly in each Dockerfile (even "latest" resolves to a documented, specific tag — no floating aliases); keep nginx config limited to proxy rules only; publish only nginx's port to the host.
- **Ask first:** changing the external port from 8080; adding more services to compose; merging `server/`'s dependencies into the root `package.json` (e.g. via workspaces).
- **Never:** expose Fastify's or webpack-dev-server's ports directly to the host; commit `node_modules`/`.env`; hardcode host-absolute paths in `docker-compose.yml`.

## Success Criteria
- One command (`docker compose up --build`) starts the full environment.
- Frontend and API share one origin (`http://localhost:8080`), `/api/*` → Fastify, everything else → webpack-dev-server with working HMR.
- `failure-simulation-api` can be built directly on this skeleton without touching nginx/compose config.

## Open Questions — resolved
- **Node tag for Fastify container:** pin to the latest stable Node release tag available at implementation time (e.g. `node:23-alpine` or newer, whatever is current when `server/Dockerfile` is actually written) — not the floating `node:current-alpine` alias, per the "Always pin image tags" boundary above. The exact tag is confirmed when Phase 4 (Implement) writes the Dockerfile.
