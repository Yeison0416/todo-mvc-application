/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/test/setup/jest.setup.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    clearMocks: true,
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/types/**', '!src/test/**', '!src/**/*.test.ts'],
    coverageDirectory: 'coverage',
    // text = per-file % table in the terminal; html = open coverage/lcov-report/index.html for line-by-line
    coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
    moduleNameMapper: {
        '\\.(scss|sass|css)$': '<rootDir>/src/test/mocks/styleMock.ts',
        '^reset-css$': '<rootDir>/src/test/mocks/styleMock.ts',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.jest.json',
            },
        ],
    },
};
