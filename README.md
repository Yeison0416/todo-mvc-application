# Todo MVC Application

A **TodoMVC-style** frontend built with **TypeScript**, **Handlebars**, **SCSS**, **Webpack**, and **RxJS**. Repository: [Yeison0416/todo-mvc-application](https://github.com/Yeison0416/todo-mvc-application).

This project grew out of a Webpack + TypeScript starter; see `DESIGN_GUIDE.md` for architecture and engineering goals.

---

## Features

- TypeScript support with full type safety
- Handlebars templates, precompiled
- SCSS modular styles
- Webpack development server with hot reload
- Production-ready bundling and optimization
- A local backend environment: an nginx reverse proxy and a Fastify API in Docker, so the frontend and the API share one address (`http://localhost:8080`)

---

## Getting started

This is the manual setup. You start the backend (an nginx reverse proxy and a small API, both in Docker) and the frontend dev server (on your machine). Both are reached through one address: **http://localhost:8080**.

> The application is a work in progress. These steps start the full local environment as it exists today.

### What you need

| Tool                   | Version                                                    | Check with                                      |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| Git                    | any recent version                                         | `git --version`                                 |
| Node.js and npm        | **Node.js 24** (LTS)                                       | `node -v`                                       |
| Docker with Compose v2 | a recent Docker that includes the `docker compose` command | `docker --version` and `docker compose version` |

- If you manage Node.js with nvm, run `nvm install 24 && nvm use 24`.
- **macOS:** Docker Desktop, or [Colima](https://github.com/abiosoft/colima) with the Docker CLI and the Compose plugin (start it with `colima start`).
- **Linux:** Docker Engine with the Compose plugin.
- This setup was verified on macOS with Colima. Linux should work the same way, and Windows has not been tested.

### Run it manually

**1. Get the code and install the frontend dependencies**

```bash
git clone https://github.com/Yeison0416/todo-mvc-application.git
cd todo-mvc-application
npm install
```

`npm install` takes about half a minute. Warnings about deprecated packages are normal. The API installs its own dependencies inside its Docker image, so there is nothing to install for it.

**2. Start the backend (nginx and the API)**

Make sure Docker is running, then:

```bash
docker compose up --build
```

The first run downloads the base images and builds the API image, so it takes longer than later runs. Leave this terminal open: it shows the logs. Alternatively, add `-d` to run it in the background (`docker compose up --build -d`).

Check that it works by opening **http://localhost:8080/api/health** in your browser, or in a new terminal:

```bash
curl http://localhost:8080/api/health
```

You should see `{"status":"ok"}`.

**3. Start the frontend**

In a **new terminal**, in the same project folder:

```bash
npm start
```

webpack builds the application (the first build takes roughly 20 to 40 seconds), then your browser opens **http://localhost:8080**. If it does not open, open that address yourself. Edits to files in `src/` reload the page automatically.

**4. Stop everything**

- In the terminal running `npm start`, press `Ctrl+C`.
- Stop the backend with `docker compose down` (or `Ctrl+C` in the terminal running `docker compose up`, then `docker compose down`).

### Ports

| Port | What runs there                                                    | Use it?                                 |
| ---- | ------------------------------------------------------------------ | --------------------------------------- |
| 8080 | nginx, the single entry point (the app at `/`, the API at `/api/`) | **Yes, always use this one**            |
| 3001 | the frontend dev server, on your machine                           | No, nginx forwards to it                |
| 3000 | the API, inside Docker                                             | No, it is not published to your machine |

Open **http://localhost:8080**, not `http://localhost:3001`. The page also loads on port 3001, but there is no API there, so every `/api/...` request returns 404.

### Troubleshooting

| Symptom                                                          | Likely cause and fix                                                                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cannot connect to the Docker daemon`                            | Docker is not running. Start Docker Desktop, or run `colima start` on macOS.                                                                         |
| `port is already allocated` or `address already in use`          | Another program uses port 8080 or 3001. Find it with `lsof -i :8080` (or `:3001`), then stop it. Do not change the ports: the setup depends on them. |
| The browser shows **502 Bad Gateway** at `http://localhost:8080` | The frontend is not running yet. Start it with `npm start` and wait until webpack prints `compiled successfully`, then refresh.                      |
| The page loads but `/api/...` returns 404                        | You are on port 3001. Use `http://localhost:8080`.                                                                                                   |
| `npm install` or `npm start` fails with a Node.js error          | Check `node -v`. Use Node.js 24.                                                                                                                     |

### Other commands

| Command              | What it does                                                                         |
| -------------------- | ------------------------------------------------------------------------------------ |
| `npm run build`      | Type-checks, then writes the production bundle to `dist/` (takes about a minute)     |
| `npm run type-check` | Runs the TypeScript check only                                                       |
| `npm test`           | Runs the Jest tests. There are none yet, so it currently stops with "no tests found" |

For how Docker, Docker Compose, nginx, Fastify and the frontend dev server are wired together, see [`docker/README.md`](docker/README.md). For the backend layer's goals, tools and troubleshooting, see [`server/README.md`](server/README.md).
