# TodoMVC application

A TodoMVC frontend (TypeScript, Handlebars, SCSS, Webpack, RxJS, Jest) built as practice for developer-controlled AI-driven development. Goal: functional parity with the TodoMVC web-components example, on a clean layered architecture. Before TodoMVC feature work, a local backend/infra foundation layer (`dev-infra` and later modules) is being built.

## Resuming a session

Project status lives in files, not here. Before acting, read in this order:

1. `tasks/todo.md` and `tasks/plan.md` — current task, what is ticked, open questions, scope-change log
2. `docs/specs/SPEC-dev-infra.md` and `docs/specs/CAPABILITY-MAP-foundation-layer.md` — scope, boundaries, success criteria
3. `docs/intent/foundation-layer.md` and `docs/intent/todomvc.md` — the developer's confirmed intent
4. `git status` and `git log --oneline -10` — the real state of the tree

Re-run a task's verification when its recorded baseline is missing, the code has moved, or the next task depends on it. Do not infer approval from an earlier conversation unless a file records it. `docs/session-handoff.md` is a historical note from the tooling setup session, not current status.

## Commands

Root (the frontend):

```
npm test                 # Jest (ts-jest, jsdom); tests live in src/**/*.test.ts (none written yet)
npm run type-check       # tsc --noEmit
npm start                # webpack serve --open on port 8080, plus type-check:watch
npm run build            # type-check + production webpack build
npm run format:check     # prettier --check . (npm run format to fix)
```

There is no lint script: ESLint and Stylelint run through the webpack plugins.

`server/` (Fastify API, separate dependency tree):

```
cd server && npm install
npm run dev              # ts-node-dev on port 3000, reloads on change
npm run type-check
```

Docker (needs the Colima VM running: `colima start`, again after every reboot):

```
docker build -f docker/fastify/Dockerfile -t fastify-dev .
docker run -d --rm --name fastify-dev-test -p 3000:3000 fastify-dev
docker stop fastify-dev-test
```

See `server/README.md` for the layer's architecture, tools and troubleshooting.

## Conventions

- Frontend: follow `DESIGN_GUIDE.md` (binding). Layers Domain → Application/Controller → Services (RxJS) → Infrastructure → Presentation; unidirectional data flow; immutable state; BEM CSS; observables end in `$`; clean up subscriptions; JSDoc on public APIs.
- Formatting (Prettier): 4 spaces, single quotes, semicolons, print width 150.
- `server/`: TypeScript strict, one responsibility per file, TSDoc on exported functions. It is CommonJS: do not add `"type": "module"` (the dev reloader `ts-node-dev` does not support ES modules).
- Docker: pin every image tag explicitly (never `latest` or a floating alias) with a dated comment. The Node image is Node 24 LTS.
- npm: **public registry only** (`registry.npmjs.org`). Root and `server/` each have an `.npmrc` for this. The user-level npmrc points at a private company mirror and would write its URLs into lockfiles, which breaks `npm ci` in containers and for anyone without access. Before committing a lockfile, `grep -c nexus <lockfile>` must print `0`.

## Git workflow

Follow `.claude/skills/git-workflow-and-versioning`.

- Before new work: fetch, fast-forward `main`, then branch from it (`feature/<short-description>`, `fix/…`, `chore/…`). Never work directly on `main`.
- Atomic commits, one logical change each: `<type>: <description>` with types `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- **Commit and push only when the developer asks.** Never merge. Never force-push.
- The PR template is `.github/pull_request_template.md`. `gh` is not authenticated for github.com here, so give the developer the compare link and a filled-in description to open the PR themselves.

## How we work

- Developer-controlled: the AI proposes, the developer decides. Do not silently make engineering decisions; surface options with a recommendation.
- Spec before code. If scope changes, update the intent, capability map, spec, plan and todo together, and record the amendment visibly (do not silently rewrite approved documents).
- One small slice at a time; verify; then commit. Use TDD where it fits. For infra and config work the task's own verification commands act as RED/GREEN (run it first and watch it fail, then make it pass).
- Tick a box in `tasks/` only for what was actually verified. Browser-side checks (page loads, HMR in a browser) are left for the developer to confirm.
- Report outcomes faithfully, including failures and invalid tests. Check a command's exit code, not just the tail of its output.

## Boundaries

- **Ask first:** changing the external port 8080 or the frontend's port 3001; changing the frontend's start command or dev server config; adding services to compose; merging `server/`'s dependencies into the root `package.json`.
- **Never:** publish Fastify's port from compose; containerize the frontend dev server as part of `dev-infra`; commit `node_modules`, `.env` or secrets; hardcode host-absolute paths in `docker-compose.yml`.
- Do not touch the developer's uncommitted work. Revert only your own edits, and check `git status` before any `git checkout`.
- Do not stop, remove or reuse containers you did not start. Run `docker ps` first: a container name or host port may belong to the developer's own test.

## Gotchas learned the hard way

- Colima shares only the home directory with its VM. A bind mount or copy under `/tmp` is invisible to containers.
- Bind-mounted host folders on macOS do not deliver file-change events to containers, so watchers need polling. This is why the frontend dev server runs on the host, not in a container.
- webpack-dev-server injects its own listening port into the HMR client. Behind a proxy or a remapped port the browser dials the wrong port unless told otherwise (`--client-web-socket-url-port 0`).
- `npm start` passes `--open` and cannot take extra arguments, so it can't be reused unchanged in a container.
- `docker build .` sends the whole folder as context. The root `.dockerignore` keeps `node_modules` out, and without it the build hangs.
- `.nvmrc` says v21.6.1, which Jest 30 does not support. The project builds and runs on Node 24.
