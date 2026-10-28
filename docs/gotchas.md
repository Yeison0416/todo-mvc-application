# Gotchas learned the hard way

Read this before touching `docker/`, `docker-compose.yml`, `webpack.dev.js` or the Node/npm setup. `CLAUDE.md` points here so these facts load only when they are needed.

- Colima shares only the home directory with its VM. A bind mount or copy under `/tmp` is invisible to containers.
- Bind-mounted host folders on macOS do not deliver file-change events to containers, so watchers need polling. This is why the frontend dev server runs on the host, not in a container.
- webpack-dev-server injects its own listening port into the HMR client. Behind a proxy or a remapped port the browser dials the wrong port unless told otherwise (`--client-web-socket-url-port 0`; here it is set as `client.webSocketURL.port: 0` in `webpack.dev.js`).
- The dev server's `open` target is set in `webpack.dev.js` (`http://localhost:8080`, the proxy). Do not add `--open` back to the `start` script: the bare flag overrides the config and opens `localhost:3001`, which skips nginx (`/api` then 404s).
- `docker build .` sends the whole folder as context. The root `.dockerignore` keeps `node_modules` out, and without it the build hangs.
