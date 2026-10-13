# RaceAnalytics — app

Aplicación React + Vite + TypeScript. Analiza inscripciones a carreras desde Excel **sin persistencia**.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (`tsc -b` + `vite build`) |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (escritura) |
| `npm run test` | Vitest (una pasada) |
| `npm run test:watch` | Vitest en modo watch |
| `npm run coverage` | Cobertura (módulo `domain`) |

## Datos de prueba

`node scripts/make-sample.mjs [--rows N] [fichero ...]` genera `sample/sample.xlsx`
anonimizado a partir de `../bd empate/`. **Nunca** copia DNI ni teléfonos.
`sample/` está en `.gitignore`.

## Despliegue

Base de Vite configurada para GitHub Pages: `/race-analytics/`.
Ver `../docs/spec/08-despliegue-github-pages.md`.

## Estructura

`src/domain/` (lógica pura, sin React), `src/components/`, `src/state/`, `src/lib/`.
Pendiente de crear en F1+. Especificación en `../docs/`.
