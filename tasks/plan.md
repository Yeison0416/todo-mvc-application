# Implementation Plan: dev-infra (Foundation Layer)

> Module of [`docs/specs/CAPABILITY-MAP-foundation-layer.md`](../docs/specs/CAPABILITY-MAP-foundation-layer.md).
> Spec: [`docs/specs/SPEC-dev-infra.md`](../docs/specs/SPEC-dev-infra.md).
> Amended Oct 19, 2026 to a **hybrid** setup (frontend dev server on the host, backend infrastructure in containers) — see [Scope changes](#scope-changes).

## Overview

Stand up a Docker Compose environment — nginx and a Fastify skeleton in containers — where nginx is the single entry point (`localhost:8080`) for both the API and the frontend dev server, which runs directly on the host (hybrid). Later modules (`failure-simulation-api`, `http-client`) then have real infra to build on without touching nginx or compose config themselves.

## Architecture Decisions

- **Build the Fastify skeleton standalone first, containerize second.** Each piece (Fastify app, its Dockerfile, nginx config) is verified on its own before being wired together in compose — so a failure is traceable to one layer, not the whole stack at once.
- **Hybrid: the frontend runs on the host, the backend infrastructure runs in containers.** Native file watching gives fast rebuilds and HMR (no bind-mount polling), and the layer no longer needs a container per bundler — any dev server that satisfies the frontend contract in the spec fits.
- **nginx stays the single entry point (one origin).** The browser only ever opens `localhost:8080`. nginx routes `/api/` to the Fastify container and `/` to the host dev server via `host.docker.internal`. Chosen over the frontend calling the API from its own port (cross-origin again: needs CORS and preflight handling, including for the custom header used to select failure responses) and over a proxy inside the frontend's webpack config (couples the layer to the frontend's config).
- **nginx only after Fastify is containerized.** A reverse proxy config can't be meaningfully verified against nothing; nginx wiring comes last.
- **Only nginx's port is published to the host** (per spec boundary) — Fastify is reachable only on the internal compose network. The frontend dev server is a host process on its own port.

## Task List

### Phase 1: Fastify standalone
- [x] Task 1: Fastify skeleton (`server/`)
- [x] Task 2: Dockerize Fastify

### Checkpoint: Phase 1
- [x] Fastify container builds and runs standalone
- [x] Fastify container responds to `/health` on its own mapped port
- [x] Reviewed with human (PRs #4 and #5)

### Phase 2: Reverse proxy and composition
- [x] Task 3: nginx reverse proxy config
- [ ] Task 4: `docker-compose.yml` wiring + end-to-end verification

### Checkpoint: Complete
- [ ] `docker compose up --build` starts both services (nginx, fastify)
- [ ] The frontend dev server runs on the host and is reachable through `http://localhost:8080/` with working HMR
- [ ] `http://localhost:8080/api/health` returns `{"status":"ok"}`
- [ ] Only nginx's port is published (`docker compose ps`)
- [ ] No CORS errors in browser console
- [ ] Review with human before starting `failure-simulation-api`

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| nginx container can't reach a service on the host (`host.docker.internal` on Colima; dev server listening on localhost only) | High — `/` returns 502 | Verify reachability first in Task 3/4 before building anything on it; if needed, have the dev server listen on all interfaces; add `extra_hosts: host.docker.internal:host-gateway` in compose for portability |
| HMR websocket doesn't survive the nginx proxy, or the HMR client dials the dev server's own port instead of the page's origin | Medium — dev experience degrades to manual refresh, console shows failed `ws://localhost:<port>/ws` | Treat HMR as an explicit acceptance criterion in Task 4; `Upgrade`/`Connection` headers built into Task 3 from the start; the frontend contract requires the HMR client to use the page's origin (webpack `--client-web-socket-url-port 0`, Vite `server.hmr.clientPort`) |
| Port clash: the host dev server defaults to 8080, the same port nginx publishes | Medium — one of them fails to start | Frontend dev server moves to port 3001 (decided Oct 19, 2026); nginx keeps 8080 per the spec |
| nginx config check fails standalone because the upstream hostnames (`fastify`, `host.docker.internal`) don't resolve outside compose | Low | Run the Task 3 check with `--add-host` entries for both names, or inside the compose network |
| Frontend toolchain is no longer containerized, so it depends on the host's Node version (`.nvmrc` says v21.6.1, which Jest 30 does not support) | Low–Medium — works on one machine, breaks on another | Out of scope for this module; fix `.nvmrc` to the supported Node version separately |
| Pinned "latest Node" tag goes stale | Low | Tag is explicit and dated in the Dockerfile comment; revisited if a future module needs a newer feature |
| Host port 8080 conflicts with another local process | Low | Document the port in README; make it overridable via `docker-compose.override.yml` if it becomes a real problem |

## Open Questions

None open.

### Resolved

1. **Host reachability from the nginx container** (resolved Oct 19, 2026, Task 3). On Colima, a container started with `--add-host host.docker.internal:host-gateway` reaches a host server on port 3001 whether it is bound to `127.0.0.1` or `0.0.0.0`, so the dev server does not need to listen on all interfaces. Compose still needs the `extra_hosts` entry (Task 4).

## Decisions

- **nginx image: `nginx:1.31.7-alpine3.24`** (Oct 19, 2026), the explicit tag behind `nginx:alpine`. There is no nginx Dockerfile, so the pin goes in `docker-compose.yml` (Task 4) with a dated comment.
- **Frontend dev server port: 3001** (developer, Oct 19, 2026). nginx keeps 8080. Applying it means touching the frontend's dev server config or start command, which the spec lists as "ask first"; it happens in Task 4, with review.

## Scope changes

**Oct 19, 2026 — hybrid setup; the webpack container (old Task 3) is out of scope.**
The original plan containerized webpack-dev-server with the source bind-mounted from the host. In practice file-change events from a macOS bind mount did not reach the container, so webpack needed polling to notice edits, and the HMR client dialed the container's internal port instead of the published one. Running the frontend dev server on the host gives native file watching and removes both workarounds, and it frees the layer from needing one container per bundler. Decision (developer): keep the frontend on the host, keep nginx as the single entry point, and remove the webpack container.

- Old Task 3 (Dockerize webpack-dev-server) was dropped, and the remaining tasks were renumbered: old Task 4 (nginx) is now Task 3, old Task 5 (compose) is now Task 4.
- The work done for it lives only on the unmerged branch `feature/dockerize-webpack-dev-server` and is not part of the module.
