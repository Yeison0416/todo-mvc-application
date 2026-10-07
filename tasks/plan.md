# Implementation Plan: dev-infra (Foundation Layer)

> Module of [`docs/specs/CAPABILITY-MAP-foundation-layer.md`](../docs/specs/CAPABILITY-MAP-foundation-layer.md).
> Spec: [`docs/specs/SPEC-dev-infra.md`](../docs/specs/SPEC-dev-infra.md).

## Overview

Stand up a Docker Compose environment — nginx reverse-proxying a Fastify skeleton and the existing webpack-dev-server under one origin (`localhost:8080`) — so later modules (`failure-simulation-api`, `http-client`) have real infra to build on without touching nginx or compose config themselves.

## Architecture Decisions

- **Build the Fastify skeleton standalone first, containerize second.** Each piece (Fastify app, each Dockerfile, nginx config) is verified on its own before being wired together in compose — so a failure is traceable to one layer, not the whole stack at once.
- **nginx only after both backing services are containerized.** A reverse proxy config can't be meaningfully verified against nothing; nginx wiring comes last.
- **Only nginx's port is published to the host** (per spec boundary) — Fastify and webpack-dev-server are reachable only on the internal compose network.

## Task List

### Phase 1: Standalone services
- [ ] Task 1: Fastify skeleton (`server/`)
- [ ] Task 2: Dockerize Fastify
- [ ] Task 3: Dockerize webpack-dev-server

### Checkpoint: Phase 1
- [ ] Each container builds and runs standalone
- [ ] Fastify container responds to `/health` on its own mapped port
- [ ] Webpack container serves the app and HMR works via bind mount, on its own mapped port

### Phase 2: Reverse proxy and composition
- [ ] Task 4: nginx reverse proxy config
- [ ] Task 5: `docker-compose.yml` wiring + end-to-end verification

### Checkpoint: Complete
- [ ] `docker compose up --build` starts all three services
- [ ] `http://localhost:8080/` serves the frontend with working HMR
- [ ] `http://localhost:8080/api/health` returns `{"status":"ok"}`
- [ ] Only nginx's port is published (`docker compose ps`)
- [ ] No CORS errors in browser console
- [ ] Review with human before starting `failure-simulation-api`

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| webpack's HMR websocket doesn't survive the nginx proxy (common gotcha) | Medium — dev experience degrades to manual refresh | Treat HMR as an explicit acceptance criterion in Task 5, not an assumption; `Upgrade`/`Connection` headers built into Task 4 from the start |
| Bind-mounting source into containers conflicts with `node_modules` installed in the image (host/container arch mismatch) | Medium — container crashes or uses wrong deps | Use an anonymous volume for `node_modules`, or install deps only inside the container, never bind-mount `node_modules` from host |
| Pinned "latest Node" tag goes stale | Low | Tag is explicit and dated in a Dockerfile comment; revisited if a future module needs a newer feature |
| Host port 8080 conflicts with another local process | Low | Document the port in README; make it overridable via `docker-compose.override.yml` if it becomes a real problem |

## Open Questions

None outstanding — module scope is fully bounded by `SPEC-dev-infra.md`.
