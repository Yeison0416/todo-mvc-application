# TodoMVC — Confirmed Intent

> Captured from interview session, Aug 29 2026.  
> Do not treat this as an implementation spec — the step-by-step plan comes later.

---

## Outcome

Build a TodoMVC app with **exact functional parity** with the [web-components example](https://todomvc.com/examples/web-components/dist/), on the **existing project scaffold** (TypeScript, Handlebars, SCSS, Webpack, RxJS, Jest), following **`DESIGN_GUIDE.md`** as a binding engineering reference.

---

## User & Motivation

- **Who:** Yeison — comfortable with the chosen stack.
- **Why:** Practice **US senior frontend engineering standards** and build a portfolio-quality codebase that demonstrates clean architecture, reactive state management, and testable layer boundaries.
- **Learning focus:** Understand **how data flows** from its source through every layer to the final rendered UI — not just how individual pieces are built.

---

## Success Criteria

1. **Functional parity** with the TodoMVC reference:
   - Add, toggle, edit (double-click), delete todos
   - Mark all complete / incomplete
   - Filters with hash routing (`#/`, `#/active`, `#/completed`)
   - Item count, clear completed
   - localStorage persistence (`id`, `title`, `completed`; key format `todos-[framework]`)
   - Official TodoMVC CSS and behavior

2. **Architecture is visibly clean** — a reviewer can trace:
   ```
   User Action → Controller → Service → Domain → State → Component → Template → DOM
   ```

3. **Data flow is understandable** — for every feature, it is clear:
   - When and how data enters the application
   - Which layer receives and owns the data
   - How data moves through layers
   - How components transform data into DOM elements
   - How the browser renders the result

4. **Meaningful test coverage** on domain and services, with TDD introduced gradually (tests alongside implementation, not rigid TDD from day one).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript |
| Templates | Handlebars |
| Styles | SCSS (BEM) |
| Bundler | Webpack |
| State / events | RxJS (`BehaviorSubject`, observables with `$` suffix) |
| Tests | Jest + ts-jest |
| HTTP client | fetch, Axios, or similar (TBD at implementation time) |

---

## Architecture

MVVM-inspired clean architecture, aligned with **Angular component-based feature discipline** (without using Angular itself):

| Layer | Responsibility |
|---|---|
| **Domain** | Pure business rules and interfaces. No framework or infrastructure dependencies. |
| **Application (Controller)** | Orchestrates user actions; coordinates between components and services. |
| **Services (Reactive/Data)** | Manages state via RxJS; exposes observables; handles side effects. |
| **Infrastructure** | Data access — HTTP client and localStorage repositories. |
| **Presentation (Components)** | Renders UI via Handlebars; receives state via observables; never mutates state directly. |

### Key principles (from `DESIGN_GUIDE.md`)

- Unidirectional data flow: `User Action → Controller → Service → State Store → Components`
- Immutable state updates
- BEM naming for CSS
- Semantic HTML in templates
- Observable `$` suffix convention
- Subscription cleanup (`takeUntil` or managed `Subscription`)
- JSDoc on public APIs
- SOLID, functional, and reactive patterns throughout

---

## Data Architecture

Two distinct data sources, each with its own infrastructure adapter:

### 1. Mock REST API + HTTP client (initial app config)

- **Purpose:** Fetch **initial application configuration** on first load — UI copy, labels, placeholders (what `src/data/data.ts` represents today).
- **Layer:** Infrastructure (HTTP client + repository).
- **Rule:** Fetching logic stays out of domain and application layers.

### 2. localStorage repository (todo persistence)

- **Purpose:** Persist **todo domain entities** between sessions per TodoMVC spec.
- **Layer:** Infrastructure (localStorage adapter implementing a domain/application interface).
- **Rule:** Services never touch `localStorage` directly.

### Bootstrap flow

```
App start
  → HTTP client fetches app config (mock REST API)
  → localStorage repository loads todos
  → Service hydrates RxJS state (BehaviorSubjects / observables)
  → Controller orchestrates & wires components
  → Components subscribe to observables
  → Handlebars compiles view-model → HTML string
  → DOM API mounts / updates elements
  → Browser renders (text, components, styles)
```

Both the mock REST API and localStorage logic **coexist in the same repo**.

---

## Collaboration Model

**Developer-controlled AI development** — not autonomous development.

```
Understanding → Collaboration → Agreement → Implementation → Validation → Progress
```

The developer remains responsible for engineering decisions. The AI acts as a development partner that can analyze, challenge, research, design, plan, implement, validate, and review — but **must not silently make important engineering decisions** without giving the developer a chance to understand, evaluate, and agree.

Implementation follows **feature-by-feature vertical slices** (e.g., add todo end-to-end before moving to toggle, then filters, then routing), with architecture kept honest at each step.

The **spec/plan for step-by-step implementation** is a separate, later step driven by the developer.

---

## Starting Point

Keep the **existing scaffold** — component folders, Webpack/Jest/ESLint tooling, Handlebars templates, SCSS structure. Evolve it into proper layer boundaries; do not wipe and restart.

The static `src/data/data.ts` file will eventually be replaced by the HTTP fetch layer for app config. The current UI-shape types in `src/app/types/types.ts` will be replaced by a real domain model.

---

## Out of Scope

- Autonomous "prompt → finished code" implementation dumps
- Replicating Angular runtime (DI container, modules, decorators, signals, change detection)
- Wiping existing tooling or component scaffold
- Strict TDD from minute one
- Full accessibility audit (semantic HTML yes; WCAG compliance not a primary goal — per `DESIGN_GUIDE.md`)
- HTTP REST API for todo CRUD (todos are localStorage-only; HTTP is for initial app config only)

---

## References

- [TodoMVC web-components example](https://todomvc.com/examples/web-components/dist/)
- [TodoMVC app spec](https://github.com/tastejs/todomvc/blob/master/app-spec.md)
- [`DESIGN_GUIDE.md`](../../DESIGN_GUIDE.md) — binding engineering reference
- [`README.md`](../../README.md) — project setup and scripts

---

## Confirmation

Explicit **yes** from developer on Aug 29, 2026.
