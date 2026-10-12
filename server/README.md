# dev-infra

A reusable local development infrastructure layer for a frontend app: a backend API, a container setup to run it, and a single entry point that serves both the frontend and the API from one address.

It is meant to be dropped into a frontend project as an extension, so that development only needs to worry about the app itself and not about setting up servers, containers or proxies.

This document explains what the layer contains, what each tool does, and how to run it.

## Goals

- **One command to start everything** (the target, once all pieces below are in place).
- **One origin.** The browser talks to a single address for both the frontend and the API, so there are no cross-origin (CORS) problems in development.
- **Reproducible.** Everything runs in containers with pinned versions, so it behaves the same on every machine.
- **Independent of the app.** The layer knows nothing about the frontend's features. It only needs the frontend's dev server to listen on a port.

## Target architecture

```
Browser  →  http://localhost:8080
                  │
               [ nginx ]              the only port published to your machine
                  │
        ┌─────────┴──────────┐
   "/" (frontend)       "/api" (backend)
        │                    │
 [ frontend dev server ]  [ Fastify ]
```

## What's included

| Piece                                               | State                 |
| --------------------------------------------------- | --------------------- |
| Fastify API skeleton (`server/`)                    | Included and verified |
| Fastify container image (`docker/fastify/`)         | Included and verified |
| Frontend dev server container (webpack, Vite, ...)  | Not included yet      |
| nginx reverse proxy                                 | Not included yet      |
| Docker Compose file that starts everything together | Not included yet      |

Today only the Fastify API exists. It runs either directly on your machine or inside a container, and both are verified. The proxy, the frontend container and Compose are not built yet, so `localhost:8080` does not work yet.

The frontend container is designed to be bundler-agnostic: any dev server that listens on a port and supports a hot-reload websocket should fit. Webpack is the first one planned, so do not assume Vite works until it has been verified.

## What's in the layer

```
server/
  src/index.ts        Fastify app: one route, GET /health
  package.json        dependencies and scripts (separate from the frontend's)
  package-lock.json   exact versions of every installed package
  tsconfig.json       TypeScript settings (strict mode)
  .npmrc              tells npm to use the public registry
  README.md           this document
docker/
  fastify/Dockerfile  recipe for the Fastify container image
.dockerignore         files Docker should not send when building
```

The API has its own dependency tree and does not share `node_modules` with the frontend.

## The tools, and what each one does

**Node.js** runs JavaScript outside the browser. The Fastify server is a Node program. The container pins an LTS release, which is the kind that receives long-term support.

**npm** installs packages and runs scripts. `package.json` lists what the server needs, and `package-lock.json` pins the exact versions. `npm ci` installs exactly what the lockfile says, which is what automated builds use.

**TypeScript** adds types to JavaScript. Node can't run `.ts` files directly, so something has to convert them first.

**ts-node-dev** converts TypeScript to JavaScript in memory, runs it, and restarts the server when a file changes. `--respawn` keeps it alive after a crash, and `--transpile-only` skips type checking for faster restarts. Type checking is a separate command (`npm run type-check`).

**Fastify** is the web framework. It receives HTTP requests and routes them to functions. `app.get('/health', ...)` means "answer `GET /health` with this JSON." It has a built-in logger and JSON validation.

**Docker** packages an app together with everything it needs to run, so it behaves the same on any machine.

- A **Dockerfile** is the recipe.
- An **image** is the built result: a sealed snapshot of a small Linux system with Node and the app inside.
- A **container** is a running copy of an image.

**Colima** is a lightweight Linux VM for macOS. Containers need the Linux kernel, so Colima provides one and runs the Docker engine inside it. The `docker` command on your Mac is only a client that talks to it. Docker Desktop does the same job. Colima is the free, terminal-only alternative.

**nginx** (not included yet) is a reverse proxy: one front door that forwards requests to the right service based on the URL path.

**Docker Compose** (not included yet) starts several containers together from one `docker-compose.yml` file.

## The Dockerfile, line by line

`docker/fastify/Dockerfile`:

