import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,

    {
        rules: {
            'no-unused-vars': 'warn',
            'no-undef': 'warn',
        },
        parser: '@babel/eslint-parser',
        parserOptions: {
            requireConfigFile: false,
            babelOptions: {
                presets: ['@babel/preset-typescript'],
            },
        },
    },

    {
        files: ['**/*.test.ts', '**/jest.setup.ts'],
        languageOptions: {
            globals: globals.jest,
        },
    },
];
