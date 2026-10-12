# Pinned 2026-10-12: Node 24 LTS (24.21.0) on Alpine 3.24, same tag as the Fastify image.
# Explicit tag on purpose: no floating aliases (see SPEC-dev-infra.md, Boundaries).
FROM node:24.21.0-alpine3.24

WORKDIR /app

# Dependencies first, so this layer is cached until the manifests change.
COPY package.json package-lock.json ./
RUN npm ci

# Tooling config the webpack build reads (Babel, ESLint, Stylelint, TypeScript).
COPY webpack.common.js webpack.dev.js .babelrc eslint.config.js .stylelintrc tsconfig.json ./
COPY src ./src

# File-change events from a bind-mounted host folder often never reach the container (macOS), so
# webpack would not notice edits. Polling makes the watcher check files on a timer instead.
ENV WATCHPACK_POLLING=true

EXPOSE 8080

# Not `npm start`: it passes --open (no browser in a container) and cannot take a --host
# argument. Binding to 0.0.0.0 is what makes the dev server reachable through a published port.
# --client-web-socket-url-port 0 makes the page's HMR client connect to the port shown in the
# browser's address bar. Without it the client uses the container's internal port (8080), which
# breaks as soon as the published port differs (e.g. -p 8081:8080) or a proxy sits in front.
CMD ["npx", "webpack", "serve", "--config", "webpack.dev.js", "--host", "0.0.0.0", "--client-web-socket-url-port", "0"]
