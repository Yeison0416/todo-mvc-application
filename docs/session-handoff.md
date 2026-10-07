# Session Handoff — AIDD Setup for TodoMVC

> Written at the end of the setup session, before switching the Claude Code
> project root to this repo. Read this first in the new session to pick up
> where we left off — no need to re-explain context.

---

## What this project is

A TodoMVC-style frontend (TypeScript, Handlebars, SCSS, Webpack, RxJS, Jest),
built as a practice ground for **AI-Driven Development (AIDD)**. Repo:
`Yeison0416/todo-mvc-application`, currently on branch `todomvc-03`.

The AIDD **model/foundation** being followed is Addy Osmani's `agent-skills`
repo, forked at `Yeison0416/agent-skills` and cloned locally as a **sibling
folder** at `../Addy-Osmani/agent-skills` (i.e. outside this repo, under the
shared `development-practice/` workspace). Key reading in that fork:

- `agent-skills/yeison/ai-development-philosophy.md` — developer-controlled,
  not autonomous; smallest understandable system; skills-first.
- `agent-skills/yeison/ai-development-workflow.md` — the personal 8-phase
  loop (Context Validation → Planning → Implementation → Developer
  Validation → Commit → Peer Review → History → Ship) mapped to upstream
  skills.

## Phase 1 is done — confirmed intent

`docs/intent/todomvc.md` (this repo) is the confirmed-intent doc from an
`interview-me` session, explicit yes given Aug 29, 2026. Summary:

- **Goal:** exact functional parity with the [TodoMVC web-components
  example](https://todomvc.com/examples/web-components/dist/), on the
  **existing scaffold** (don't wipe it), following `DESIGN_GUIDE.md` as a
  binding reference.
- **Architecture:** MVVM-inspired, Angular-component-discipline without
  Angular: Domain → Application/Controller → Services (RxJS) →
  Infrastructure → Presentation (Handlebars components). Unidirectional
  data flow, immutable state, BEM CSS, `$`-suffixed observables.
- **Data:** two sources — a mock REST API/HTTP client for initial app
  config, and a localStorage repository for todo persistence (todos are
  localStorage-only; no HTTP CRUD for todos).
- **Out of scope:** autonomous "prompt → finished code" dumps, replicating
  Angular's runtime, strict TDD from minute one, full a11y audit, wiping the
  scaffold.
- Implementation should proceed **feature-by-feature, vertical slice at a
  time** (add → toggle → filters → routing...), developer approves each step.

**Phase 2 (spec + task breakdown) has NOT started yet** — no `SPEC.md`,
`tasks/plan.md`, or similar exists in the repo. This is the next step.

## Current scaffold (already exists, keep evolving — don't rewrite)

```
src/app/components/to-do-bar/
src/app/components/to-do-form/
src/app/components/to-do-header/
src/app/components/to-do-item/
src/app/components/to-do-list/
src/app/state/to-do-state-store.ts
src/app/to-do-app.ts / .hbs / .scss
src/app/types/types.ts
src/data/data.ts
```

## AIDD tooling decision (why we're switching project root)

We wanted Addy Osmani's full framework (all 25 skills, 9 slash commands, 4
agent personas, 7 shared reference checklists) **available locally to this
project only** — not installed globally via Claude Code's plugin
marketplace — so it can be trialed before committing to a global install.

We copied everything into `todo-mvc-application/.claude/`:

- `.claude/skills/` — all 25 skills (byte-identical to upstream, verified
  via `diff -rq`), each keeping its own self-contained `references/`
  subfolder where it had one (e.g. `security-and-hardening/references/`,
  `constraint-driven-development/references/`)
- `.claude/references/` — the 7 shared checklists (testing, security,
  performance, accessibility, observability, definition-of-done,
  orchestration-patterns) — placed at the exact relative depth
  (`.claude/references/`) that skill files expect via their `../../references/...` links
- `.claude/agents/` — the 4 personas (code-reviewer, security-auditor,
  test-engineer, web-performance-auditor)
- `.claude/commands/` — the 9 slash commands (`/spec`, `/plan`, `/build`,
  `/test`, `/review`, `/code-simplify`, `/ship`, `/constraints`, `/webperf`).
  **Note:** these originally said "Invoke the `agent-skills:<skill-name>`
  skill" (plugin-namespaced). We stripped the `agent-skills:` prefix since
  these skills aren't installed under a plugin — they need to resolve by
  their bare name.

**Why none of this was invocable in the old session:** that session's
Claude Code project root was the *parent* folder
(`development-practice/`), not this repo — confirmed via
`~/.claude/projects/-Users-...-development-practice/` and an
auto-created `development-practice/.claude/settings.local.json`. Project-
level skill discovery is anchored to the launch directory, so anything
nested under `todo-mvc-application/.claude/` was invisible to that
session, restart or not.

**The fix (why we're here):** relaunch Claude Code with **this repo**
(`todo-mvc-application/`) as the working directory, since it's already its
own git repo and the `.claude/` content above is already sitting at the
correct root for that case. Nothing else needs to move.

## First thing to verify in the new session

Confirm skill discovery actually works now, before anything else:

```
/spec
```

or ask the agent to invoke the `spec-driven-development` skill directly. If
it resolves (unlike the old session's `Unknown skill: spec-driven-development`
error), we're clear to start Phase 2.

## Next step once confirmed

Start **Phase 2 — spec-driven-development + planning-and-task-breakdown**,
using `docs/intent/todomvc.md` as the confirmed input. Output should be a
`SPEC.md` (or equivalent) plus a task breakdown, reviewed and agreed before
any implementation starts, per the workflow's Phase 2 gate.
