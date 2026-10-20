# Spec: dev-infra (Foundation Layer)

> Module of [`CAPABILITY-MAP-foundation-layer.md`](./CAPABILITY-MAP-foundation-layer.md). Depends on: none.
> Approved Oct 6, 2026. Amended Oct 19, 2026 at the developer's direction: **hybrid** setup — the frontend dev server runs on the host, only the backend infrastructure runs in containers. The webpack container was removed from scope (see `tasks/plan.md`, "Scope changes").

## Objective
Stand up a reproducible local Docker Compose environment where nginx is the single entry point for both a containerized Fastify server and the frontend dev server running on the host, under one origin, so the frontend can make same-origin HTTP requests to a real backend during development. This module covers only the infra wiring — it delivers a bare Fastify skeleton (one health-check route); the actual failure-simulation logic is the next module (`failure-simulation-api`), built on top without touching this one.

The frontend dev server is deliberately **not** containerized: native file watching gives fast rebuilds and HMR, and the layer stays independent of any one bundler.

## Tech Stack
- Docker + Docker Compose v2 (`docker compose` CLI)
- nginx (`nginx:alpine`), custom `default.conf`
- Fastify on Node 24 LTS (pinned to a specific tag, not a floating alias — see Open Questions resolution below), TypeScript, `ts-node-dev` for hot reload
- The frontend dev server (webpack-dev-server today) runs on the host via the project's own start command; it is a dependency of this layer, not part of it (see Frontend contract)

## Commands
```
Start the infrastructure:    docker compose up --build
Stop the infrastructure:     docker compose down
Rebuild one service:         docker compose up --build fastify
Fastify logs:                docker compose logs -f fastify
Start the frontend (host):   the project's own dev command, on port 3001
Open the app:                http://localhost:8080  (through nginx — not the dev server's own port)
Fastify local install:       cd server && npm install
Fastify dev (outside compose, fast iteration): cd server && npm run dev
```

## Architecture
```
Browser  →  http://localhost:8080
                  │
               [ nginx ]  (container; the only published port)
                  │
        ┌─────────┴───────────────┐
   "/" (frontend)            "/api/" (backend)
        │                         │
 host.docker.internal:      fastify:3000
 3001                       (container, internal network only)
 [ dev server on the host ]
```

## Project Structure
```
docker-compose.yml        → orchestrates nginx and fastify; gives nginx host.docker.internal
docker/
  nginx/default.conf       → "/" → frontend dev server on the host, "/api/" → fastify (prefix stripped); Upgrade/Connection headers proxied for the HMR websocket
  fastify/Dockerfile        → Node 24 LTS image, installs server/ deps, runs dev reloader
server/
  src/index.ts              → Fastify bootstrap: app instance, one placeholder route, listen
  package.json              → Fastify + TypeScript + dev-reload tooling — separate dependency tree from root
  tsconfig.json
```

## Frontend contract
What the frontend dev server must satisfy for this layer to work. The layer states these requirements; it does not own the frontend's configuration.

1. **Runs on the host**, started by the project's own dev command, listening on port **3001** (nginx owns 8080, so webpack's default of 8080 must be moved).
2. **Reachable from the nginx container** through `host.docker.internal` (this may require the dev server to listen on all interfaces and not only `localhost` — see Open Questions).
3. **Accepts the proxied `Host` header** (`localhost:8080`); nginx forwards the original host.
4. **HMR client connects to the page's origin**, so the websocket goes through nginx. webpack-dev-server injects its own listening port into the client by default, which breaks behind a proxy (webpack: `--client-web-socket-url-port 0`; Vite: `server.hmr.clientPort`).

Anything that meets these four points fits the layer, regardless of bundler.

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
- `docker compose up --build` succeeds, both containers running
- With the frontend dev server running on the host, `http://localhost:8080/` serves the frontend; editing a source file triggers HMR in the browser through the proxy, with no failed websocket connections in the console
- `http://localhost:8080/api/health` returns `{"status":"ok"}` from Fastify
- No CORS errors in the browser console
- Only port 8080 (nginx) is published on the host by compose — confirmed via `docker compose ps`

## Boundaries
- **Always:** pin image tags explicitly in each Dockerfile (even "latest" resolves to a documented, specific tag — no floating aliases); keep nginx config limited to proxy rules only; publish only nginx's port to the host; keep the layer independent of the frontend's code and config (document requirements in the Frontend contract instead).
- **Ask first:** changing the external port from 8080; changing the frontend's port, start command or dev server config (e.g. to satisfy the Frontend contract); adding more services to compose; merging `server/`'s dependencies into the root `package.json` (e.g. via workspaces).
- **Never:** publish Fastify's port to the host from compose; containerize the frontend dev server as part of this module; commit `node_modules`/`.env`; hardcode host-absolute paths in `docker-compose.yml`.

## Success Criteria
- One command (`docker compose up --build`) starts the infrastructure, plus the project's own dev command starts the frontend.
- Frontend and API share one origin (`http://localhost:8080`), `/api/*` → Fastify, everything else → the frontend dev server on the host with working HMR.
- `failure-simulation-api` can be built directly on this skeleton without touching nginx/compose config.

## Open Questions
- **Host reachability (open).** Whether the nginx container can reach a dev server bound to the host's localhost through `host.docker.internal` on Colima is unverified; the dev server may need to listen on all interfaces. Resolve it as the first step of Task 3. Compose adds `extra_hosts: host.docker.internal:host-gateway` so the name also resolves on Linux.

## Open Questions — resolved
- **Frontend dev server port:** 3001 (decided by the developer, Oct 19, 2026). nginx keeps 8080, so the host dev server moves off webpack's default of 8080. Applying it touches the frontend's dev server config or start command, which stays an "ask first" change: it happens in Task 4, with review.
- **Node tag for the Fastify container:** pinned to Node 24 LTS (`node:24.21.0-alpine3.24`, dated in the Dockerfile comment), not the floating `node:current-alpine` alias, per the "Always pin image tags" boundary above. The original wording said "latest stable release", but Node 26 is not LTS until Oct 28, 2026; Node 24 is LTS and matches the project's dependencies and local Node.
