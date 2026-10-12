# Pinned 2026-10-09: latest stable Node release (26.11.1) on Alpine 3.24.
# Explicit tag on purpose: no floating aliases (see SPEC-dev-infra.md, Boundaries).
FROM node:26.11.1-alpine3.24

WORKDIR /app

# Dependencies first, so this layer is cached until the manifests change.
COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server/tsconfig.json ./
COPY server/src ./src

EXPOSE 3000

CMD ["npm", "run", "dev"]
