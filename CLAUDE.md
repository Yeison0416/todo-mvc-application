# TodoMVC application

A TodoMVC frontend (TypeScript, Handlebars, SCSS, Webpack, RxJS, Jest), built to practice developer-controlled AI-driven development. Goal: functional parity with the TodoMVC web-components example, on a clean layered architecture. A local backend/infra layer (`dev-infra`, then later modules) comes first.

## Resuming a session

Project status lives in files, not here. Before acting, read in this order:

1. `tasks/todo.md` and `tasks/plan.md` — current task, what is ticked, open questions, scope-change log
2. `docs/specs/SPEC-dev-infra.md` and `docs/specs/CAPABILITY-MAP-foundation-layer.md` — scope, boundaries, success criteria
3. `docs/intent/foundation-layer.md` and `docs/intent/todomvc.md` — the developer's confirmed intent
4. `git status` and `git log --oneline -10` — the real state of the tree

Re-run a task's verification when its baseline is missing, the code has moved, or the next task depends on it. Do not infer approval from an earlier conversation unless a file records it. `docs/session-handoff.md` is historical, not current status.

## Commands

- `npm start`: webpack on port 3001, opens http://localhost:8080 (the nginx proxy), plus type-check:watch. Never add `--open` to this script (see `docs/gotchas.md`). Other scripts are in `package.json`; there is no lint script (ESLint and Stylelint run through the webpack plugins).
- Backend layer (Fastify in `server/`, nginx, `docker compose up --build`, Colima): see `server/README.md`.

## Conventions

- Frontend: `DESIGN_GUIDE.md` is binding (layers, BEM, `$` suffix, immutable state, JSDoc).
- `server/`: TypeScript strict, one responsibility per file, TSDoc on exports. CommonJS: do not add `"type": "module"` (`ts-node-dev` cannot run ES modules).
- Docker: pin every image tag explicitly (never `latest` or a floating alias) with a dated comment. The Node image is Node 24 LTS.
- npm: **public registry only** (`registry.npmjs.org`); root and `server/` each have an `.npmrc`. The user-level npmrc points at a private mirror and would write its URLs into lockfiles, which breaks `npm ci` in containers. Before committing a lockfile, `grep -c nexus <lockfile>` must print `0`.

## Git workflow

Follow the `git-workflow-and-versioning` skill, plus:

- Fetch and fast-forward `main` before new work, then branch (`feature/<short-description>`, `fix/…`, `chore/…`). Never work directly on `main`.
- Commits: `<type>: <description>` with types `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- **Commit and push only when the developer asks.** Never merge. Never force-push.
- PR template: `.github/pull_request_template.md`. `gh` is not authenticated for github.com here, so give the developer the compare link and a filled-in description to open the PR themselves.

## How we work

- Developer-controlled: the AI proposes, the developer decides. Surface options with a recommendation; make no silent engineering decisions. Spec before code.
- If scope changes, update the intent, capability map, spec, plan and todo together, and record the amendment visibly; do not silently rewrite approved documents.
- Tick a box in `tasks/` only for what was actually verified. Browser-side checks (page loads, HMR in a browser) are left for the developer to confirm.
- For infra and config work, the task's own verification commands act as RED/GREEN: run it first and watch it fail, then make it pass.
- Report outcomes faithfully, including failures and invalid tests. Check a command's exit code, not just the tail of its output.

## Boundaries

- **Ask first:** changing the external port 8080 or the frontend's port 3001; changing the frontend's start command or dev server config; adding services to compose; merging `server/`'s dependencies into the root `package.json`.
- **Never:** publish Fastify's port from compose; containerize the frontend dev server as part of `dev-infra`; commit `node_modules`, `.env` or secrets; hardcode host-absolute paths in `docker-compose.yml`.
- Do not touch the developer's uncommitted work. Revert only your own edits, and check `git status` before any `git checkout`.
- Do not stop, remove or reuse containers you did not start. Run `docker ps` first: a container name or host port may belong to the developer's own test.

## Gotchas

Before touching `docker/`, `docker-compose.yml`, `webpack.dev.js` or the Node/npm setup, read `docs/gotchas.md`.
