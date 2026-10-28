# Local infrastructure architecture

How Docker, Docker Compose, nginx, Fastify and the frontend dev server fit together in this project. This document explains the wiring; it does not cover installation or day-to-day commands (see the [root README](../README.md)) and it describes only what the configuration files in this repository define.

**Contents:** [At a glance](#at-a-glance) · [The components](#the-components) · [Request flow](#request-flow) · [Docker networking](#docker-networking) · [Docker Compose](#docker-compose) · [Configuration map](#configuration-map) · [Design choices and limits](#design-choices-and-limits)

## At a glance

The browser talks to **one address**, `http://localhost:8080`. nginx receives every request and decides, from the URL path, where it goes.

```text
   Browser (your machine)
              │ http://localhost:8080
              ▼ host port 8080 is published to port 80 of the nginx container
┌── Docker: one Compose project, network "<project>_default" (bridge) ─────────────────────┐
│                                                                                          │
│    ┌──────────────────┐                             ┌────────────────────┐               │
│    │  nginx (port 80) ├─── /api/ → fastify:3000 ───▶│ Fastify (port 3000)│               │
│    └────────┬─────────┘                             └────────────────────┘               │
│             │ /  (the page, its assets and the hot-reload websocket)                     │
└─────────────┬────────────────────────────────────────────────────────────────────────────┘
              ▼ host.docker.internal:3001
   webpack-dev-server (on your machine, port 3001)
```

| Component                        | Runs                                       | Role                                                      | Listens on                                           | Defined in                                                                                         |
| -------------------------------- | ------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Web app** (webpack-dev-server) | On the host, not in Docker                 | Builds and serves the frontend, pushes hot-reload updates | 3001                                                 | [`webpack.dev.js`](../webpack.dev.js), the `start` script in [`package.json`](../package.json)     |
| **nginx**                        | Container, image `nginx:1.31.7-alpine3.24` | Single entry point: routes by URL path                    | 80 in the container, published as host port **8080** | [`docker/nginx/default.conf`](nginx/default.conf)                                                  |
| **Fastify**                      | Container built from a Dockerfile          | The API (today one route, `GET /health`)                  | 3000, **not** published                              | [`server/src/index.ts`](../server/src/index.ts), [`docker/fastify/Dockerfile`](fastify/Dockerfile) |
| **Docker**                       | The engine                                 | Runs the containers, creates the network, publishes ports | n/a                                                  | n/a                                                                                                |
| **Docker Compose**               | The orchestrator                           | Declares the two services and how they connect            | n/a                                                  | [`docker-compose.yml`](../docker-compose.yml)                                                      |

## The components

### Web app (frontend dev server)

- It runs **on the host** and is started with `npm start`. It is deliberately not containerized: native file watching gives fast rebuilds and hot reload (see "Scope changes" in [`tasks/plan.md`](../tasks/plan.md)).
- [`webpack.dev.js`](../webpack.dev.js) sets `devServer.port: 3001`, so nginx can own 8080, and `open: 'http://localhost:8080'`, so the browser opens the nginx address and not the dev server's own port.
- `client.webSocketURL.port: 0` makes the hot-reload client connect to **the page's own origin** (port 8080). Without it the client would dial the dev server's port directly and bypass nginx.
- The dev server checks the request's `Host` header. In a test from a container, it answered **403 Forbidden** to `Host: host.docker.internal:3001` and **200 OK** to `Host: localhost:8080`. This is why nginx forwards the browser's original `Host` header instead of using the upstream's name.

### nginx

- Image `nginx:1.31.7-alpine3.24`, pinned with a dated comment in the Compose file.
- [`docker/nginx/default.conf`](nginx/default.conf) is mounted **read-only** at `/etc/nginx/conf.d/default.conf`. The image's own `nginx.conf` includes `/etc/nginx/conf.d/*.conf`, which is how the file is loaded.
- One `server` block: `listen 80; server_name localhost;`. Two `location` blocks:

| Location              | Forwards to                        | Notes                                                                                                                                                                            |
| --------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/`               | `http://fastify:3000/`             | The trailing slash on `proxy_pass` **replaces the matched `/api/` prefix**: `/api/health` reaches Fastify as `/health`. Sends `Host`, `X-Forwarded-For` and `X-Forwarded-Proto`. |
| `/` (everything else) | `http://host.docker.internal:3001` | Sends the original `Host`. Sends `Upgrade` and `Connection` for the hot-reload websocket. `proxy_read_timeout 1h` keeps an idle websocket open (the default is 60 seconds).      |

- A `map` block turns the client's `Upgrade` header into a `Connection` value: `upgrade` when the client asked to upgrade (a websocket), otherwise `close`. Both locations use `proxy_http_version 1.1`.
- nginx contains **no application logic**: it only routes and forwards.

### Fastify

- [`server/src/index.ts`](../server/src/index.ts) creates a Fastify app with logging on, one route (`GET /health` returns `{"status":"ok"}`) and listens on `0.0.0.0:3000`. Listening on `0.0.0.0` (all interfaces) is what lets another container reach it over the Docker network.
- [`docker/fastify/Dockerfile`](fastify/Dockerfile), in order:
    1. `FROM node:24.21.0-alpine3.24`: a pinned Node 24 LTS image.
    2. `WORKDIR /app`.
    3. Copy `package.json` and `package-lock.json`, then `npm ci`: dependencies are installed before the source is copied, so this layer is cached until the manifests change.
    4. Copy `tsconfig.json` and `src/`.
    5. `EXPOSE 3000`: documentation only, it does not publish anything.
    6. `CMD ["npm", "run", "dev"]`, which runs `ts-node-dev --respawn --transpile-only src/index.ts`.
- [`.dockerignore`](../.dockerignore) keeps `node_modules`, `.git`, `dist`, `coverage`, `.claude` and `.cursor` out of the build context.
- The source is **copied into the image**, and no volume is mounted into the container. Editing `server/src` on your machine does not change the running container; rebuild the service for that to take effect.

### Docker

- Docker builds one image (`todo-mvc-application-fastify`, from the Dockerfile above) and pulls the other (`nginx`), then runs each as a container.
- It also creates the network the containers share and, for nginx only, forwards a host port into the container (details below).

### Docker Compose

Compose reads [`docker-compose.yml`](../docker-compose.yml) and manages both services as one project. See [Docker Compose](#docker-compose) below.

## Request flow

### A. An API request: `GET http://localhost:8080/api/health`

1. The browser (or `curl`) sends the request to host port **8080**.
2. Docker forwards host port 8080 to **port 80 of the nginx container** (the `8080:80` mapping).
3. nginx matches `location /api/`, strips the `/api` prefix and proxies to `http://fastify:3000/health`, adding `Host`, `X-Forwarded-For` and `X-Forwarded-Proto`.
4. `fastify` resolves to the Fastify container through Docker's DNS (see [Docker networking](#docker-networking)); the connection stays inside the Compose network.
5. Fastify handles `GET /health` and returns `200 {"status":"ok"}`. nginx relays the response to the client.

Observed in the logs for the same request:

```text
nginx   "GET /api/health HTTP/1.1" 200 15
fastify incoming request: method GET, url "/health", host "localhost:8080", remoteAddress 172.18.0.3 (the nginx container)
```

Fastify received `/health` (the prefix was stripped), still saw the browser's `Host` (`localhost:8080`), and saw nginx, not the browser, as the caller.

### B. A page request: `GET http://localhost:8080/`

1. Same entry as above: host port 8080 to nginx port 80.
2. nginx matches `location /` and proxies to `http://host.docker.internal:3001`, the dev server **on the host**, with the original `Host` header.
3. The dev server answers with the page. Assets such as `/app.bundle.js` follow the same path.

### C. The hot-reload websocket

1. The page opens a websocket to **its own origin** (`localhost:8080`), because of `webSocketURL.port: 0`.
2. nginx matches `location /`, forwards the `Upgrade` header and the `Connection` value computed by the `map` block.
3. The dev server replies `101 Switching Protocols`, and the connection stays open (up to one hour of silence, `proxy_read_timeout 1h`), carrying reload messages to the browser.

### D. Where a request stops when a piece is missing

Only behavior that was observed is listed:

| Situation                                                                | Result                                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| The dev server is not running, request to `/`                            | nginx answers **502 Bad Gateway**                                            |
| The `fastify` name cannot be resolved when nginx loads its configuration | nginx **refuses to start** (`host not found in upstream "fastify"`)          |
| The browser opens `http://localhost:3001` directly                       | The page loads, but `/api/...` returns **404**: there is no API on that port |
| A request to `localhost:3000` from the host                              | Not reachable: Fastify's port is not published                               |

## Docker networking

| Fact              | Detail (observed)                                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Network           | Compose creates `<project>_default`, a **bridge** network (here `todo-mvc-application_default`, subnet `172.18.0.0/16`). The project name defaults to the folder name.                                                                            |
| Membership        | Both containers join it: Fastify at `172.18.0.2`, nginx at `172.18.0.3` in the observed run (addresses are assigned by Docker and can differ).                                                                                                    |
| Name resolution   | Each service is reachable by its **service name** (`fastify`, `nginx`) and by its container name. Containers use Docker's embedded DNS (`nameserver 127.0.0.11`). `fastify` resolved to `172.18.0.2`.                                             |
| Published ports   | Only nginx: host `8080` to container `80`. Fastify has no `ports` entry.                                                                                                                                                                          |
| Reaching the host | `extra_hosts: host.docker.internal:host-gateway` adds the name `host.docker.internal` to nginx, pointing at the host (it resolved to `192.168.5.2` on the machine where this was checked). That is how nginx reaches the dev server on port 3001. |

Who can reach whom:

| From                | To                                      | Works?                                           |
| ------------------- | --------------------------------------- | ------------------------------------------------ |
| Browser on the host | nginx, `localhost:8080`                 | Yes (published port)                             |
| Browser on the host | Fastify, `localhost:3000`               | No (not published)                               |
| nginx               | Fastify, `fastify:3000`                 | Yes (same network, DNS name)                     |
| nginx               | dev server, `host.docker.internal:3001` | Yes, when the request carries an allowed `Host`  |
| Browser on the host | dev server, `localhost:3001`            | The page loads, but there is no API on that port |

Because the browser only ever talks to `localhost:8080`, the page and the API share **one origin**, so there are no cross-origin (CORS) requests to handle.

One nginx behavior to know: it resolves hostnames in `proxy_pass` when it loads its configuration, and this config has no `resolver` directive. If the Fastify container were recreated with a different address, nginx would need a restart or reload to see it (documented nginx behavior; not exercised here).

## Docker Compose

[`docker-compose.yml`](../docker-compose.yml) declares two services. It sets no explicit network, no environment variables, no named volumes and no restart policy.

| Setting       | `nginx`                                                                      | `fastify`                                                                          |
| ------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Image         | `nginx:1.31.7-alpine3.24` (pinned, dated comment)                            | built: `context: .` (the repository root), `dockerfile: docker/fastify/Dockerfile` |
| Ports         | `'8080:80'`, the only published port                                         | none                                                                               |
| Volumes       | `./docker/nginx/default.conf` to `/etc/nginx/conf.d/default.conf`, read-only | none                                                                               |
| `extra_hosts` | `host.docker.internal:host-gateway`                                          | none                                                                               |
| `depends_on`  | `fastify`                                                                    | none                                                                               |

- **Build context.** `context: .` means the whole repository root is the build context (trimmed by `.dockerignore`), because the Dockerfile copies from `server/`.
- **Start order.** `depends_on: fastify` makes Compose start Fastify's container first. It waits only for the container to be **started**, not for the app to be ready: no health check is defined.
- **Relative path.** The nginx mount uses a relative path, so the file works from any checkout location.
- **No automatic restart.** The containers have restart policy `no`: they do not come back by themselves after Docker or its VM restarts.

What the Compose commands do to this infrastructure:

| Command                             | Effect                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `docker compose up --build`         | Builds the Fastify image, creates the network, starts Fastify, then nginx |
| `docker compose up --build fastify` | Rebuilds and restarts only Fastify (needed after editing `server/src`)    |
| `docker compose logs -f fastify`    | Follows Fastify's output                                                  |
| `docker compose down`               | Stops and removes the containers and the network                          |

## Configuration map

| File                                              | What it controls                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`docker-compose.yml`](../docker-compose.yml)     | The two services, the one published port, the nginx config mount, the host mapping, start order |
| [`docker/nginx/default.conf`](nginx/default.conf) | Routing (`/api/` and `/`), prefix stripping, forwarded headers, websocket upgrade               |
| [`docker/fastify/Dockerfile`](fastify/Dockerfile) | The Fastify image: base image, dependency install, copied files, start command                  |
| [`server/src/index.ts`](../server/src/index.ts)   | The API itself: routes and the `0.0.0.0:3000` listener                                          |
| [`server/package.json`](../server/package.json)   | The `dev` script (`ts-node-dev --respawn --transpile-only src/index.ts`) and dependencies       |
| [`.dockerignore`](../.dockerignore)               | What is left out of the Docker build context                                                    |
| [`webpack.dev.js`](../webpack.dev.js)             | The dev server's port (3001), opened URL, and hot-reload connection settings                    |
| [`package.json`](../package.json)                 | The `start` script that launches webpack-dev-server                                             |

## Design choices and limits

- **Hybrid setup.** Only the backend runs in Docker; the frontend dev server runs on the host. The reasons and the decision are recorded in [`tasks/plan.md`](../tasks/plan.md) ("Scope changes") and [`docs/specs/SPEC-dev-infra.md`](../docs/specs/SPEC-dev-infra.md).
- **One entry point.** nginx is the only published port, so the browser sees one origin for the page and the API.
- **Development only.** The Fastify container runs `npm run dev`, and nginx proxies a dev server. Nothing here builds or serves a production bundle.
- **Source is baked into the Fastify image.** Rebuild the service to apply server code changes.
- **Ordering without readiness.** nginx starts after Fastify's container starts, with no health check.
- **No automatic restart.** Containers stay stopped after a Docker or VM restart until started again.
- **Fastify runs as root.** The Dockerfile has no `USER` instruction, and the process list shows `root`. Acceptable for local development.
- **Forwarded headers are sent but unused.** nginx adds `X-Forwarded-For` and `X-Forwarded-Proto` for `/api/`, but the current Fastify code does not read them.
- **Pinned versions.** Image tags are explicit and dated in comments (`docker-compose.yml`, the Dockerfile).