| Line                                     | What it does                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `FROM node:<version>-alpine<version>`    | Starts from a ready-made image with Node on Alpine Linux. The tag is pinned, never a floating alias. |
| `WORKDIR /app`                           | Creates and works inside `/app` in the image.                                                        |
| `COPY server/package.json ... ./`        | Copies only the dependency lists first.                                                              |
| `RUN npm ci`                             | Installs the dependencies inside the image.                                                          |
| `COPY server/tsconfig.json ./` and `src` | Copies the code last.                                                                                |
| `EXPOSE 3000`                            | Documents the port the app listens on. It does not publish the port by itself.                       |
| `CMD ["npm", "run", "dev"]`              | The command the container runs on start.                                                             |

The dependency files are copied and installed before the source code on purpose. Docker caches each step, so a source-only change reuses the slow `npm ci` step.

The host's `server/node_modules` is never copied into the image. The image installs its own, so a container never uses packages built for your Mac.

## Running it

All commands run from the **repository root** unless noted.

### Option 1: directly on your machine

```bash
cd server
npm install
npm run dev                          # starts on port 3000 with reload on change
curl http://localhost:3000/health    # → {"status":"ok"}
npm run type-check                   # TypeScript check, no output files
```

### Option 2: in a container

First make sure Docker is running (`colima start`, or open Docker Desktop), then:

```bash
docker build -f docker/fastify/Dockerfile -t fastify-dev .
docker run -d --rm --name fastify-dev-test -p 3000:3000 fastify-dev
curl http://localhost:3000/health    # → {"status":"ok"}
docker stop fastify-dev-test         # --rm removes it once stopped
```

The build context is the repository root (the `.` at the end), because the Dockerfile copies from `server/`.

`-p 3000:3000` connects port 3000 on your machine to port 3000 inside the container.

## Useful commands

```bash
# Containers
docker ps                          # running containers
docker ps -a                       # including stopped ones
docker logs -f <name>              # follow a container's output (Ctrl+C to leave)
docker stop <name>                 # stop a container
docker rm <name>                   # remove a stopped container
docker exec -it <name> sh          # open a shell inside a running container

# Images
docker images                      # list images
docker rmi fastify-dev             # remove an image

# Cleanup
docker system prune                # remove stopped containers and unused images (asks first)

# Colima (the Linux VM that runs Docker on a Mac)
colima status
colima start                       # needed after every reboot
colima stop                        # stops the VM and every container in it
```

## Conventions

- **Pinned image tags.** Every Dockerfile uses an explicit version tag with a dated comment, never `latest` or a floating alias.
- **Public npm registry only.** `server/.npmrc` sets `registry=https://registry.npmjs.org/`. A lockfile that records URLs of a private registry fails in any container or machine without credentials. Before committing a lockfile, check it contains no private-registry URLs.
- **Only the proxy's port is published** to the host once Compose exists. The API and the frontend dev server are reachable only inside the Compose network.
- **CommonJS.** `server/package.json` has no `"type": "module"`, and `tsconfig.json` uses `Node16` resolution. `ts-node-dev` does not support ES modules, so switching to ESM also means replacing the dev reloader.
- **The layer stays app-agnostic.** Nothing here should import from or depend on the frontend's code.

## Troubleshooting

| Symptom                                                      | Likely cause and fix                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `Cannot connect to the Docker daemon`                        | Colima isn't running. Run `colima start`.                                                                                 |
| `port is already allocated` or `address already in use`      | Something is using port 3000. Run `docker ps` to find a container, or `lsof -i :3000` for a local process.                |
| `npm ci` fails with `E401` during the build                  | The lockfile points at a private registry. Check it for private URLs and regenerate against the public registry.          |
| `docker build` hangs at the start                            | The build context is too large. Check that the root `.dockerignore` exists and excludes `node_modules`.                   |
| `Must use import to load ES Module`                          | `"type": "module"` was added to `server/package.json`. Remove it, because the reloader needs CommonJS.                    |
| Changes on your machine don't show up in a running container | Expected: the container has its own copy of the code. A bind mount (mapping a host folder into the container) fixes this. |

## What's planned

1. A container for the frontend dev server, with the source bind-mounted so edits reload in the browser.
2. An nginx config that sends `/` to the frontend and `/api` to Fastify, including the headers the hot-reload websocket needs.
3. A `docker-compose.yml` that starts all three with `docker compose up --build` and publishes only the proxy's port.

After that, the API can grow (for example, endpoints that simulate failures) without changing the proxy or Compose setup.
