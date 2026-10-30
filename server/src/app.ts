import Fastify, { FastifyInstance } from 'fastify';

/**
 * Builds the Fastify instance with its routes registered, without listening.
 * Kept separate from `index.ts` so tests can drive it through `app.inject()`.
 *
 * @returns The configured Fastify instance.
 */
export function buildApp(): FastifyInstance {
    const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

    app.get('/health', async () => ({ status: 'ok' }));

    return app;
}
