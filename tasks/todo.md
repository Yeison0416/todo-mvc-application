# Tasks: dev-infra (Foundation Layer)

> See [`tasks/plan.md`](./plan.md) for architecture decisions, risks, and checkpoints.
> Spec: [`docs/specs/SPEC-dev-infra.md`](../docs/specs/SPEC-dev-infra.md).

## Task 1: Fastify skeleton (`server/`)

**Description:** Initialize a standalone Fastify + TypeScript project under `server/` with one `GET /health` route returning `{ status: 'ok' }`, plus `ts-node-dev` for hot reload during local (non-Docker) development.

**Acceptance criteria:**
- [x] `server/package.json` declares `fastify`, `typescript`, `ts-node-dev`
- [x] `server/tsconfig.json` mirrors root's strict settings
- [x] `server/src/index.ts` boots Fastify on port 3000, host `0.0.0.0`, with `GET /health`

**Verification:**
- [x] Manual: `cd server && npm install && npm run dev`, then `curl http://localhost:3000/health` returns `{"status":"ok"}`

**Dependencies:** None

**Files likely touched:**
- `server/package.json`
- `server/tsconfig.json`
- `server/src/index.ts`

**Estimated scope:** S (3 files)

---

## Task 2: Dockerize Fastify

**Description:** Write `docker/fastify/Dockerfile` using the pinned latest Node tag, installing `server/`'s deps and running the dev reloader inside the container.

**Acceptance criteria:**
- [ ] Dockerfile pins an explicit Node tag (not a floating alias), with a dated comment
- [ ] `docker build` succeeds
- [ ] Running the container standalone and curling its mapped port returns the `/health` response

**Verification:**
- [ ] Manual: `docker build -f docker/fastify/Dockerfile -t fastify-dev .` then `docker run --rm -p 3000:3000 fastify-dev` then `curl localhost:3000/health`

**Dependencies:** Task 1

**Files likely touched:**
- `docker/fastify/Dockerfile`

**Estimated scope:** XS (1 file)

---

## Task 3: Dockerize webpack-dev-server

**Description:** Write `docker/webpack/Dockerfile` that installs root deps and runs the existing `npm start` (webpack serve) inside a container, with source bind-mounted from the host.

**Acceptance criteria:**
- [ ] Dockerfile builds on a Node image
- [ ] Running standalone and visiting the mapped port in a browser serves the TodoMVC app
- [ ] Editing a source file on the host triggers HMR in the browser
- [ ] `node_modules` is not bind-mounted from host (anonymous volume or container-only install)

**Verification:**
- [ ] Manual: `docker build -f docker/webpack/Dockerfile -t webpack-dev .` then `docker run --rm -p 8081:8080 -v $(pwd)/src:/app/src webpack-dev`; edit a file; confirm HMR in browser

**Dependencies:** None (parallel with Tasks 1–2)

**Files likely touched:**
- `docker/webpack/Dockerfile`

**Estimated scope:** S (1 file)

---

## Checkpoint: Phase 1 (Tasks 1–3)
- [ ] Each container builds and runs standalone
- [ ] Fastify container responds to `/health` on its own mapped port
- [ ] Webpack container serves the app with working HMR on its own mapped port
- [ ] Review with human before proceeding to Phase 2

---

## Task 4: nginx reverse proxy config

**Description:** Write `docker/nginx/default.conf` routing `/` to the webpack-dev-server service and `/api` to the Fastify service (by compose service name, not `localhost`), including `Upgrade`/`Connection` headers for the webpack HMR websocket.

**Acceptance criteria:**
- [ ] `default.conf` has two `location` blocks: `/` and `/api/`
- [ ] Websocket upgrade headers present on the `/` location
- [ ] `proxy_pass` targets reference compose service names, anticipating compose networking (not yet verifiable standalone)

**Verification:**
- [ ] Manual: `nginx -t` syntax check via a throwaway `nginx:alpine` container mounting the config (full behavioral verification happens in Task 5)

**Dependencies:** Tasks 2, 3

**Files likely touched:**
- `docker/nginx/default.conf`

**Estimated scope:** XS (1 file)

---

## Task 5: `docker-compose.yml` wiring + end-to-end verification

**Description:** Create `docker-compose.yml` defining the three services (nginx, fastify, webpack), publishing only nginx's port (8080) to the host; fastify and webpack are reachable only on the internal compose network.

**Acceptance criteria:**
- [ ] `docker compose up --build` starts all three containers successfully
- [ ] `http://localhost:8080/` serves the frontend app
- [ ] Editing a frontend source file triggers HMR through the proxy
- [ ] `http://localhost:8080/api/health` returns `{"status":"ok"}`
- [ ] `docker compose ps` shows only nginx's port published

**Verification:**
- [ ] Manual: `docker compose up --build`; browser checks above; `docker compose ps`

**Dependencies:** Tasks 1–4

**Files likely touched:**
- `docker-compose.yml`

**Estimated scope:** S (1 file)

---

## Checkpoint: Complete
- [ ] All Success Criteria in `SPEC-dev-infra.md` met
- [ ] No CORS errors in browser console
- [ ] Ready for review before starting the `failure-simulation-api` module
