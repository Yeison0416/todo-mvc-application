# Webpack Config TypeScript Starter

A professional starter project for **TypeScript**, **Handlebars**, and **SCSS/SASS** applications using **Webpack** as the bundler. This setup provides a modular, maintainable, and modern frontend workflow ready for development and production.

---

## Features

- TypeScript support with full type safety
- Handlebars templates precompiled and ready to use
- SCSS/SASS modular styles
- Webpack development server with hot-reload
- Production-ready bundling and optimization
- Easy-to-extend project structure

## Getting Started

### Install Dependencies

`npm install`

### Run Development Server

`npm start`

- Opens a local dev server

- Supports live reloading for scripts, styles, and templates

### Build for Production

`npm run build`

- Generates optimized bundle in dist/

- Compiles TypeScript, SCSS, and Handlebars templates

## Usage

1. Add your TypeScript code inside src/scripts.

2. Place SCSS styles in src/styles.

3. Add Handlebars templates in src/templates.

4. Import and use templates in TypeScript like this:

```
import template from './templates/my-template.hbs';
const html = template({ key: 'value' });
document.body.innerHTML = html;
```




