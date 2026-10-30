# Tasks: dev-infra (Foundation Layer)

> See [`tasks/plan.md`](./plan.md) for architecture decisions, risks, open questions and the scope-change log.
> Spec: [`docs/specs/SPEC-dev-infra.md`](../docs/specs/SPEC-dev-infra.md).
> Hybrid setup (amended Oct 19, 2026): nginx and Fastify run in containers; the frontend dev server runs on the host.

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
- [x] Dockerfile pins an explicit Node tag (not a floating alias), with a dated comment
- [x] `docker build` succeeds
- [x] Running the container standalone and curling its mapped port returns the `/health` response

**Verification:**
- [x] Manual: `docker build -f docker/fastify/Dockerfile -t fastify-dev .` then `docker run --rm -p 3000:3000 fastify-dev` then `curl localhost:3000/health`

**Dependencies:** Task 1

**Files likely touched:**
- `docker/fastify/Dockerfile`

**Estimated scope:** XS (1 file)

---

## Checkpoint: Phase 1 (Tasks 1–2)
- [x] Fastify container builds and runs standalone
- [x] Fastify container responds to `/health` on its own mapped port
- [x] Reviewed with human (PRs #4 and #5)

---

## Task 3: nginx reverse proxy config

**Description:** Write `docker/nginx/default.conf` routing `/api/` to the Fastify service (by compose service name, not `localhost`, with the `/api` prefix stripped so `/api/health` reaches Fastify's `/health`) and `/` to the frontend dev server running on the host (`host.docker.internal:3001`), including `Upgrade`/`Connection` headers for the HMR websocket. First step: confirm the nginx container can actually reach a dev server running on the host (see Open Question 2 in the plan).

**Acceptance criteria:**
- [x] `default.conf` has two `location` blocks: `/` and `/api/`
- [x] Websocket upgrade headers present on the `/` location
- [x] `/api/` `proxy_pass` targets the Fastify compose service name and strips the `/api` prefix
- [x] `/` `proxy_pass` targets `host.docker.internal` (the host's dev server), not a compose service
- [x] Reachability of a host service from a throwaway nginx container is confirmed (or the fallback noted in the plan is applied)

**Verification:**
- [x] Manual: `nginx -t` syntax check via a throwaway `nginx:alpine` container mounting the config, with `--add-host` entries so the upstream names resolve (full behavioral verification happens in Task 4)

**Dependencies:** Task 2

**Result (Oct 19, 2026):** Host reachability confirmed on Colima: a container with `--add-host host.docker.internal:host-gateway` reached a throwaway server on host port 3001 (HTTP 200), bound to `127.0.0.1` and to `0.0.0.0` alike, so no dev-server bind change is needed. `nginx -t` failed (exit 1, `host not found in upstream "fastify"`) without the `--add-host` entries and passed (exit 0) with them, using `nginx:1.31.7-alpine3.24`. Prefix stripping and the websocket are verified end to end in Task 4.

**Files likely touched:**
- `docker/nginx/default.conf`

**Estimated scope:** XS (1 file)

---

## Task 4: `docker-compose.yml` wiring + end-to-end verification

**Description:** Create `docker-compose.yml` defining the two services (nginx, fastify), publishing only nginx's port (8080) to the host; fastify is reachable only on the internal compose network. nginx gets `extra_hosts: host.docker.internal:host-gateway` so it can reach the frontend dev server on the host on any platform. The frontend dev server is started separately on the host.

**Acceptance criteria:**
- [x] `docker compose up --build` starts both containers successfully
- [x] With the frontend dev server running on the host, `http://localhost:8080/` serves the frontend app
- [x] Editing a frontend source file triggers HMR through the proxy, with no failed `ws://` connections in the browser console
- [x] `http://localhost:8080/api/health` returns `{"status":"ok"}`
- [x] `docker compose ps` shows only nginx's port published

**Verification:**
- [x] Manual: `docker compose up --build`; start the frontend on the host; browser checks above; `docker compose ps`

**Dependencies:** Tasks 1–3

**Result (Oct 19–20, 2026):** `docker compose up --build` started both containers; `docker compose ps` showed only nginx's `0.0.0.0:8080->80` published (Fastify `3000/tcp` internal; host port 3000 refused connections). `/api/health` through nginx returned 200 `{"status":"ok"}`; `/` and `/app.bundle.js` returned 200 through nginx; the websocket handshake through nginx returned `101 Switching Protocols`. The developer confirmed in the browser (Oct 20): no console errors, and editing a source file updates the page. Frontend change (approved by the developer): `webpack.dev.js` `devServer` now sets `port: 3001`, `open: 'http://localhost:8080'` and `client.webSocketURL.port: 0`; `--open` was removed from the `start` script (the bare flag overrides the config and would open `localhost:3001`, skipping nginx). The first webpack compile takes ~35 s and holds requests until it finishes, so an early request through nginx can time out.

**Files likely touched:**
- `docker-compose.yml`
- `webpack.dev.js` and the `start` script in `package.json` (port 3001, HMR client on the page's origin, auto-open on 8080; approved by the developer)
- `CLAUDE.md` and `server/README.md` (stale statements corrected)

**Estimated scope:** S (1–2 files)

---

## Checkpoint: Complete
- [ ] All Success Criteria in `SPEC-dev-infra.md` met
- [x] No CORS errors in browser console (confirmed by the developer, Oct 20)
- [x] Ready for review before starting the `failure-simulation-api` module (developer, Oct 27, 2026)

**Review (Oct 27, 2026):** the README "Getting started" steps were followed in a fresh public clone: `npm install` (23 s, lockfile untouched), `npm run type-check`, `docker compose up --build` (only nginx's port 8080 published; Fastify not reachable from the host), `/api/health` through nginx returned 200, the page and bundle through nginx returned 200, the HMR websocket handshake returned 101, and `/` returned the expected 502 before the dev server was started. Findings fixed: the old README getting-started and usage text, and `.nvmrc` aligned to Node 24. The first box stays open: it can only be confirmed by building `failure-simulation-api` on this skeleton without touching nginx or compose.

---

# Module: failure-simulation-api

> Spec: [`docs/specs/SPEC-failure-simulation-api.md`](../docs/specs/SPEC-failure-simulation-api.md) (approved Oct 29, 2026). Plan note: `tasks/plan.md`, "Scope changes".
> Work in `server/` only. No change to `docker/`, `docker-compose.yml` or the root `package.json`.

## Task 5: Test tooling and `buildApp()` split

**Description:** Add Jest and `ts-jest` to `server/` (public registry only), a `test` script and `jest.config.js`. Move the Fastify instance and `/health` into `src/app.ts` as `buildApp()`; `src/index.ts` only calls `listen()`. Write a first test for `/health` through `app.inject()`.

**Acceptance criteria:**
- [x] `server/package.json` has `jest`, `ts-jest`, `@types/jest` as devDependencies and an `npm test` script
- [x] `buildApp()` exported from `src/app.ts`; `index.ts` only starts it
- [x] `grep -c nexus server/package-lock.json` prints `0`

**Verification:**
- [x] RED: the `/health` test fails before `buildApp()` exists; GREEN: it passes after
- [x] `cd server && npm test` and `npm run type-check` exit 0; `npm run dev` still serves `/health`

**Result (Oct 29, 2026):** RED: with the test and config in place, `npm test` failed with `Cannot find module '../src/app'` (a first run failed for the wrong reason, missing jest types in `tsconfig.json`, and was fixed before counting). GREEN: 1 test passed after `buildApp()` existed. `npm test` and `npm run type-check` exit 0; `grep -c nexus server/package-lock.json` prints 0; `npm run dev` served `{"status":"ok"}` (200) on port 3000. Installed: jest 30.5.2, ts-jest 29.4.15, @types/jest 30.0.0. `server/tsconfig.json` also changed: `rootDir` `.`, `include` adds `test/**/*`, `types: [node, jest]`, `isolatedModules: true` (Node16 modules need it under ts-jest).

**Dependencies:** None
**Files likely touched:** `server/package.json`, `server/package-lock.json`, `server/jest.config.js`, `server/src/app.ts`, `server/src/index.ts`, `server/test/app.test.ts`, `server/tsconfig.json`
**Estimated scope:** S

---

## Task 6: `FailureReason` type and factories

**Description:** `failure/failureReason.ts` with the `FailureReason` type and one factory per category producing the `code`, `httpStatus`, `message`, `retryable` and ISO `timestamp` from the spec table (including the invalid-header 400).

**Acceptance criteria:**
- [ ] Each factory matches its row in the spec table, with no extra fields
- [ ] `timestamp` is a valid ISO string; `message` is UI-safe

**Verification:**
- [ ] RED then GREEN: Jest tests per category (with a fixed clock)

**Dependencies:** Task 5
**Files likely touched:** `server/src/failure/failureReason.ts`, `server/test/failure/failureReason.test.ts`
**Estimated scope:** S

---

## Task 7: Simulation dispatch and `GET /app-config`

**Description:** `failure/simulate.ts` maps the `X-Simulate-Failure` value to a behaviour (JSON failure, 15 s delay for `timeout`, socket destroy for `network`, 400 for an unrecognized value). `config/appConfig.ts` holds the success payload. `routes/appConfig.ts` wires them, registered in `buildApp()`.

**Acceptance criteria:**
- [ ] Absent and `success` return 200 `{ appName: 'TodoMVC', version: '1.0.0' }`
- [ ] `server`, `validation`, `unknown` and an unrecognized value return the spec's status and `FailureReason` body
- [ ] `timeout` waits 15 s (constant) before responding; `network` destroys the socket
- [ ] The header is read only in the app-config route

**Verification:**
- [ ] RED then GREEN: `inject()` tests for every row; `timeout` with fake timers
- [ ] `network` is not observable via `inject()`: covered in Task 8

**Dependencies:** Task 6
**Files likely touched:** `server/src/failure/simulate.ts`, `server/src/config/appConfig.ts`, `server/src/routes/appConfig.ts`, `server/src/app.ts`, tests under `server/test/`
**Estimated scope:** M

---

## Task 8: End-to-end check through nginx

**Description:** With `docker compose up --build`, exercise all six header values via `http://localhost:8080/api/app-config`, and confirm the module needed no infra change.

**Acceptance criteria:**
- [ ] All six values (plus an unrecognized one) behave per the spec table through nginx; `network` shows a 502 from nginx; `timeout` hangs about 15 s
- [ ] `/api/health` still returns `{"status":"ok"}`
- [ ] `git diff main -- docker docker-compose.yml package.json` is empty

**Verification:**
- [ ] Manual: `curl -i -H 'X-Simulate-Failure: <value>' http://localhost:8080/api/app-config` per value; `docker ps` first, to avoid touching containers that are not ours

**Dependencies:** Task 7
**Files likely touched:** `tasks/todo.md` (results), `server/README.md` (usage of the header)
**Estimated scope:** XS

---

## Checkpoint: failure-simulation-api complete
- [ ] All Success Criteria in `SPEC-failure-simulation-api.md` met
- [ ] Then tick the open "All Success Criteria met" box in the `dev-infra` checkpoint above, with a note
- [ ] Review with the developer before starting `http-client`
