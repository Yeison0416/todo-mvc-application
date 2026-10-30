# Server

The Fastify API for the TodoMVC application. It currently serves `GET /health`; the `failure-simulation-api` module will add `GET /app-config`, which returns the app config or a simulated failure selected by a request header.

This is a standalone project with its own `package.json`, separate from the frontend's. For the Docker, nginx and one-origin setup around it, see [`docs/infrastructure.md`](docs/infrastructure.md).

## Getting started

You need **Node.js 24** (`node -v`). All commands run from this folder:

```bash
cd server
npm install
npm run dev                          # starts on port 3000 and reloads on change
curl http://localhost:3000/health    # → {"status":"ok"}
```

To run it behind nginx together with the frontend, use `docker compose up --build` from the repository root (see the [root README](../README.md)).

## Tests and checks

```bash
npm test             # Jest unit tests; they call the app in memory, with no server or Docker
npm run type-check   # TypeScript check, no output files
npm run test:coverage   # tests plus a coverage report; fails below 90%. Open coverage/index.html in a browser
```

## Layout

```
src/app.ts      buildApp(): the Fastify instance and its routes, without listening
src/index.ts    starts the app on port 3000
test/           Jest tests
```

## Notes

- The registry is public npm only (`.npmrc`). Before committing a lockfile, `grep -c nexus package-lock.json` must print `0`.
- Do not add `"type": "module"` to `package.json`: `ts-node-dev` cannot run ES modules.
