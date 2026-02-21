# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## PWA Setup (Demo Mode)

This client now includes minimal PWA settings for Chrome app-like launch:

- `public/manifest.webmanifest` (name, icon, theme color, `display: standalone`)
- `public/sw.js` (minimal service worker cache policy)
- `src/main.jsx` service worker registration
- `index.html` manifest/theme meta tags

### Localhost install test

1. Run dev server: `npm run dev`
2. Open Chrome at `http://localhost:5173`
3. Open DevTools -> Application:
   - Service Workers: `sw.js` is registered
   - Manifest: no installability error
4. Install app:
   - Address bar install icon or
   - Chrome menu -> `Install DDANG Capture`
5. Launch installed app and verify it opens as a standalone window (no tab/address bar).

### Production install test

1. Build: `npm run build`
2. Preview: `npm run preview`
3. Open Chrome at preview URL (default `http://localhost:4173`)
4. Repeat the install checks above.

### Cache policy note

- Only same-origin static assets are cached minimally.
- `/api/*`, `/games/*`, and external scripts are excluded from cache handling.
- On localhost, runtime fetch caching is disabled to avoid development breakage.
