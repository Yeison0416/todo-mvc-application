/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
    coverageReporters: ['text', 'html'],
    coverageThreshold: {
        global: { statements: 90, branches: 90, functions: 90, lines: 90 }
    }
};
