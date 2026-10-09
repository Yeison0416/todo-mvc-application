# Foundation Layer — Confirmed Intent

> Captured from interview session, Oct 4 2026.
> Do not treat this as an implementation spec — the step-by-step plan comes later.
> Precedes Phase 2 (spec-driven-development) of the main TodoMVC feature work — see [`todomvc.md`](./todomvc.md).

---

## Outcome

Build a local, Dockerized foundation layer — **nginx** reverse-proxying a **Fastify** mock API and the **webpack dev server** under a single origin — that wires the TodoMVC frontend's HTTP layer to a real backend, with a unified RxJS state store and a defined failure taxonomy. The goal is to be able to deliberately trigger and visually verify every failure path (and the success path) before any TodoMVC feature work begins, so that subsequent feature work (components, services, utils) doesn't have to also solve HTTP, error-handling, and state-management concerns.

---

## User & Motivation

- **Who:** Yeison — first time working with server/backend infrastructure; this is a deliberate skill-building exercise, not just plumbing.
- **Why now:** Cross-cutting concerns (HTTP requests, error/failure handling, state management) should be solid and reusable *before* building the actual TodoMVC components/services/utils, so that feature work starts on stable ground instead of discovering these gaps mid-feature.

---

## Infrastructure

- **Docker Compose** with three services:
  - `nginx` — reverse proxy, single entry point
  - `fastify` — mock API server (app config endpoint + failure simulation)
  - `webpack-dev-server` — frontend
- `nginx` reverse-proxies **both** the Fastify API and the webpack dev server under **one origin** (avoids CORS; requires `Upgrade`/`Connection` headers proxied correctly for webpack's HMR websocket).

## Failure Model

Two tiers of simulated failure:

- **nginx-level (infra):** 502 / 503 / 504, timeout, connection issues
- **Fastify-level (app):** 4xx, validation / business-rule errors

**Trigger mechanism:** a request **header** selects the response. The header value maps to one of: success, or one of the failure categories below. Used both for manual browser verification and for automated tests (no query params).

**Failure contract:**

```typescript
interface FailureReason {
  category: 'network' | 'timeout' | 'server' | 'validation' | 'unknown';
  httpStatus?: number;   // present if an HTTP response was actually received
  code: string;          // stable machine id, e.g. 'APP_CONFIG_FETCH_TIMEOUT'
  message: string;       // human-readable, UI-safe
  retryable: boolean;    // true for network/timeout/server; false for validation
  timestamp: string;     // ISO timestamp
}
```

Each of the four named categories renders its own layout shell. `unknown` falls back to one generic layout shell.

---

## HTTP Layer

- Concrete implementation: **Axios**.
- The application depends on an **abstraction** (an `HttpClient`-style interface), not on Axios directly.
- The concrete Axios adapter is **injected** (dependency injection — constructor/factory injection), so swapping the underlying request technology later requires touching only the adapter, not consumers.

## State Management

- **One unified state store per data source** (not separate success/failure stores).
- Single observable modeling a discriminated union, e.g.:
  `{status:'loading'} | {status:'success', data} | {status:'failure', reason: FailureReason}`

## Success Path

- On a successful response, the state store hydrates with the fetched app config and the UI actually **renders** it — not a `console.log`.
- Render target: a **minimal standalone "config loaded" view**, not the full existing TodoMVC shell. Real feature components/shell come later, in the feature-by-feature TodoMVC work.

---

## Success Criteria (Definition of Done)

Both of the following must hold:

1. **Manual verification:** setting the header to each of the five values (success + 4 failure categories + unknown) and visually confirming the correct layout renders in the browser each time.
2. **Automated tests (TDD, Jest):**
   - HTTP layer: mock Axios responses/rejections and assert correct mapping to the right `FailureReason` category (or success) — without hitting the real Fastify server.
   - State store: assert correct state-transition shape/order for each outcome.
   - Injection: assert swapping the injected `HttpClient` implementation doesn't require touching service/state code.

---

## Out of Scope

- Todo CRUD, filters, or routing (main TodoMVC feature work — later, feature-by-feature)
- Production deployment concerns (TLS, scaling)
- Authentication
- Building out the full TodoMVC shell/components beyond the minimal standalone success view

---

## References

- [`personal-development-flow.mmd`](../../personal-development-flow.mmd) — "Coding Discipline and Quality" subgraph, the visual basis for this layer
- [`todomvc.md`](./todomvc.md) — confirmed TodoMVC intent and existing architecture (MVVM-inspired, RxJS services, mock REST API client for app config, localStorage repo for todos)
- [`ai-development-philosophy.md`](../../ai-development-philosophy.md), [`ai-development-workflow.md`](../../ai-development-workflow.md) — governing AIDD philosophy/workflow

---

## Confirmation

Explicit **yes** from developer on Oct 4, 2026.
