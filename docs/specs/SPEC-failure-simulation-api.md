# Spec: failure-simulation-api (Foundation Layer)

> Module of [`CAPABILITY-MAP-foundation-layer.md`](./CAPABILITY-MAP-foundation-layer.md). Depends on: `dev-infra`.
> Approved by the developer, Oct 29, 2026. Decisions marked "developer" were chosen in that session; the status mapping, `code` names and file layout are proposals the developer approved with the spec.

## Objective
Add the Fastify side of the failure model: one endpoint that returns the app config on success, or a simulated failure shaped as a `FailureReason`, selected by a request header. This lets the frontend's HTTP layer, state store and failure UI (later modules) be exercised against a real backend, for manual browser checks and automated tests.

It is built on the `dev-infra` skeleton **without touching nginx or compose config**. That closes the open "All Success Criteria met" box in `SPEC-dev-infra.md`'s checkpoint.

## Tech Stack
- Fastify 5 on Node 24 LTS, TypeScript strict (existing `server/` tree)
- Jest + `ts-jest`, using Fastify's `app.inject()` (no network, no Docker) — new dev dependencies in `server/` only, public registry only
- No new runtime dependencies

## Commands
```
Server dev (outside compose):  cd server && npm run dev
Server type-check:             cd server && npm run type-check
Server tests:                  cd server && npm test            (new script)
Through nginx:                 curl -i -H 'X-Simulate-Failure: server' http://localhost:8080/api/app-config
```

## Contract

### Endpoint
`GET /app-config`, reached as `/api/app-config` through nginx (prefix stripped by the existing config). `GET /health` stays unchanged.

### Selecting the response (developer)
Request header `X-Simulate-Failure`. Absent or `success` returns the app config. Other values map one to one to the `FailureReason` categories:

| Header value | `category` | `httpStatus` | `code` | `retryable` | Behaviour |
|---|---|---|---|---|---|
| absent / `success` | n/a | 200 | n/a | n/a | App config JSON |
| `network` | `network` | none | `APP_CONFIG_FETCH_NETWORK` | true | Fastify destroys the socket; nginx turns it into a 502 |
| `timeout` | `timeout` | none | `APP_CONFIG_FETCH_TIMEOUT` | true | Fastify delays the response past the client timeout (15 s, below nginx's 60 s read timeout; see Timeout invariant) |
| `server` | `server` | 503 | `APP_CONFIG_FETCH_SERVER_ERROR` | true | 503 with a `FailureReason` body |
| `validation` | `validation` | 422 | `APP_CONFIG_FETCH_VALIDATION` | false | 422 with a `FailureReason` body |
| `unknown` | `unknown` | 500 | `APP_CONFIG_FETCH_UNKNOWN` | false | 500 with a `FailureReason` body |
| any other value | `validation` | 400 | `APP_CONFIG_INVALID_SIMULATION_HEADER` | false | 400 with a `FailureReason` body, so a typo is never read as success (developer) |

Fastify emits these itself (developer): nginx passes them through unchanged. They are not nginx-generated error pages.

### Timeout invariant
The simulated `timeout` delay (15 s, a constant in `failure/simulate.ts`, not an env var) must stay longer than the client's request timeout and shorter than nginx's 60 s read timeout. The client timeout belongs to the `http-client` module: it is a setting of the injected Axios adapter, not of this module, and `http-client`'s spec must pick a value below 15 s (proposal: 10 s). This module only records the invariant.

### Bodies
Success: a minimal placeholder, `{ "appName": "TodoMVC", "version": "1.0.0" }`. It is expected to change when the `failure-ui` success view needs more; the module's focus is the failure paths.
Failure: exactly the `FailureReason` from `docs/intent/foundation-layer.md`, with `timestamp` set at response time (ISO string) and `message` UI-safe.

## Project Structure
```
server/
  src/
    index.ts                 → only listen() (calls buildApp)
    app.ts                   → buildApp(): Fastify instance, registers routes (testable without listening)
    routes/appConfig.ts      → GET /app-config: reads the header, dispatches
    failure/failureReason.ts → FailureReason type + factory per category
    failure/simulate.ts      → header value → behaviour (response, delay, socket destroy)
    config/appConfig.ts      → the static success payload
  test/                      → Jest tests mirroring src/
  jest.config.js
```
The `FailureReason` type is duplicated on the frontend side by `http-client`; there is no shared package (merging dependency trees is "ask first").

## Code Style
Match the existing `server/src/index.ts`: 4-space indent, single quotes, `async` handlers, TSDoc on exports, one responsibility per file.

## Testing Strategy
TDD with Jest and `app.inject()`, written before the code:
- each header value returns the status, `code`, `category`, `retryable` in the table above, and a valid ISO `timestamp`
- absent and `success` both return 200 and the config
- an unrecognized header value returns the 400 `validation` body
- `timeout` is tested with fake timers, so the suite does not wait 15 s
- `network` (socket destroy) cannot be fully observed via `inject()`; verified manually through nginx
- the failure body matches `FailureReason` exactly (no extra fields)

Manual, through nginx (`docker compose up --build`): `curl -i` for all six values; confirm `/health` still works and that `git diff` shows no change to `docker/` or `docker-compose.yml`.

## Boundaries
- **Always:** keep `FailureReason` bodies UI-safe; keep one responsibility per file; public npm registry only (`grep -c nexus server/package-lock.json` must print `0`).
- **Ask first:** changing nginx or compose config; adding runtime dependencies; merging `server/` into the root `package.json`.
- **Never:** publish Fastify's port from compose; read the simulation header in any route other than the app-config one; commit `node_modules`/`.env`.

## Success Criteria
- All six header values behave per the table, verified by Jest and by `curl` through `http://localhost:8080/api/app-config`.
- No change to `docker/`, `docker-compose.yml` or the root `package.json`.
- The `Checkpoint: Complete` box in `tasks/todo.md` can be ticked.

## Open Questions
None open.

## Open Questions — resolved (developer, Oct 29, 2026)
1. **`network` simulation:** destroy the socket; it is only a simulation, so nginx's resulting 502 is accepted.
2. **Timeout length:** 15 s stays as a constant. The Axios timeout is covered here as an invariant (see "Timeout invariant"), with its value owned by `http-client`.
3. **Success payload:** minimal placeholder `{ appName, version }`, expected to change later.
4. **Unrecognized header value:** rejected with a `validation` 400.
