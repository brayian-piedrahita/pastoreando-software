# Taller de React — Pastoreando (GA7-AA4-EV01)

Proyecto de ejemplo con el que se demuestran los conceptos del taller de React JS:
diferencias entre React y JSX, clases en React, eventos y aplicación de todo ello en
componentes del dominio de Pastoreando (lotes, ganado y alerta de carga).

Es un proyecto independiente: no modifica el backend ni el frontend PWA del repositorio.

## Requisitos

- Node.js 20.19 o superior (o 22.12 o superior)
- npm 10 o superior

## Comandos

```bash
npm install     # instala las dependencias
npm run dev     # servidor de desarrollo (http://localhost:5173)
npm test        # ejecuta las pruebas con Vitest
npm run build   # genera la versión de producción en dist/
```

## Estructura

```
src/
  main.jsx                 punto de entrada (createRoot + StrictMode)
  App.jsx                  pantalla del taller con las tres secciones
  estilos.css              estilos mobile-first con la paleta corporativa
  ejemplos/
    jsx/                     punto 1: React y JSX
    clases/                  punto 2: clases en React (y su equivalente en función)
    eventos/                 punto 3: eventos de React
  utilidades/              lógica pura: regla de carga (RF04), validación de ganado
  pruebas/                 pruebas automatizadas
```

## Correspondencia con los puntos del taller

| Punto | Tema | Código |
|-------|------|--------|
| 1 | Diferencias entre React y JSX | `src/ejemplos/jsx/` |
| 2 | Clases en React | `src/ejemplos/clases/` |
| 3 | Principales eventos de React | `src/ejemplos/eventos/` |
| 4 | Mapa conceptual | se entrega en el informe Word |

## Estándar de codificación

- Componentes en PascalCase y un componente por archivo (`.jsx`).
- Funciones y variables en camelCase; constantes en MAYUSCULAS_CON_GUION_BAJO.
- Código, comentarios y mensajes de consola sin tildes ni eñes; los textos que ve el usuario sí llevan tildes.
- Paleta: verde `#4CAF50` (acciones), rojo `#F44336` (alerta y sin conexión), gris `#F5F5F5` (fondos).
- Objetivos táctiles de al menos 44 px y estilos mobile-first.

## Regla de carga (RF04)

| Porcentaje de ocupación | Estado |
|-------------------------|--------|
| hasta 80 % | NORMAL |
| más de 80 % y hasta 100 % | ALERTA |
| más de 100 % | SOBRECARGA |
