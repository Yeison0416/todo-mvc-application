# Capability Map: Foundation Layer

> Approved Oct 6, 2026. Derived from [`docs/intent/foundation-layer.md`](../intent/foundation-layer.md).
> Module specs live alongside this file as `SPEC-<module-id>.md`.

| Module id | Responsibility | Depends on |
|---|---|---|
| `dev-infra` | Docker Compose: nginx reverse proxy, Fastify skeleton, webpack-dev-server — all under one origin (incl. HMR websocket proxying) | — |
| `failure-simulation-api` | Fastify endpoint(s) returning app config or a simulated failure, selected by request header, per the `FailureReason` contract | `dev-infra` |
| `http-client` | Axios-backed `HttpClient` abstraction, injected via DI, mapping responses/errors into success data or `FailureReason` | `dev-infra` |
| `app-state-store` | Unified RxJS state store (discriminated union: loading/success/failure) consuming `http-client` | `http-client` |
| `failure-ui` | Minimal success view + 4 failure layout shells + 1 generic fallback, driven by `app-state-store` | `app-state-store` |

**Build order:** `dev-infra` → `failure-simulation-api`, `http-client` (parallelizable — `http-client` only needs real infra for manual/integration verification, not for its own unit tests) → `app-state-store` → `failure-ui`

**Rationale:** each module is independently testable and swappable without rewriting the others (e.g. `http-client` could switch from Axios to `fetch` without touching `app-state-store`; `dev-infra` could drop Docker without touching Fastify's failure logic). Mirrors the layering already established in [`todomvc.md`](../intent/todomvc.md) (Infrastructure → Services → Presentation).
